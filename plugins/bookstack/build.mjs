import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir, readFile, writeFile, copyFile} from 'node:fs/promises';
import {build, transformWithEsbuild} from 'vite';
import {writeThirdPartyNotices} from '../../scripts/write-third-party-notices.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(root,'../..');
const out = resolve(repositoryRoot,process.env.MERMAID_BP_OUT_DIR || 'dist');
const packageDir = resolve(out, 'plugins/bookstack');
await mkdir(packageDir, {recursive:true});
await writeThirdPartyNotices(repositoryRoot,root);
await build({
  root,
  publicDir: false,
  configFile: false,
  base: './',
  logLevel: 'warn',
  build: {
    outDir: packageDir,
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      input: {bookstack:resolve(root,'bookstack.html'), 'bookstack-viewer':resolve(root,'viewer.ts')},
      output: {entryFileNames: chunk => chunk.name === 'bookstack-viewer' ? 'bookstack-viewer.js' : 'assets/[name]-[hash].js'},
    },
  },
});

const built = await build({
  configFile:false,
  logLevel:'warn',
  build:{
    write:false,
    minify:'esbuild',
    lib:{entry:resolve(root,'header.ts'),formats:['es'],fileName:()=> 'header.js'},
    rollupOptions:{external:['mermaid'],output:{inlineDynamicImports:true,paths:{mermaid:'https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs'}}},
  },
});
const code = (Array.isArray(built)?built:[built]).flatMap(r=>r.output).filter(item=>item.type==='chunk').map(item=>item.code).join('\n');
if(!code || code.includes("from 'mermaid'") || code.includes('from "mermaid"')) throw new Error('No se generó el encabezado autónomo.');
const compact = await transformWithEsbuild(code,'bookstack-header.js',{loader:'js',minify:true,target:'es2022',legalComments:'none'});
const header = '<!-- Mermaid BP: solo bloques etiquetados; conserva el visor Mermaid habitual. -->\n<script type="module">\n'+compact.code.replace(/<\/script/gi,'<\\/script')+'\n</script>\n';
if(Buffer.byteLength(header)>60_000) throw new Error('El encabezado supera el límite de 60 KB.');
await writeFile(resolve(packageDir,'bookstack-header.html'),header);
await copyFile(resolve(root,'plugin.json'),resolve(packageDir,'plugin.json'));
await copyFile(resolve(root,'index.js'),resolve(packageDir,'index.js'));
await copyFile(resolve(root,'LICENSE'),resolve(packageDir,'LICENSE'));
await copyFile(resolve(root,'NOTICE.md'),resolve(packageDir,'NOTICE.md'));
await copyFile(resolve(root,'THIRD_PARTY_NOTICES.md'),resolve(packageDir,'THIRD_PARTY_NOTICES.md'));
await writeFile(resolve(out,'bookstack-header.html'),header);
const html=await readFile(resolve(packageDir,'bookstack.html'),'utf8');
await writeFile(resolve(out,'bookstack.html'),html.replaceAll('./assets/','./plugins/bookstack/assets/'));
await writeFile(resolve(out,'bookstack-viewer.js'),"export * from './plugins/bookstack/bookstack-viewer.js';\n");
console.log(`BookStack listo en ${packageDir} y encabezado ${Buffer.byteLength(header)} bytes.`);
