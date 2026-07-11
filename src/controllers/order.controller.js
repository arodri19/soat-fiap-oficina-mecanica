const container = require('../infrastructure/container/Container');

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Abertura de Ordem de Serviço (OS)
 *     tags: [⭐ Fase 02 — Requisitos Obrigatórios, Ordens de Serviço]
 *     description: |
 *       Cria uma nova OS com status **RECEBIDA**. Aceita serviços e peças opcionalmente
 *       em uma única requisição. Retorna o `externalId` — identificador público da OS
 *       usado para rastreamento pelo cliente sem autenticação.
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
 *                 example: "Revisão completa — verificação geral pré-viagem"
 *               vehicleId:
 *                 type: integer
 *                 example: 1
 *               clientPFId:
 *                 type: integer
 *                 example: 1
 *                 description: "Informe clientPFId OU clientPJId (obrigatório um dos dois)"
 *               clientPJId:
 *                 type: integer
 *                 example: null
 *               mechanicName:
 *                 type: string
 *                 example: "Roberto Silva"
 *               services:
 *                 type: array
 *                 description: "Serviços e peças já associados na abertura (opcional)"
 *                 items:
 *                   type: object
 *                   required:
 *                     - serviceId
 *                   properties:
 *                     serviceId:
 *                       type: integer
 *                       example: 1
 *                     parts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required:
 *                           - partId
 *                         properties:
 *                           partId:
 *                             type: integer
 *                             example: 2
 *                           quantity:
 *                             type: integer
 *                             example: 1
 *                             default: 1
 *           example:
 *             description: "Revisão completa — verificação geral pré-viagem"
 *             clientPFId: 1
 *             vehicleId: 1
 *             mechanicName: "Roberto Silva"
 *             services:
 *               - serviceId: 1
 *                 parts:
 *                   - partId: 2
 *                     quantity: 1
 *     responses:
 *       201:
 *         description: OS criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 42
 *                 externalId:
 *                   type: string
 *                   format: uuid
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *                   description: "Identificador público da OS — use para rastrear via /track/:externalId"
 *                 status:
 *                   type: string
 *                   example: "RECEBIDA"
 *                 budgetValue:
 *                   type: number
 *                   example: 150.00
 *                 vehicle:
 *                   $ref: '#/components/schemas/Vehicle'
 *                 clientPF:
 *                   $ref: '#/components/schemas/ClientPF'
 *                 clientPJ:
 *                   $ref: '#/components/schemas/ClientPJ'
 *                 services:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderServiceService'
 *       400:
 *         description: Dados inválidos (campo obrigatório ausente, serviceId ou partId inexistente)
 */
async function createOrder(req, res) {
  const { description, vehicleId, clientPFId, clientPJId } = req.body;
  if (!description || !vehicleId) {
    return res.status(400).json({ message: 'Descrição e veículo são obrigatórios.' });
  }
  if (!clientPFId && !clientPJId) {
    return res.status(400).json({ message: 'Cliente PF ou PJ deve ser informado.' });
  }

  const order = await container.getOrderApplicationService().createOrder(req.body);
  return res.status(201).json(order);
}

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Listagem de Ordens de Serviço
 *     tags: [⭐ Fase 02 — Requisitos Obrigatórios, Ordens de Serviço]
 *     description: |
 *       Retorna as OS ativas (FINALIZADA e ENTREGUE são excluídas), ordenadas por prioridade:
 *       **EM_EXECUCAO → AGUARDANDO_APROVACAO → EM_DIAGNOSTICO → RECEBIDA**, mais antigas primeiro.
 *       Suporta paginação e filtro por status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [RECEBIDA, EM_DIAGNOSTICO, AGUARDANDO_APROVACAO, EM_EXECUCAO, CANCELADA]
 *         description: "Filtrar por status (FINALIZADA e ENTREGUE são sempre excluídas)"
 *         example: "AGUARDANDO_APROVACAO"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Número da página"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: "Itens por página (máx. recomendado: 100)"
 *     responses:
 *       200:
 *         description: Lista paginada de ordens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderService'
 *                 total:
 *                   type: integer
 *                   example: 125
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 20
 *                 pages:
 *                   type: integer
 *                   example: 7
 */
async function listOrders(req, res) {
  const { status, page, limit } = req.query;
  const result = await container.getOrderApplicationService().listOrders({
    status,
    page:  page  ? parseInt(page)  : 1,
    limit: limit ? parseInt(limit) : 20,
  });
  return res.json(result);
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
  const order = await container.getOrderApplicationService().getOrder(id);
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

  const result = await container.getOrderApplicationService().updateOrderStatus(id, status);
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
  const { serviceId } = req.body;
  if (!serviceId) return res.status(400).json({ message: 'ID do serviço é obrigatório.' });

  const updated = await container.getOrderApplicationService().addServiceToOrder(id, serviceId);
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

  const result = await container.getOrderApplicationService().addPartToOrder(id, orderServiceServiceId, partId, quantity);
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
  const progress = await container.getOrderApplicationService().getOrderProgress(id);
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
