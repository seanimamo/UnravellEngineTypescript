module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.integ.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc-node/jest'],
  },
};
