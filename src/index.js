// Precisa ser o primeiro require do processo — o agente instrumenta os módulos
// (express, pg, http) conforme eles são carregados depois dele.
require('newrelic');

const app = require('./app');
const { PORT } = require('./config');

app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
