const express = require('express');
const router = express.Router();
const storage = require('../utils/storage');

/**
 * GET /
 * Display Main Dashboard
 */
router.get('/', async (req, res, next) => {
  try {
    const stats = await storage.getDashboardStats();
    res.render('index', {
      title: 'Academic Dashboard — StudentSphere',
      stats
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /about
 * Display Assignment & Project Information
 */
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About StudentSphere — Web Technology Practical 5',
    studentInfo: {
      name: 'Tejas Mali',
      prn: '202401040083',
      class: 'Third-Year B.Tech Computer Engineering',
      institution: 'MIT Academy of Engineering, Alandi, Pune',
      course: 'Web Technology (2304362L)',
      assignment: 'Practical No. 5: Web Application Framework — ExpressJS'
    }
  });
});

/**
 * GET /health
 * Deployment & container health-check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'StudentSphere API',
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
