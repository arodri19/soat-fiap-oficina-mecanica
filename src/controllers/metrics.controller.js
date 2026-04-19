const prisma = require('../prisma');

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
 */
async function getAverageExecutionTime(req, res) {
  const orders = await prisma.orderService.findMany({
    where: { startAt: { not: null }, endAt: { not: null } },
    select: { startAt: true, endAt: true }
  });
  if (!orders.length) {
    return res.json({ averageMinutes: 0, totalOrders: 0 });
  }
  const totalMinutes = orders.reduce((sum, order) => {
    return sum + (order.endAt.getTime() - order.startAt.getTime()) / 60000;
  }, 0);
  return res.json({ averageMinutes: totalMinutes / orders.length, totalOrders: orders.length });
}

module.exports = {
  getAverageExecutionTime
};
