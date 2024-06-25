module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.integration.test.ts"],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc-node/jest"],
  },
};
