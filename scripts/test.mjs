import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
const require=createRequire(import.meta.url);
const esbuild=require(require.resolve('esbuild',{paths:[require.resolve('drizzle-kit')]}));
mkdirSync('work',{recursive:true});
await esbuild.build({entryPoints:['tests/providers.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'work/providers.test.mjs'});
const result=spawnSync(process.execPath,['--test','tests/analytics.test.mjs','work/providers.test.mjs'],{stdio:'inherit'});
process.exitCode=result.status??1;
