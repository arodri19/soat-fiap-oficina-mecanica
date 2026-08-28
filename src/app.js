const express = require('express');
const cors = require('cors');
const newrelic = require('newrelic');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./openapi.json');
const routes = require('./routes');
const { requestLogger } = require('./middlewares/requestLogger');
const app = express();
app.disable('x-powered-by');

// Health check para liveness/readiness probes do Kubernetes — sem autenticação,
// fora de /api. Não toca no banco: só confirma que o processo está de pé.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Aumentar limite de tamanho da requisição
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(requestLogger);

app.use('/api-docs', swaggerUi.serve, (req, res, next) => {
  const spec = {
    ...swaggerSpec,
    servers: [{ url: `${req.protocol}://${req.get('host')}/api`, description: 'Servidor atual' }],
  };
  swaggerUi.setup(spec)(req, res, next);
});
app.use('/api', routes);

// Tratamento de erros de parsing JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'JSON inválido no corpo da requisição.' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  req.log?.error({ err }, 'Erro não tratado');
  newrelic.noticeError(err, { path: req.originalUrl, method: req.method });
  res.status(500).json({ message: 'Erro interno do servidor.' });
});

module.exports = app;
