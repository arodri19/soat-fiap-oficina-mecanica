const express = require('express');
const { getAverageExecutionTime } = require('../controllers/metrics.controller');

const router = express.Router();
router.get('/average-execution-time', getAverageExecutionTime);
module.exports = router;
