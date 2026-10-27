const app = require('./app');

// Port selection with fallback for local development
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`
================================================================
🎓 StudentSphere — Student Information Portal
📚 Web Technology (2304362L) — Practical No. 5
🏛️ MIT Academy of Engineering, Pune
👤 Student: Tejas Mali (PRN: 202401040083)
----------------------------------------------------------------
🚀 Server Status : Running
🌐 Local URL     : http://localhost:${PORT}
🩺 Health Check  : http://localhost:${PORT}/health
📊 REST API      : http://localhost:${PORT}/api/students
📁 Storage Engine: JSON Database (data/students.json)
================================================================
  `);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: Closing HTTP server gracefully.');
  server.close(() => {
    console.log('HTTP server terminated.');
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received: Shutting down server.');
  server.close(() => {
    process.exit(0);
  });
});
