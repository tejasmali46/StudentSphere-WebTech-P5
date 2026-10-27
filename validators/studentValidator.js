const { body, validationResult } = require('express-validator');
const storage = require('../utils/storage');

const PERMITTED_DEPARTMENTS = [
  'Computer Engineering',
  'Information Technology',
  'Electronics & Telecommunication',
  'Mechanical Engineering',
  'Chemical Engineering',
  'Civil Engineering'
];

const PERMITTED_YEARS = [
  'First Year',
  'Second Year',
  'Third Year',
  'Final Year'
];

/**
 * Validation rules for Student Registration and Updates
 */
const studentValidationRules = () => {
  return [
    // 1 & 2: Full Name
    body('name')
      .trim()
      .notEmpty().withMessage('Full Name is required.')
      .isLength({ min: 3, max: 60 }).withMessage('Full Name must be between 3 and 60 characters.')
      .matches(/^[a-zA-Z\s.'-]+$/).withMessage('Full Name may only contain letters, spaces, hyphens, and periods.'),

    // 3 & 4: PRN (Permanent Registration Number)
    body('prn')
      .trim()
      .notEmpty().withMessage('PRN is required.')
      .matches(/^\d{10,12}$/).withMessage('PRN must be a 10 to 12 digit number (e.g., 202401040083).')
      // 5: PRN Uniqueness check
      .custom(async (value, { req }) => {
        const student = await storage.getStudentByPrn(value);
        if (student) {
          // If we are updating an existing student, it's allowed if the ID matches
          const currentId = req.params?.id || req.body?.id;
          if (!currentId || student.id !== currentId) {
            throw new Error(`PRN '${value}' is already registered for ${student.name}.`);
          }
        }
        return true;
      }),

    // 6: Email
    body('email')
      .trim()
      .notEmpty().withMessage('Email address is required.')
      .isEmail().withMessage('Please provide a valid email address.')
      .normalizeEmail(),

    // 7: Mobile Number (Indian 10-digit format)
    body('mobile')
      .trim()
      .notEmpty().withMessage('Mobile number is required.')
      .matches(/^[6-9]\d{9}$/).withMessage('Mobile number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9.'),

    // 8: Department
    body('department')
      .trim()
      .notEmpty().withMessage('Please select a department.')
      .isIn(PERMITTED_DEPARTMENTS).withMessage(`Department must be one of: ${PERMITTED_DEPARTMENTS.join(', ')}.`),

    // 9: Year of Study
    body('year')
      .trim()
      .notEmpty().withMessage('Please select the year of study.')
      .isIn(PERMITTED_YEARS).withMessage(`Year must be one of: ${PERMITTED_YEARS.join(', ')}.`),

    // 10: Date of Birth (valid date, not in future, minimum student age check)
    body('dob')
      .trim()
      .notEmpty().withMessage('Date of Birth is required.')
      .isISO8601().withMessage('Date of Birth must be a valid date in YYYY-MM-DD format.')
      .custom(value => {
        const inputDate = new Date(value);
        const today = new Date();
        if (isNaN(inputDate.getTime())) {
          throw new Error('Invalid Date of Birth.');
        }
        if (inputDate >= today) {
          throw new Error('Date of Birth cannot be today or in the future.');
        }
        const minYear = today.getFullYear() - 15;
        if (inputDate.getFullYear() > minYear) {
          throw new Error('Student must be at least 15 years old for collegiate enrollment.');
        }
        return true;
      })
  ];
};

/**
 * Middleware to format validation errors into structured dictionary
 */
const formatValidationErrors = (req) => {
  const result = validationResult(req);
  if (result.isEmpty()) return null;

  const errors = {};
  for (const err of result.array()) {
    // Keep first error per field
    if (!errors[err.path]) {
      errors[err.path] = err.msg;
    }
  }
  return errors;
};

module.exports = {
  studentValidationRules,
  formatValidationErrors,
  PERMITTED_DEPARTMENTS,
  PERMITTED_YEARS
};
