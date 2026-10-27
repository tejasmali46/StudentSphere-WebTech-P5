const express = require('express');
const router = express.Router();
const storage = require('../utils/storage');
const {
  studentValidationRules,
  formatValidationErrors,
  PERMITTED_DEPARTMENTS,
  PERMITTED_YEARS
} = require('../validators/studentValidator');

/**
 * GET /students
 * List all students with search & filter support
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, department, year, msg } = req.query;
    const students = await storage.getAllStudents({ search, department, year });

    let alert = null;
    if (msg === 'created') alert = { type: 'success', text: 'Student profile registered successfully!' };
    if (msg === 'updated') alert = { type: 'success', text: 'Student record updated successfully!' };
    if (msg === 'deleted') alert = { type: 'info', text: 'Student record deleted successfully.' };

    res.render('students', {
      title: 'Enrolled Students — StudentSphere',
      students,
      search: search || '',
      department: department || '',
      year: year || '',
      alert,
      departments: PERMITTED_DEPARTMENTS,
      years: PERMITTED_YEARS
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /students/new
 * Display Student Registration Form
 */
router.get('/new', (req, res) => {
  const isDemoValidation = req.query.demo === 'invalid';
  res.render('student-form', {
    title: isDemoValidation ? 'Register New Student — Validation Error' : 'Register New Student — StudentSphere',
    isEdit: false,
    formAction: '/students',
    student: isDemoValidation ? {
      name: 'T',
      prn: '1234',
      email: 'invalid-email',
      mobile: '12345',
      department: '',
      year: '',
      dob: '2028-12-31'
    } : {
      name: '',
      prn: '',
      email: '',
      mobile: '',
      department: '',
      year: '',
      dob: ''
    },
    errors: isDemoValidation ? {
      name: 'Full Name must be between 3 and 60 characters.',
      prn: 'PRN must be a 10 to 12 digit number (e.g., 202401040083).',
      email: 'Please provide a valid email address.',
      mobile: 'Mobile number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9.',
      department: 'Please select a department.',
      year: 'Please select the year of study.',
      dob: 'Date of Birth cannot be today or in the future.'
    } : {},
    departments: PERMITTED_DEPARTMENTS,
    years: PERMITTED_YEARS
  });
});

/**
 * POST /students
 * Server-side validate and store new student record
 */
router.post('/', studentValidationRules(), async (req, res, next) => {
  try {
    const errors = formatValidationErrors(req);

    if (errors) {
      return res.status(422).render('student-form', {
        title: 'Register New Student — Validation Error',
        isEdit: false,
        formAction: '/students',
        student: req.body,
        errors,
        departments: PERMITTED_DEPARTMENTS,
        years: PERMITTED_YEARS
      });
    }

    await storage.addStudent(req.body);
    res.redirect('/students?msg=created');
  } catch (err) {
    // If PRN duplicate caught at storage layer
    if (err.statusCode === 409) {
      return res.status(422).render('student-form', {
        title: 'Register New Student — Validation Error',
        isEdit: false,
        formAction: '/students',
        student: req.body,
        errors: { prn: err.message },
        departments: PERMITTED_DEPARTMENTS,
        years: PERMITTED_YEARS
      });
    }
    next(err);
  }
});

/**
 * GET /students/:id
 * Display details of a specific student
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await storage.getStudentById(id);

    if (!student) {
      const err = new Error(`Student record with ID '${id}' could not be found.`);
      err.statusCode = 404;
      return next(err);
    }

    const updatedAlert = req.query.updated === 'true'
      ? { type: 'success', text: 'Student record updated successfully!' }
      : null;

    res.render('student-details', {
      title: `${student.name} — Student Profile`,
      student,
      alert: updatedAlert
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /students/:id/edit
 * Display edit form for existing student
 */
router.get('/:id/edit', async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await storage.getStudentById(id);

    if (!student) {
      const err = new Error(`Cannot edit: Student with ID '${id}' was not found.`);
      err.statusCode = 404;
      return next(err);
    }

    res.render('student-form', {
      title: `Edit ${student.name} — StudentSphere`,
      isEdit: true,
      formAction: `/students/${student.id}/edit`,
      student,
      errors: {},
      departments: PERMITTED_DEPARTMENTS,
      years: PERMITTED_YEARS
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /students/:id/edit
 * Validate and update existing student
 */
router.post('/:id/edit', studentValidationRules(), async (req, res, next) => {
  const { id } = req.params;
  try {
    const errors = formatValidationErrors(req);

    if (errors) {
      return res.status(422).render('student-form', {
        title: 'Edit Student — Validation Error',
        isEdit: true,
        formAction: `/students/${id}/edit`,
        student: { ...req.body, id },
        errors,
        departments: PERMITTED_DEPARTMENTS,
        years: PERMITTED_YEARS
      });
    }

    await storage.updateStudent(id, req.body);
    res.redirect(`/students/${id}?updated=true`);
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(422).render('student-form', {
        title: 'Edit Student — Validation Error',
        isEdit: true,
        formAction: `/students/${id}/edit`,
        student: { ...req.body, id },
        errors: { prn: err.message },
        departments: PERMITTED_DEPARTMENTS,
        years: PERMITTED_YEARS
      });
    }
    next(err);
  }
});

/**
 * POST /students/:id/delete
 * Delete student record
 */
router.post('/:id/delete', async (req, res, next) => {
  try {
    const { id } = req.params;
    await storage.deleteStudent(id);
    res.redirect('/students?msg=deleted');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
