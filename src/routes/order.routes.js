const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const {
  createOrder,
  listOrders,
  getOrder,
  updateOrderStatus,
  addServiceToOrder,
  addPartToOrder,
  getOrderProgress
} = require('../controllers/order.controller');

const router = express.Router();

router.post('/', asyncHandler(createOrder));
router.get('/', asyncHandler(listOrders));
router.get('/:id', asyncHandler(getOrder));
router.patch('/:id/status', asyncHandler(updateOrderStatus));
router.post('/:id/service', asyncHandler(addServiceToOrder));
router.post('/:id/part', asyncHandler(addPartToOrder));
router.get('/:id/progress', asyncHandler(getOrderProgress));

module.exports = router;
