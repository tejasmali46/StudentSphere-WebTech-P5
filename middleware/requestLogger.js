/**
 * Custom Request Logger Middleware
 * Tracks execution time, request IP, method, URL, and completion status.
 */
function requestLogger(req, res, next) {
  const start = process.hrtime();
  req.requestTimestamp = new Date();

  // Listen to response finish event to measure time taken
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    const status = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';

    // Highlight error codes vs success
    const statusSign = status >= 400 ? '⚠️' : '✓';
    console.log(`[REQ-LOG] ${statusSign} ${method} ${url} ${status} - ${timeInMs}ms (${ip})`);
  });

  next();
}

module.exports = requestLogger;
