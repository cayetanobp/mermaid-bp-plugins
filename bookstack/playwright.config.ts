import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'bookstack.spec.ts',
  use: {baseURL:'http://127.0.0.1:4178',headless:true},
  webServer: {command:'npm run build && node tests/serve.mjs',url:'http://127.0.0.1:4178/plugins/bookstack/bookstack.html',reuseExistingServer:!process.env.CI,timeout:120_000},
});
