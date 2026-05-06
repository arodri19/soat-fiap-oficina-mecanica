const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { createBudget, listBudgets, getBudget, updateBudget, deleteBudget } = require('../controllers/budget.controller');

const router = express.Router();

router.post('/', asyncHandler(createBudget));
router.get('/', asyncHandler(listBudgets));
router.get('/:id', asyncHandler(getBudget));
router.put('/:id', asyncHandler(updateBudget));
router.delete('/:id', asyncHandler(deleteBudget));

module.exports = router;