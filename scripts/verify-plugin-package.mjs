import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import ts from 'typescript';

const packageRoot = resolve(process.argv[2] ?? 'dist/plugins/bookstack');
assert.equal(process.argv.length >= 3, true, 'Pass the built plugin package directory.');
assert.equal((await stat(packageRoot)).isDirectory(), true, 'The package path must be a directory.');

const manifest = JSON.parse(await readFile(resolve(packageRoot, 'plugin.json'), 'utf8'));
assert.equal(manifest.id, 'bookstack', 'The built package must identify itself as BookStack.');
assert.equal(manifest.apiVersion, 1, 'The built package must target public API v1.');

async function javascriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await javascriptFiles(path));
    else if (entry.isFile() && /\.m?js$/i.test(entry.name)) files.push(path);
  }
  return files;
}

function importedModules(source, fileName) {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const modules = [];
  const visit = node => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
      modules.push(node.moduleSpecifier.text);
    } else if (ts.isCallExpression(node) && node.arguments.length === 1 && ts.isStringLiteralLike(node.arguments[0])) {
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === 'require';
      if (isDynamicImport || isRequire) modules.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return modules;
}

for (const file of await javascriptFiles(packageRoot)) {
  const source = await readFile(file, 'utf8');
  for (const specifier of importedModules(source, file)) {
    const relativeTarget = specifier.startsWith('.') ? resolve(file, '..', specifier) : null;
    const targetRelativeToPackage = relativeTarget === null ? '' : relative(packageRoot, relativeTarget);
    const escapesPackage = relativeTarget !== null && (targetRelativeToPackage === '..' || targetRelativeToPackage.startsWith(`..${sep}`) || isAbsolute(targetRelativeToPackage));
    const namesPrivateCore = /^(?:@mermaid-bp\/)?(?:mermaid-bp\/)?src\//i.test(specifier) || /(?:^|\/)mermaid-bp\/src\//i.test(specifier);
    assert.equal(escapesPackage || namesPrivateCore, false,
      `${relative(packageRoot, file)}: private core import "${specifier}" is not allowed in the built plugin package.`);
  }
}
