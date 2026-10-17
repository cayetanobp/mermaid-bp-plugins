import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('BookStack sources and package build are owned by this repository', async () => {
  for (const file of ['plugin.json', 'bookstack.html', 'viewer.ts', 'preview.ts', 'build.mjs', 'src/render.ts', 'src/flow.ts']) {
    await access(new URL(file, root));
  }
  const sources = await Promise.all(['viewer.ts', 'preview.ts', 'header.ts'].map(file => readFile(new URL(file, root), 'utf8')));
  assert.doesNotMatch(sources.join('\n'), /from ['"]\.\.\/\.\.\/src\//);
  assert.doesNotMatch(sources.join('\n'), /from ['"]\.\.\/src\//);
});

test('the installable package has its own dependency and legal notices', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(packageJson.dependencies.mermaid, '11.17.2');
  for (const file of ['LICENSE', 'NOTICE.md', 'THIRD_PARTY_NOTICES.md']) {
    await access(new URL(`../${file}`, import.meta.url));
  }
});

test('the built plugin is a self-contained API v1 package', async () => {
  const output = new URL('../../dist/plugins/bookstack/', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('plugin.json', output), 'utf8'));
  assert.equal(manifest.id, 'bookstack');
  assert.equal(manifest.apiVersion, 1);
  assert.equal(manifest.build.entries.bookstack, 'bookstack.html');
  assert.equal(manifest.build.outputs['bookstack-viewer'], 'bookstack-viewer.js');

  for (const file of ['index.js', 'bookstack.html', 'bookstack-viewer.js', 'bookstack-header.html', 'LICENSE', 'NOTICE.md', 'THIRD_PARTY_NOTICES.md']) {
    await access(new URL(file, output));
  }

  const runtime = await readFile(new URL('index.js', output), 'utf8');
  assert.doesNotMatch(runtime, /(?:\.\.\/)+src\/|(?:mermaid-bp|@mermaid-bp)\/src\//);
});
