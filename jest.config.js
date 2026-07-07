module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  setupFiles: ['dotenv/config'],
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/prisma.js',
    '!src/swagger.js',
    '!src/swagger-schemas.js',
    '!src/config.js',
    // Infrastructure implementations require a real DB — covered by integration tests
    '!src/infrastructure/repositories/Prisma*.js',
    '!src/infrastructure/interfaces/I*.js',
    // Old-style repositories (thin Prisma wrappers) — excluded for same reason
    '!src/repositories/*.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 72,
      statements: 72
    },
    // core business layers — high coverage required
    './src/domain/value-objects/': { branches: 90, functions: 90, lines: 90, statements: 90 },
    './src/application/use-cases/': { branches: 78, functions: 88, lines: 88, statements: 88 },
    './src/application/services/': { branches: 78, functions: 88, lines: 88, statements: 88 },
    // entity layer: Client.js / User.js have simplified helpers not yet tested
    './src/domain/entities/': { branches: 55, functions: 75, lines: 75, statements: 62 },
    // services layer: metrics.service.js is untested (needs DB)
    './src/services/': { branches: 55, functions: 65, lines: 65, statements: 65 },
    // model/validator helpers
    './src/models/': { branches: 62, functions: 82, lines: 80, statements: 80 }
  },
  testPathIgnorePatterns: ['/node_modules/'],
  clearMocks: true,
  restoreMocks: true
};
