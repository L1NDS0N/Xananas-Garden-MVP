module.exports = {
    testEnvironment: 'node',
    // setupFilesAfterEnv: ['./jest.setup.ts'],
    preset: 'ts-jest',
    testMatch: ['**/__tests__/**/*.test.ts'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
  };
  