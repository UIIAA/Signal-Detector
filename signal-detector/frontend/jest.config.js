module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/services/**/*.js',
    'pages/api/**/*.js',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!src/components/**', // Excluir componentes React
    '!pages/**/*.js', // Excluir páginas Next.js
    '!src/hooks/**' // Excluir hooks
  ],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000
};