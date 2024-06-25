module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: [
    "**/*.test.ts", // Include all files ending with .test.ts
    "!**/*.integration.test.ts", // Exclude files ending with .integration.test.ts
  ],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc-node/jest"],
  },
  setupFiles: ["./setupJestDynalite.js"],
};
