const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testRegex: '(/__tests__/.*|(\\.|/)(test))\\.[jt]sx?$',
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|debounce|flowbite-react|@fortawesome|flowbite)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$': `<rootDir>/__mocks__/fileMock.js`,
  },
};

// IMPORTANT: In Next.js 15, createJestConfig is an async function.
// Using module.exports = createJestConfig(...) is usually fine,
// but sometimes nextJest needs to be forced to respect the ignore pattern.
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();
  // Forcefully override the ignore pattern if nextJest stripped it
  config.transformIgnorePatterns = [
    '/node_modules/(?!(.pnpm|debounce|flowbite-react|@fortawesome|flowbite)/)',
    ...config.transformIgnorePatterns.filter(pattern => pattern !== '/node_modules/'),
  ];
  return config;
};