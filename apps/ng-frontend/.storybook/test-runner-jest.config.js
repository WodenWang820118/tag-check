import { getJestConfig } from '@storybook/test-runner';

const testRunnerConfig = getJestConfig();

export default {
  ...testRunnerConfig,
  modulePathIgnorePatterns: [
    ...(testRunnerConfig.modulePathIgnorePatterns ?? []),
    '<rootDir>/dist/',
    '<rootDir>/.nx/cache/'
  ]
};
