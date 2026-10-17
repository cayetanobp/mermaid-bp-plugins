import assert from 'node:assert/strict';
import { readFile, access, cp, mkdtemp, rm, appendFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
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

  const result = spawnSync(process.execPath, [
    resolve('scripts/verify-plugin-package.mjs'),
    fileURLToPath(output),
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || 'the built package should pass verification');
});

test('package verification rejects private core imports in any built JavaScript output', async () => {
  const packageDirectory = new URL('../../dist/plugins/bookstack/', import.meta.url);
  const fixture = await mkdtemp(join(tmpdir(), 'mermaid-bookstack-package-'));
  try {
    const fixturePackage = join(fixture, 'bookstack');
    await cp(packageDirectory, fixturePackage, { recursive: true });
    await appendFile(join(fixturePackage, 'bookstack-viewer.js'), '\nimport {privateThing} from "../../src/private-module.js";\n');

    const result = spawnSync(process.execPath, [
      resolve('scripts/verify-plugin-package.mjs'),
      fixturePackage,
    ], { encoding: 'utf8' });

    assert.notEqual(result.status, 0, 'the package verifier should reject the injected private import');
    assert.match(result.stderr, /bookstack-viewer\.js.*private core import/i);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test('package verification rejects a valid manifest with an incompatible API version before installation', async () => {
  const packageDirectory = new URL('../../dist/plugins/bookstack/', import.meta.url);
  const fixture = await mkdtemp(join(tmpdir(), 'mermaid-bookstack-package-'));
  try {
    const fixturePackage = join(fixture, 'bookstack');
    await cp(packageDirectory, fixturePackage, { recursive: true });
    const manifestPath = join(fixturePackage, 'plugin.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.apiVersion = 2;
    await writeFile(manifestPath, JSON.stringify(manifest));

    const result = spawnSync(process.execPath, [
      resolve('scripts/verify-plugin-package.mjs'),
      fixturePackage,
    ], { encoding: 'utf8' });

    assert.notEqual(result.status, 0, 'the built package verifier should reject an unsupported API version');
    assert.match(result.stderr, /must target public API v1/);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
