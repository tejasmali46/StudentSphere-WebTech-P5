const express = require('express');
const path = require('path');
const morgan = require('morgan');

// Route modules
const pageRoutes = require('./routes/pageRoutes');
const studentRoutes = require('./routes/studentRoutes');
const apiRoutes = require('./routes/apiRoutes');

// Middleware modules
const requestLogger = require('./middleware/requestLogger');
const {
  attachRequestContext,
  responseTimeHeader,
  systemStatusCheck
} = require('./middleware/customMiddleware');
const {
  notFoundHandler,
  centralErrorHandler
} = require('./middleware/errorHandler');

const app = express();

// ==========================================
// 1. Template Engine Configuration
// ==========================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==========================================
// 2. Third-Party Middleware
// ==========================================
// Morgan HTTP logger (suppressed during unit tests)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
}

// ==========================================
// 3. Built-in Middleware
// ==========================================
// Serve static assets from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse URL-encoded bodies from HTML forms
app.use(express.urlencoded({ extended: true }));

// Parse incoming JSON payloads
app.use(express.json());

// ==========================================
// 4. Custom Middleware
// ==========================================
app.use(requestLogger);
app.use(responseTimeHeader);
app.use(attachRequestContext);
app.use(systemStatusCheck);

// ==========================================
// 5. Application Routes (Express Router)
// ==========================================
app.use('/', pageRoutes);
app.use('/students', studentRoutes);
app.use('/api', apiRoutes);

// ==========================================
// 6. Centralized Error Handling
// ==========================================
// Catch-all for unhandled routes (404)
app.use(notFoundHandler);

// Central error handler (4 parameters)
app.use(centralErrorHandler);

module.exports = app;
