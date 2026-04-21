const metricsService = require('../services/metrics.service');

/**
 * @swagger
 * /metrics/average-execution-time:
 *   get:
 *     summary: Obter tempo médio de execução das ordens de serviço
 *     tags: [Métricas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tempo médio calculado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageMinutes:
 *                   type: number
 *                   format: float
 *                   example: 45.5
 *                   description: Tempo médio em minutos
 *                 totalOrders:
 *                   type: integer
 *                   example: 10
 *                   description: Número total de ordens finalizadas
 *                 byService:
 *                   type: array
 *                   description: Média de tempo por tipo de serviço
 *                   items:
 *                     type: object
 *                     properties:
 *                       service:
 *                         type: string
 *                         example: "Troca de Óleo"
 *                       averageMinutes:
 *                         type: number
 *                         format: float
 *                         example: 60.0
 *                       ordersCount:
 *                         type: integer
 *                         example: 5
 */
async function getAverageExecutionTime(req, res) {
  const result = await metricsService.getAverageExecutionTime();
  return res.json(result);
}

module.exports = {
  getAverageExecutionTime
};
