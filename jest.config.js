module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  setupFiles: ['dotenv/config'],
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/swagger.js',
    '!src/swagger-schemas.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testPathIgnorePatterns: ['/node_modules/'],
  clearMocks: true,
  restoreMocks: true
};
