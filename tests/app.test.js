const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;

// Set environment to test
process.env.NODE_ENV = 'test';

const app = require('../app');
const storage = require('../utils/storage');

const TEST_DATA_PATH = path.join(__dirname, '..', 'data', 'students.test.json');

describe('StudentSphere Test Suite (Web Technology Practical 5)', () => {
  let createdStudentId = null;
  const testStudent = {
    name: 'Pranav Joshi',
    prn: '202401049999',
    email: 'pranav.joshi@mitaoe.ac.in',
    mobile: '9822114455',
    department: 'Computer Engineering',
    year: 'Third Year',
    dob: '2004-03-15'
  };

  before(async () => {
    // Isolate test data file
    storage.setFilePath(TEST_DATA_PATH);
    const initialSeed = [
      {
        id: 'seed_001',
        name: 'Seed Student',
        prn: '202401041111',
        email: 'seed.student@mitaoe.ac.in',
        mobile: '9123456780',
        department: 'Computer Engineering',
        year: 'Third Year',
        dob: '2004-01-01',
        createdAt: new Date().toISOString()
      }
    ];
    await fs.writeFile(TEST_DATA_PATH, JSON.stringify(initialSeed, null, 2), 'utf-8');
  });

  after(async () => {
    // Clean up test file and reset storage path
    try {
      await fs.unlink(TEST_DATA_PATH);
    } catch {
      // Ignored if file already removed
    }
    storage.resetFilePath();
  });

  // Test 1: GET / returns successful response
  test('1. GET / returns successful dashboard view (200 OK)', async () => {
    const res = await request(app).get('/');
    assert.equal(res.statusCode, 200);
    assert.match(res.text, /StudentSphere/i);
    assert.match(res.text, /Academic Dashboard/i);
  });

  // Test 2: GET /students returns student list
  test('2. GET /students returns the student directory (200 OK)', async () => {
    const res = await request(app).get('/students');
    assert.equal(res.statusCode, 200);
    assert.match(res.text, /Seed Student/i);
    assert.match(res.text, /202401041111/);
  });

  // Test 3: GET /students/new displays registration form
  test('3. GET /students/new displays the student registration form', async () => {
    const res = await request(app).get('/students/new');
    assert.equal(res.statusCode, 200);
    assert.match(res.text, /Register New Student/i);
    assert.match(res.text, /name="prn"/);
  });

  // Test 4: Valid registration succeeds
  test('4. POST /students with valid input succeeds and redirects (302)', async () => {
    const res = await request(app)
      .post('/students')
      .type('form')
      .send(testStudent);

    assert.equal(res.statusCode, 302);
    assert.equal(res.headers.location, '/students?msg=created');

    const added = await storage.getStudentByPrn(testStudent.prn);
    assert.ok(added, 'Student record should exist in storage');
    assert.equal(added.name, testStudent.name);
    createdStudentId = added.id;
  });

  // Test 5: Empty registration is rejected
  test('5. POST /students with empty fields is rejected (422 Unprocessable Entity)', async () => {
    const res = await request(app)
      .post('/students')
      .type('form')
      .send({});

    assert.equal(res.statusCode, 422);
    assert.match(res.text, /Server-Side Validation Failed/i);
    assert.match(res.text, /Full Name is required/i);
    assert.match(res.text, /PRN is required/i);
  });

  // Test 6: Invalid email is rejected
  test('6. POST /students with invalid email format is rejected (422)', async () => {
    const res = await request(app)
      .post('/students')
      .type('form')
      .send({
        ...testStudent,
        prn: '202401048888',
        email: 'invalid-email-address'
      });

    assert.equal(res.statusCode, 422);
    assert.match(res.text, /Please provide a valid email address/i);
  });

  // Test 7: Invalid mobile number is rejected
  test('7. POST /students with non-10-digit mobile is rejected (422)', async () => {
    const res = await request(app)
      .post('/students')
      .type('form')
      .send({
        ...testStudent,
        prn: '202401048888',
        mobile: '12345'
      });

    assert.equal(res.statusCode, 422);
    assert.match(res.text, /Mobile number must be a valid 10-digit Indian number/i);
  });

  // Test 8: Duplicate PRN is rejected
  test('8. POST /students with duplicate PRN is rejected (422)', async () => {
    const res = await request(app)
      .post('/students')
      .type('form')
      .send({
        ...testStudent,
        name: 'Duplicate PRN User',
        email: 'duplicate.prn@mitaoe.ac.in'
      });

    assert.equal(res.statusCode, 422);
    assert.match(res.text, /already registered/i);
  });

  // Test 9: Valid student details can be retrieved
  test('9. GET /students/:id retrieves student profile details (200 OK)', async () => {
    assert.ok(createdStudentId, 'createdStudentId must be present');
    const res = await request(app).get(`/students/${createdStudentId}`);
    assert.equal(res.statusCode, 200);
    assert.match(res.text, new RegExp(testStudent.name));
    assert.match(res.text, new RegExp(testStudent.prn));
  });

  // Test 10: Unknown student ID is handled correctly
  test('10. GET /students/:id with nonexistent ID returns 404', async () => {
    const res = await request(app).get('/students/nonexistent_id_9999');
    assert.equal(res.statusCode, 404);
    assert.match(res.text, /could not be found|404/i);
  });

  // Test 11: Valid edit updates existing record
  test('11. POST /students/:id/edit updates student record and redirects (302)', async () => {
    const res = await request(app)
      .post(`/students/${createdStudentId}/edit`)
      .type('form')
      .send({
        ...testStudent,
        name: 'Pranav Suresh Joshi',
        department: 'Information Technology'
      });

    assert.equal(res.statusCode, 302);
    assert.equal(res.headers.location, `/students/${createdStudentId}?updated=true`);

    const updated = await storage.getStudentById(createdStudentId);
    assert.equal(updated.name, 'Pranav Suresh Joshi');
    assert.equal(updated.department, 'Information Technology');
  });

  // Test 12: Deleting a student removes record
  test('12. POST /students/:id/delete removes record from storage and redirects', async () => {
    const res = await request(app).post(`/students/${createdStudentId}/delete`);
    assert.equal(res.statusCode, 302);
    assert.equal(res.headers.location, '/students?msg=deleted');

    const check = await storage.getStudentById(createdStudentId);
    assert.equal(check, null, 'Deleted student should not exist in database');
  });

  // Test 13: Unknown routes return 404
  test('13. Unknown route returns 404 page', async () => {
    const res = await request(app).get('/nonexistent-system-route');
    assert.equal(res.statusCode, 404);
    assert.match(res.text, /404/);
  });

  // Test 14: JSON endpoints return valid JSON
  test('14. GET /api/students returns valid JSON payload', async () => {
    const res = await request(app).get('/api/students');
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['content-type'].includes('application/json'), true);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  // Test 15: Error-handling middleware returns appropriate response
  test('15. Central error handling returns JSON 404 for missing API resource', async () => {
    const res = await request(app).get('/api/students/unknown_xyz_999');
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.statusCode, 404);
    assert.match(res.body.message, /not found/i);
  });
});
