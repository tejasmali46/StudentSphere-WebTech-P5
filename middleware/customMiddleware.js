/**
 * Custom Middlewares demonstrating Express request lifecycle manipulation
 */

/**
 * Attaches contextual variables to res.locals for EJS view templates
 */
function attachRequestContext(req, res, next) {
  res.locals.appTitle = 'StudentSphere';
  res.locals.currentYear = new Date().getFullYear();
  res.locals.currentPath = req.path;
  res.locals.query = req.query || {};
  res.locals.flashMessage = null; // Can hold quick alerts
  res.locals.formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };
  next();
}

/**
 * Custom timing middleware that writes X-Response-Time header before sending response
 */
function responseTimeHeader(req, res, next) {
  const start = Date.now();
  const originalEnd = res.end;

  res.end = function (...args) {
    if (!res.headersSent) {
      const duration = Date.now() - start;
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
    return originalEnd.apply(this, args);
  };

  next();
}

/**
 * Demonstration custom middleware: checks system operational state
 */
function systemStatusCheck(req, res, next) {
  // Can be configured via environment variable if maintenance mode is enabled
  if (process.env.MAINTENANCE_MODE === 'true') {
    return res.status(503).render('error', {
      title: 'Under Scheduled Maintenance',
      statusCode: 503,
      message: 'StudentSphere is currently undergoing scheduled database maintenance. Please check back shortly.',
      error: {}
    });
  }
  next();
}

module.exports = {
  attachRequestContext,
  responseTimeHeader,
  systemStatusCheck
};
