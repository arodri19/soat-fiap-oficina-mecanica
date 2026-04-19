const express = require('express');
const authRoutes = require('./auth.routes');
const clientRoutes = require('./client.routes');
const vehicleRoutes = require('./vehicle.routes');
const serviceRoutes = require('./service.routes');
const partRoutes = require('./part.routes');
const orderRoutes = require('./order.routes');
const budgetRoutes = require('./budget.routes');
const metricsRoutes = require('./metrics.routes');

const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/clients', authenticate, clientRoutes);
router.use('/vehicles', authenticate, vehicleRoutes);
router.use('/services', authenticate, serviceRoutes);
router.use('/parts', authenticate, partRoutes);
router.use('/orders', authenticate, orderRoutes);
router.use('/budgets', authenticate, budgetRoutes);
router.use('/metrics', authenticate, metricsRoutes);

module.exports = router;
