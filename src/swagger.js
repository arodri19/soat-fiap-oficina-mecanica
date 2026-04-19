const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Oficina Mecânica',
      version: '1.0.0',
      description: 'API backend para oficina mecânica com autenticação, ordens de serviço e gerenciamento de clientes, veículos, serviços e peças.',
      contact: {
        name: 'Equipe Oficina',
        email: 'equipe@oficina.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:4001/api',
        description: 'Servidor de desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/swagger-schemas.js']
};

const specs = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  specs
};