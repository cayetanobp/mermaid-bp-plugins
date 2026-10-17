import assert from 'node:assert/strict';
import { cp, mkdir, readFile, readdir, stat } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';

assert.ok(process.argv[2], 'Pass the core distribution path from the shared core build action.');
const coreDistribution = resolve(process.argv[2]);
assert.equal(basename(coreDistribution), 'dist', 'The target must be the generated dist directory.');
const coreRoot = dirname(coreDistribution);
const corePackage = JSON.parse(await readFile(resolve(coreRoot, 'package.json'), 'utf8'));
assert.equal(corePackage.name, 'mermaid-bp', 'The target must be a Mermaid BP core checkout.');
await stat(resolve(coreDistribution, 'index.html'));

const builtPlugin = resolve('dist/plugins/bookstack');
const pluginManifest = JSON.parse(await readFile(resolve(builtPlugin, 'plugin.json'), 'utf8'));
assert.equal(pluginManifest.id, 'bookstack');
assert.equal(pluginManifest.apiVersion, 1);

const pluginsDirectory = resolve(coreDistribution, 'plugins');
await mkdir(pluginsDirectory, { recursive: true });
const installed = (await readdir(pluginsDirectory, { withFileTypes: true })).filter(entry => entry.isDirectory());
assert.deepEqual(installed, [], 'The core build must start with no installed plugins.');
await cp(builtPlugin, resolve(pluginsDirectory, 'bookstack'), { recursive: true, errorOnExist: true, force: false });
