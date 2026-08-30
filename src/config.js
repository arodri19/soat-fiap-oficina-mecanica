const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  PORT: process.env.PORT || 4000,
  JWT_SECRET: process.env.JWT_SECRET || 'change-me',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/oficina?schema=public',
  // User API Key (não a License Key do agente APM) — só usada para CONSULTAR a
  // New Relic via NerdGraph (ver src/infrastructure/monitoring/newrelicQuery.js),
  // não para ingerir dados.
  NEW_RELIC_ACCOUNT_ID: process.env.NEW_RELIC_ACCOUNT_ID || '',
  NEW_RELIC_API_KEY: process.env.NEW_RELIC_API_KEY || ''
};
