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
    '!src/config.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 55,
      lines: 75,
      statements: 75
    },
    './src/services/': { branches: 80, functions: 80, lines: 80, statements: 80 },
    './src/models/': { branches: 70, functions: 90, lines: 85, statements: 85 },
    './src/domain/value-objects/': { branches: 90, functions: 90, lines: 90, statements: 90 }
  },
  testPathIgnorePatterns: ['/node_modules/'],
  clearMocks: true,
  restoreMocks: true
};
