import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
const root=new URL('../',import.meta.url);
await build({absWorkingDir:root.pathname,entryPoints:['src/widget-vendor.js'],bundle:true,minify:true,format:'iife',globalName:'LifeLedgerWidgetUI',target:['safari15'],outfile:'public/vendor/widget-ui.js',legalComments:'eof'});
const packages=['uplot','motion','motion-dom','motion-utils'];
const notices=await Promise.all(packages.map(async name=>{let text;try{text=await readFile(new URL(`node_modules/${name}/LICENSE`,root),'utf8');}catch(error){if(error.code!=='ENOENT')throw error;text=await readFile(new URL(`node_modules/${name}/LICENSE.md`,root),'utf8');}return `${name}\n${text}`;}));
await writeFile(new URL('public/vendor/widget-ui.LICENSE.txt',root),notices.join('\n\n'));
