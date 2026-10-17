import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

test('the bundled preview renders a standalone sample',async({page})=>{
  await page.goto('/plugins/bookstack/bookstack.html');
  await expect(page.locator('#check-output svg')).toHaveCount(1);
  await expect(page.locator('#check-state')).toContainText('Renderizado con Mermaid 11.17.2');
});

test('the BookStack header only claims tagged blocks and applies saved positions',async({page})=>{
  const header=await readFile('dist/plugins/bookstack/bookstack-header.html','utf8');
  await page.route('https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/**',async route=>{
    const relative=new URL(route.request().url()).pathname.split('/dist/')[1];
    if(!relative||relative.split('/').includes('..'))return route.abort();
    await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await readFile(join(process.cwd(),'node_modules/mermaid/dist',relative))});
  });
  const source='%% mermaid-bp:manual-layout\nflowchart LR\nA[Origen] --> B[Destino]\n%% graph:positions {"A":{"x":-50,"y":40},"B":{"x":280,"y":170}}';
  const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  await page.route('**/header-test.html',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head>'+header+'</head><body><pre id="native"><code class="language-mermaid">sequenceDiagram\nAlice->>Bob: keep</code></pre><pre><code class="language-mermaid">'+escape(source)+'</code></pre></body></html>'}));
  await page.goto('/header-test.html');
  await expect(page.locator('.mbp-diagram svg')).toHaveCount(1);
  await expect(page.locator('#native')).toHaveCount(1);
  await expect(page.locator('#native')).toContainText('sequenceDiagram');
  const centers=await page.locator('.mbp-diagram svg').evaluate(root=>[...root.querySelectorAll<SVGGElement>('g.node')].map(node=>{const b=node.getBBox(),m=(root as SVGSVGElement).getCTM()!.inverse().multiply(node.getCTM()!),p=new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(m);return {x:p.x,y:p.y};}));
  expect(centers[0].x).toBeCloseTo(-50,1);expect(centers[0].y).toBeCloseTo(40,1);
  expect(centers[1].x).toBeCloseTo(280,1);expect(centers[1].y).toBeCloseTo(170,1);
});

test('the generated header stays below the install limit and works with strict-dynamic CSP',async({page})=>{
  const header=await readFile('dist/plugins/bookstack/bookstack-header.html','utf8');
  expect(Buffer.byteLength(header)).toBeLessThan(60_000);
  expect(header.trim()).toMatch(/<\/script>$/);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/**',async route=>{
    const relative=new URL(route.request().url()).pathname.split('/dist/')[1];
    if(!relative||relative.split('/').includes('..'))return route.abort();
    await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await readFile(join(process.cwd(),'node_modules/mermaid/dist',relative))});
  });
  const source='%% mermaid-bp:manual-layout\nflowchart TD\nsubgraph G[Grupo]\nA[Origen] -->|Continuar| B[Destino]\nend\nB -->|Repetir| B\n%% graph:positions {"A":{"x":100,"y":100},"B":{"x":380,"y":260}}\n%% graph:groups {"G":{"x":20,"y":20,"width":500,"height":340}}\n%% graph:connections {"B>B#0":{"bendFrom":{"x":-130,"y":80},"bendTo":{"x":140,"y":80}}}';
  const escape=(text:string)=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const body='<!doctype html><html><head><meta charset="utf-8">'+header.replace('<script type="module">','<script type="module" nonce="test-header">')+'</head><body><pre><code class="language-mermaid">'+escape(source)+'</code></pre></body></html>';
  await page.route('**/header-csp-test.html',route=>route.fulfill({contentType:'text/html',headers:{'content-security-policy':"script-src 'nonce-test-header' 'strict-dynamic'; style-src 'unsafe-inline';"},body}));
  await page.goto('/header-csp-test.html');
  await expect(page.locator('.mbp-diagram svg')).toHaveCount(1);
  const centers=await page.locator('.mbp-diagram svg').evaluate((root:SVGSVGElement)=>[...root.querySelectorAll<SVGGElement>('g.node')].map(node=>{const b=node.getBBox(),m=root.getCTM()!.inverse().multiply(node.getCTM()!),p=new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(m);return{x:p.x,y:p.y};}));
  expect(centers[0].x).toBeCloseTo(100,1);expect(centers[0].y).toBeCloseTo(100,1);
  expect(centers[1].x).toBeCloseTo(380,1);expect(centers[1].y).toBeCloseTo(260,1);
  expect(errors).toEqual([]);
});
