const express = require('express');
const router = express.Router();
const storage = require('../utils/storage');
const {
  studentValidationRules,
  formatValidationErrors
} = require('../validators/studentValidator');

/**
 * GET /api/students
 * Fetch all students with optional query filter
 */
router.get('/students', async (req, res, next) => {
  try {
    const { search, department, year } = req.query;
    const students = await storage.getAllStudents({ search, department, year });
    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/students/:id
 * Retrieve specific student
 */
router.get('/students/:id', async (req, res, next) => {
  try {
    const student = await storage.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: `Student with ID '${req.params.id}' was not found.`
      });
    }
    res.json({
      success: true,
      data: student
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/students
 * Create new student via JSON payload
 */
router.post('/students', studentValidationRules(), async (req, res, next) => {
  try {
    const errors = formatValidationErrors(req);
    if (errors) {
      return res.status(422).json({
        success: false,
        statusCode: 422,
        message: 'Server-side validation failed.',
        errors
      });
    }

    const created = await storage.addStudent(req.body);
    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Student registered successfully.',
      data: created
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/students/:id
 * Update student via JSON
 */
router.put('/students/:id', studentValidationRules(), async (req, res, next) => {
  try {
    const errors = formatValidationErrors(req);
    if (errors) {
      return res.status(422).json({
        success: false,
        statusCode: 422,
        message: 'Validation failed.',
        errors
      });
    }

    const updated = await storage.updateStudent(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Student updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/students/:id
 * Delete student via JSON
 */
router.delete('/students/:id', async (req, res, next) => {
  try {
    const deleted = await storage.deleteStudent(req.params.id);
    res.json({
      success: true,
      message: 'Student record deleted successfully.',
      data: deleted
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/stats
 * Return live summary analytics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await storage.getDashboardStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
