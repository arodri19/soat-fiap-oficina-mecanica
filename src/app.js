const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { swaggerUi, specs } = require('./swagger');

const app = express();

// Aumentar limite de tamanho da requisição
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());
app.use(morgan('dev'));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use('/api', routes);

// Tratamento de erros de parsing JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'JSON inválido no corpo da requisição.' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: 'Erro interno do servidor.' });
});

module.exports = app;
