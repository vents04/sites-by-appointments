/**
 * Route Aggregator
 * Combines all API routes
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const businessRoutes = require('./business.routes');
const publicRoutes = require('./public.routes');
const adminRoutes = require('./admin.routes');

// Authentication routes
router.use('/auth', authRoutes);

// Business admin routes (JWT protected)
router.use('/business', businessRoutes);

// Public routes (no auth required)
router.use('/', publicRoutes);

// Super admin routes (API key protected)
router.use('/admin', adminRoutes);

module.exports = router;
