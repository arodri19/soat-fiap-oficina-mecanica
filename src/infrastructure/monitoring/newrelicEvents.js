const newrelic = require('newrelic');

// Eventos customizados que alimentam os dashboards da Fase 3:
// volume diário de OS (OrderCreated) e tempo médio de execução por status
// (OrderStatusChanged, via secondsInPreviousStatus).
function recordOrderCreated({ orderId, externalId, servicesCount, budgetValue }) {
  newrelic.recordCustomEvent('OrderCreated', {
    orderId,
    externalId,
    servicesCount,
    budgetValue: budgetValue || 0
  });
}

function recordOrderStatusChanged({ orderId, externalId, fromStatus, toStatus, secondsInPreviousStatus }) {
  newrelic.recordCustomEvent('OrderStatusChanged', {
    orderId,
    externalId,
    fromStatus,
    toStatus,
    secondsInPreviousStatus
  });
}

module.exports = { recordOrderCreated, recordOrderStatusChanged };
