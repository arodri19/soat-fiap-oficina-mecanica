module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  setupFiles: ['dotenv/config'],
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s'],
  collectCoverageFrom: [
    'src/services/vehicle.service.js',
    'src/services/part.service.js',
    'src/services/service.service.js',
    'src/services/order.service.js',
    'src/services/budget.service.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  testPathIgnorePatterns: ['/node_modules/'],
  clearMocks: true,
  restoreMocks: true
};
