import {expect,test} from '@playwright/test';
import {cp,mkdir,mkdtemp,readdir,readFile,rm,stat,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {extname,join,relative,resolve,isAbsolute} from 'node:path';
import {tmpdir} from 'node:os';

const coreDistribution=process.env.MERMAID_BP_CORE_DIST;
const packageDistribution=resolve('dist/plugins/bookstack');
const contentTypes:Record<string,string>={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2'};
async function command(page:import('@playwright/test').Page,id:string){
 const target=page.locator('#'+id);const menu=await target.evaluate(element=>element.closest('[role="menu"]')?.getAttribute('aria-labelledby'));
 if(menu&&!await target.isVisible())await page.locator('#'+menu).click();
 await target.click();
}

test('BookStack uses API v1 in a clean Mermaid BP distribution',async({page})=>{
 test.skip(!coreDistribution,'The clean core distribution is supplied only by the CI compatibility job.');
 const folder=await mkdtemp(join(tmpdir(),'mermaid-bookstack-core-'));
 const plugins=join(folder,'plugins');
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await cp(join(coreDistribution!,'assets'),join(folder,'assets'),{recursive:true});
 await cp(join(coreDistribution!,'index.html'),join(folder,'index.html'));
 await mkdir(plugins);
 const server=createServer(async(request,response)=>{
  try{
   const path=decodeURIComponent(new URL(request.url??'','http://localhost').pathname);
   response.setHeader('Cache-Control','no-store');
   if(path==='/plugins/'){
    const entries=await readdir(plugins,{withFileTypes:true});response.setHeader('Content-Type','application/json');response.end(JSON.stringify(entries.filter(entry=>entry.isDirectory()).map(entry=>({type:'directory',name:entry.name}))));return;
   }
   const file=resolve(folder,'.'+(path==='/'?'/index.html':path));
   const pathFromRoot=relative(folder,file);
   if(pathFromRoot.startsWith('..')||isAbsolute(pathFromRoot)){response.writeHead(403).end();return;}
   if(!(await stat(file)).isFile())throw Error('File not found.');
   response.setHeader('Content-Type',contentTypes[extname(file)]??'application/octet-stream');response.end(await readFile(file));
  }catch{response.writeHead(404).end();}
 });
 await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));
 const address=server.address() as {port:number};const url=`http://127.0.0.1:${address.port}`;
 try{
  await page.goto(url);await expect(page.locator('#render-state')).toHaveText('Actualizado');await expect(page.locator('#plugin-actions')).toBeEmpty();
  await cp(packageDistribution,join(plugins,'bookstack'),{recursive:true});
  await mkdir(join(plugins,'ci-invalid-manifest'));await writeFile(join(plugins,'ci-invalid-manifest','plugin.json'),'not json');
  await mkdir(join(plugins,'ci-incompatible-api'));
  await writeFile(join(plugins,'ci-incompatible-api','plugin.json'),JSON.stringify({id:'ci-incompatible-api',name:'API incompatible',description:'Fixture de API futura',version:'1.0.0',apiVersion:2,enabledByDefault:false}));
  await writeFile(join(plugins,'ci-incompatible-api','index.js'),'export default {setup(){}};');
  await page.reload();await expect(page.locator('#render-state')).toHaveText('Actualizado');
  const previewAction=page.locator('#plugin-bookstack-preview');await expect(previewAction).toHaveCount(1);
  const previewPromise=page.waitForEvent('popup');await command(page,'plugin-bookstack-preview');const preview=await previewPromise;
  await expect(preview).toHaveURL(/\/plugins\/bookstack\/bookstack\.html#/);await expect(preview.locator('#check-output svg')).toHaveCount(1);
  await expect(preview.locator('#check-state')).toContainText('Renderizado con Mermaid');
  await command(page,'plugins-button');
  await expect(page.locator('#plugin-list')).toContainText('No se ha podido cargar la extensión ci-invalid-manifest');
  await expect(page.locator('[data-plugin-status="ci-incompatible-api"]')).toContainText('Versión de API incompatible');
  await page.locator('#plugins-close').click();
  await rm(join(plugins,'bookstack'),{recursive:true,force:true});await page.reload();
  await expect(page.locator('#render-state')).toHaveText('Actualizado');await expect(page.locator('#plugin-actions')).toBeEmpty();
  expect(errors).toEqual([]);
 }finally{
  await new Promise<void>((done,reject)=>server.close(error=>error?reject(error):done()));
  await rm(folder,{recursive:true,force:true});
 }
});
