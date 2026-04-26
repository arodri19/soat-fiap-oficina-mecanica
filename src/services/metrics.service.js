const metricsRepository = require('../repositories/metrics.repository');

async function getAverageExecutionTime() {
  const orders = await metricsRepository.listFinishedOrdersExecutionWindow();

  if (!orders.length) {
    return { averageMinutes: 0, averageHours: 0, totalOrders: 0, byService: [] };
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

  const byService = Object.entries(serviceStats).map(([name, stats]) => {
    const avgMins = stats.total / stats.count;
    return {
      service: name,
      averageMinutes: Number(avgMins.toFixed(2)),
      averageHours: Number((avgMins / 60).toFixed(2)),
      ordersCount: stats.count
    };
  });

  const overallAvgMins = totalMinutes / orders.length;

  return {
    averageMinutes: Number(overallAvgMins.toFixed(2)),
    averageHours: Number((overallAvgMins / 60).toFixed(2)),
    totalOrders: orders.length,
    byService
  };
}

module.exports = {
  getAverageExecutionTime
};
