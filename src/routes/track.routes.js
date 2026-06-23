const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const orderService = require('../services/order.service');

const router = express.Router();

router.get('/:externalId', asyncHandler(async (req, res) => {
  const progress = await orderService.getOrderProgressByExternalId(req.params.externalId);
  if (!progress) return res.status(404).json({ message: 'Ordem não encontrada.' });
  return res.json(progress);
}));

router.post('/:externalId/approve', asyncHandler(async (req, res) => {
  const order = await orderService.approveOrder(req.params.externalId);
  if (!order) return res.status(404).json({ message: 'Ordem não encontrada.' });
  return res.json({ order, message: 'Ordem aprovada com sucesso. Execução iniciada.' });
}));

module.exports = router;
