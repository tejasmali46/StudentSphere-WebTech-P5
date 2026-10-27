const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Default data file path
const DEFAULT_DATA_PATH = path.join(__dirname, '..', 'data', 'students.json');

class StorageManager {
  constructor(filePath = DEFAULT_DATA_PATH) {
    this.filePath = filePath;
    this.lock = Promise.resolve(); // Simple write-serialization queue
  }

  /**
   * Set custom file path (useful for testing)
   */
  setFilePath(filePath) {
    this.filePath = filePath;
  }

  /**
   * Reset to default storage path
   */
  resetFilePath() {
    this.filePath = DEFAULT_DATA_PATH;
  }

  /**
   * Ensure directory and initial file exist safely
   */
  async _ensureFile() {
    try {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      try {
        await fs.access(this.filePath);
      } catch {
        // File does not exist, initialize with empty array
        await fs.writeFile(this.filePath, JSON.stringify([], null, 2), 'utf-8');
      }
    } catch (err) {
      throw new Error(`Failed to initialize storage: ${err.message}`);
    }
  }

  /**
   * Read all students from JSON file safely
   */
  async getAllStudents(filter = {}) {
    await this._ensureFile();
    try {
      const rawData = await fs.readFile(this.filePath, 'utf-8');
      const students = JSON.parse(rawData || '[]');

      if (!filter || (!filter.search && !filter.department && !filter.year)) {
        return students;
      }

      const search = (filter.search || '').trim().toLowerCase();
      const dept = (filter.department || '').trim();
      const year = (filter.year || '').trim();

      return students.filter(student => {
        const matchesSearch = !search ||
          student.name.toLowerCase().includes(search) ||
          student.prn.toLowerCase().includes(search) ||
          student.email.toLowerCase().includes(search) ||
          student.department.toLowerCase().includes(search);

        const matchesDept = !dept || student.department === dept;
        const matchesYear = !year || student.year === year;

        return matchesSearch && matchesDept && matchesYear;
      });
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error('Data corruption detected: Failed to parse student database JSON.');
      }
      throw err;
    }
  }

  /**
   * Find a single student by unique ID
   */
  async getStudentById(id) {
    const students = await this.getAllStudents();
    return students.find(s => s.id === id) || null;
  }

  /**
   * Find a single student by PRN
   */
  async getStudentByPrn(prn) {
    const students = await this.getAllStudents();
    return students.find(s => s.prn === prn.trim()) || null;
  }

  /**
   * Thread-safe write helper
   */
  async _writeStudents(students) {
    // Chain onto current lock to serialize concurrent file writes
    this.lock = this.lock.then(async () => {
      await this._ensureFile();
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      await fs.writeFile(tempPath, JSON.stringify(students, null, 2), 'utf-8');
      await fs.rename(tempPath, this.filePath); // Atomic swap
    });
    return this.lock;
  }

  /**
   * Insert new student record
   */
  async addStudent(studentData) {
    const students = await this.getAllStudents();

    // Verify PRN uniqueness
    const exists = students.some(s => s.prn.trim() === studentData.prn.trim());
    if (exists) {
      const err = new Error(`Student with PRN '${studentData.prn}' already exists.`);
      err.statusCode = 409;
      err.field = 'prn';
      throw err;
    }

    const newStudent = {
      id: studentData.id || `std_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      name: studentData.name.trim(),
      prn: studentData.prn.trim(),
      email: studentData.email.trim().toLowerCase(),
      mobile: studentData.mobile.trim(),
      department: studentData.department.trim(),
      year: studentData.year.trim(),
      dob: studentData.dob.trim(),
      createdAt: new Date().toISOString()
    };

    students.push(newStudent);
    await this._writeStudents(students);
    return newStudent;
  }

  /**
   * Update existing student record
   */
  async updateStudent(id, updateData) {
    const students = await this.getAllStudents();
    const index = students.findIndex(s => s.id === id);

    if (index === -1) {
      const err = new Error(`Student with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    // Check duplicate PRN against OTHER students
    const duplicatePrn = students.some(s => s.id !== id && s.prn.trim() === updateData.prn.trim());
    if (duplicatePrn) {
      const err = new Error(`Another student already uses PRN '${updateData.prn}'.`);
      err.statusCode = 409;
      err.field = 'prn';
      throw err;
    }

    const existing = students[index];
    const updated = {
      ...existing,
      name: updateData.name.trim(),
      prn: updateData.prn.trim(),
      email: updateData.email.trim().toLowerCase(),
      mobile: updateData.mobile.trim(),
      department: updateData.department.trim(),
      year: updateData.year.trim(),
      dob: updateData.dob.trim(),
      updatedAt: new Date().toISOString()
    };

    students[index] = updated;
    await this._writeStudents(students);
    return updated;
  }

  /**
   * Delete student record by ID
   */
  async deleteStudent(id) {
    const students = await this.getAllStudents();
    const index = students.findIndex(s => s.id === id);

    if (index === -1) {
      const err = new Error(`Student with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    const deleted = students.splice(index, 1)[0];
    await this._writeStudents(students);
    return deleted;
  }

  /**
   * Compute live dashboard metrics
   */
  async getDashboardStats() {
    const students = await this.getAllStudents();

    const deptCounts = {};
    const yearCounts = {};

    students.forEach(s => {
      deptCounts[s.department] = (deptCounts[s.department] || 0) + 1;
      yearCounts[s.year] = (yearCounts[s.year] || 0) + 1;
    });

    return {
      totalStudents: students.length,
      totalDepartments: Object.keys(deptCounts).length,
      departmentBreakdown: deptCounts,
      yearBreakdown: yearCounts,
      recentStudents: [...students].reverse().slice(0, 5)
    };
  }
}

// Export singleton instance
module.exports = new StorageManager();
