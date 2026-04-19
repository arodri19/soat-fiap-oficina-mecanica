const app = require('./app');
const { PORT } = require('./config');

app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
