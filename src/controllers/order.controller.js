const orderService = require('../services/order.service');

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Criar nova ordem de serviço
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - vehicleId
 *             properties:
 *               description:
 *                 type: string
 *                 example: "Troca de óleo e filtros"
 *               vehicleId:
 *                 type: integer
 *                 example: 1
 *               clientPFId:
 *                 type: integer
 *                 example: 1
 *               clientPJId:
 *                 type: integer
 *                 example: 1
 *               mechanicName:
 *                 type: string
 *                 example: "João Silva"
 *               startAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T10:00:00Z"
 *               endAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T12:00:00Z"
 *     responses:
 *       201:
 *         description: Ordem criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderService'
 *       400:
 *         description: Dados inválidos
 */
async function createOrder(req, res) {
  const { description, vehicleId, clientPFId, clientPJId } = req.body;
  if (!description || !vehicleId) {
    return res.status(400).json({ message: 'Descrição e veículo são obrigatórios.' });
  }
  if (!clientPFId && !clientPJId) {
    return res.status(400).json({ message: 'Cliente PF ou PJ deve ser informado.' });
  }

  const order = await orderService.createOrder(req.body);
  return res.status(201).json(order);
}

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Listar todas as ordens de serviço
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ordens retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrderService'
 */
async function listOrders(req, res) {
  const orders = await orderService.listOrders();
  return res.json(orders);
}

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Obter ordem de serviço por ID
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da ordem de serviço
 *     responses:
 *       200:
 *         description: Ordem encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderService'
 *       404:
 *         description: Ordem não encontrada
 */
async function getOrder(req, res) {
  const id = Number(req.params.id);
  const order = await orderService.getOrder(id);
  if (!order) return res.status(404).json({ message: 'Ordem de serviço não encontrada.' });
  return res.json(order);
}

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Atualizar status da ordem de serviço
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da ordem de serviço
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [RECEBIDA, EM_DIAGNOSTICO, AGUARDANDO_APROVACAO, EM_EXECUCAO, FINALIZADA, ENTREGUE]
 *                 example: "EM_EXECUCAO"
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   $ref: '#/components/schemas/OrderService'
 *                 message:
 *                   type: string
 *                   example: "Aprovação mock enviada, status alterado para EM_EXECUCAO."
 *       404:
 *         description: Ordem não encontrada
 */
async function updateOrderStatus(req, res) {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: 'Status inválido.' });

  const result = await orderService.updateOrderStatus(id, status);
  if (!result) return res.status(404).json({ message: 'Ordem de serviço não encontrada.' });
  return res.json(result);
}

/**
 * @swagger
 * /orders/{id}/service:
 *   post:
 *     summary: Adicionar serviço à ordem de serviço
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da ordem de serviço
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *             properties:
 *               serviceId:
 *                 type: integer
 *                 example: 1
 *               budgetValue:
 *                 type: number
 *                 format: float
 *                 example: 150.0
 *     responses:
 *       200:
 *         description: Serviço adicionado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderService'
 *       404:
 *         description: Ordem não encontrada
 */
async function addServiceToOrder(req, res) {
  const id = Number(req.params.id);
  const { serviceId, budgetValue } = req.body;
  if (!serviceId) return res.status(400).json({ message: 'ID do serviço é obrigatório.' });

  const updated = await orderService.addServiceToOrder(id, serviceId, budgetValue);
  if (!updated) return res.status(404).json({ message: 'Ordem de serviço não encontrada.' });
  return res.json(updated);
}

/**
 * @swagger
 * /orders/{id}/part:
 *   post:
 *     summary: Adicionar peça à ordem de serviço
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da ordem de serviço
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partId
 *             properties:
 *               orderServiceServiceId:
 *                 type: integer
 *                 example: 1
 *               partId:
 *                 type: integer
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 example: 2
 *     responses:
 *       200:
 *         description: Peça adicionada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderPart:
 *                   $ref: '#/components/schemas/OrderServicePart'
 *                 part:
 *                   $ref: '#/components/schemas/Part'
 *       404:
 *         description: Ordem ou peça não encontrada
 */
async function addPartToOrder(req, res) {
  const id = Number(req.params.id);
  const { orderServiceServiceId, partId, quantity } = req.body;
  if (!orderServiceServiceId) return res.status(400).json({ message: 'ID do serviço da ordem (orderServiceServiceId) é obrigatório.' });
  if (!partId) return res.status(400).json({ message: 'ID da peça é obrigatório.' });

  const result = await orderService.addPartToOrder(id, orderServiceServiceId, partId, quantity);
  if (!result) return res.status(404).json({ message: 'Ordem de serviço não encontrada.' });
  if (result.error === 'PART_NOT_FOUND') return res.status(404).json({ message: 'Peça não encontrada.' });
  return res.json(result);
}

/**
 * @swagger
 * /orders/{id}/progress:
 *   get:
 *     summary: Obter progresso da ordem de serviço
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da ordem de serviço
 *     responses:
 *       200:
 *         description: Progresso retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [RECEBIDA, EM_DIAGNOSTICO, AGUARDANDO_APROVACAO, EM_EXECUCAO, FINALIZADA, ENTREGUE]
 *                   example: "EM_EXECUCAO"
 *                 mechanicDescription:
 *                   type: string
 *                   example: "Troca de óleo e filtros"
 *                 mechanicName:
 *                   type: string
 *                   example: "João Silva"
 *       404:
 *         description: Ordem não encontrada
 */
async function getOrderProgress(req, res) {
  const id = Number(req.params.id);
  const progress = await orderService.getOrderProgress(id);
  if (!progress) return res.status(404).json({ message: 'Ordem de serviço não encontrada.' });
  return res.json(progress);
}

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  updateOrderStatus,
  addServiceToOrder,
  addPartToOrder,
  getOrderProgress
};
