const metricsRepository = require('../repositories/metrics.repository');

async function getAverageExecutionTime() {
  const orders = await metricsRepository.listFinishedOrdersExecutionWindow();

  if (!orders.length) {
    return { averageMinutes: 0, totalOrders: 0, byService: [] };
  }

  let totalMinutes = 0;
  const serviceStats = {};

  orders.forEach((order) => {
    const duration = (order.endAt.getTime() - order.startAt.getTime()) / 60000;
    totalMinutes += duration;

    if (order.services) {
      order.services.forEach((os) => {
        const serviceName = os.service.name;
        if (!serviceStats[serviceName]) {
          serviceStats[serviceName] = { total: 0, count: 0 };
        }
        serviceStats[serviceName].total += duration;
        serviceStats[serviceName].count += 1;
      });
    }
  });

  const byService = Object.entries(serviceStats).map(([name, stats]) => ({
    service: name,
    averageMinutes: stats.total / stats.count,
    ordersCount: stats.count
  }));

  return { 
    averageMinutes: totalMinutes / orders.length, 
    totalOrders: orders.length,
    byService
  };
}

module.exports = {
  getAverageExecutionTime
};
