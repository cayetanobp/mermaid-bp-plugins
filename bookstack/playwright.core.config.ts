import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'core-compat.spec.ts',
  workers: 1,
  timeout: 45_000,
  expect: {timeout: 12_000},
  use: {headless:true},
});
