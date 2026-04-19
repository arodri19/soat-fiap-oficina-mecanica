module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFiles: ['dotenv/config'],
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s']
};
