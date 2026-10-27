/**
 * Error Handling Middleware
 */

/**
 * 404 Not Found Handler
 */
function notFoundHandler(req, res, next) {
  const isApi = req.originalUrl.startsWith('/api/');
  const message = `Route '${req.originalUrl}' not found on this server.`;

  if (isApi) {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message,
      path: req.originalUrl
    });
  }

  res.status(404).render('404', {
    title: '404 - Page Not Found',
    path: req.originalUrl,
    message: 'The requested student record or portal page could not be located.'
  });
}

/**
 * Centralized Error-Handling Middleware (4 parameters)
 */
function centralErrorHandler(err, req, res, next) {
  // Determine appropriate status code
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const isApi = req.originalUrl.startsWith('/api/') || req.xhr || req.headers.accept?.includes('application/json');

  // Log internal error server-side
  console.error(`[ERROR] [${req.method} ${req.originalUrl}] [${statusCode}] ${err.message}`);
  if (statusCode === 500 && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Handle syntax error from malformed JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    if (isApi) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Malformed JSON payload provided in request body.'
      });
    }
    return res.status(400).render('error', {
      title: 'Bad Request - Malformed Payload',
      statusCode: 400,
      message: 'The submitted request contained invalid JSON data.'
    });
  }

  // Response for API endpoints
  if (isApi) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message: err.message || 'Internal Server Error occurred.',
      errors: err.errors || (err.field ? { [err.field]: err.message } : undefined)
    });
  }

  // Response for Web UI
  res.status(statusCode).render('error', {
    title: `${statusCode} - Application Error`,
    statusCode,
    message: err.message || 'An unexpected server error occurred while processing your request.',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
}

module.exports = {
  notFoundHandler,
  centralErrorHandler
};
