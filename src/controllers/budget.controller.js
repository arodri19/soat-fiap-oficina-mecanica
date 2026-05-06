const budgetService = require('../services/budget.service');

/**
 * @swagger
 * /budgets:
 *   post:
 *     summary: Criar orçamento a partir de múltiplas ordens de serviço
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderIds
 *             properties:
 *               orderIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *                 description: Lista de IDs das ordens de serviço para gerar o orçamento
 *     responses:
 *       201:
 *         description: Orçamento criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Budget'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Nenhuma ordem encontrada
 */
async function createBudget(req, res) {
  const { orderIds } = req.body;
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({ message: 'orderIds deve ser um array de IDs de ordens de serviço.' });
  }

  const budget = await budgetService.createBudget(orderIds);
  if (!budget || budget.orders.length === 0) {
    return res.status(404).json({ message: 'Nenhuma ordem de serviço encontrada para gerar o orçamento.' });
  }
  return res.status(201).json(budget);
}

/**
 * @swagger
 * /budgets:
 *   get:
 *     summary: Listar todos os orçamentos
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de orçamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Budget'
 */
async function listBudgets(req, res) {
  const budgets = await budgetService.listBudgets();
  return res.json(budgets);
}

/**
 * @swagger
 * /budgets/{id}:
 *   get:
 *     summary: Obter orçamento por ID
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     responses:
 *       200:
 *         description: Orçamento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Budget'
 *       404:
 *         description: Orçamento não encontrado
 */
async function getBudget(req, res) {
  const id = Number(req.params.id);
  const budget = await budgetService.getBudget(id);
  if (!budget) return res.status(404).json({ message: 'Orçamento não encontrado.' });
  return res.json(budget);
}

/**
 * @swagger
 * /budgets/{id}:
 *   put:
 *     summary: Atualizar orçamento
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalBudget:
 *                 type: number
 *                 format: float
 *                 example: 600.0
 *     responses:
 *       200:
 *         description: Orçamento atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Budget'
 *       404:
 *         description: Orçamento não encontrado
 */
async function updateBudget(req, res) {
  const id = Number(req.params.id);
  const { totalBudget } = req.body;
  const budget = await budgetService.updateBudget(id, totalBudget);
  return res.json(budget);
}

/**
 * @swagger
 * /budgets/{id}:
 *   delete:
 *     summary: Deletar orçamento
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     responses:
 *       204:
 *         description: Orçamento deletado com sucesso
 *       404:
 *         description: Orçamento não encontrado
 */
async function deleteBudget(req, res) {
  const id = Number(req.params.id);
  await budgetService.deleteBudget(id);
  return res.status(204).send();
}

module.exports = {
  createBudget,
  listBudgets,
  getBudget,
  updateBudget,
  deleteBudget
};