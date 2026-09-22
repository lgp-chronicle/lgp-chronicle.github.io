import {mkdirSync,writeFileSync,renameSync} from 'node:fs';
import {sqlite} from '../db/client';
import {sync} from '../services/sync';
import {readGuild} from '../services/guild';
const mode=process.argv[2]||'export';
let failed=false;
if(mode==='sync'){
 const result=await sync(process.argv.includes('--force'));
 console.log(JSON.stringify(result));
 if('characters' in result)failed=!!result.characters?.some(c=>c.errors.length>0);
}
mkdirSync('public/data/editions',{recursive:true});
const save=(file:string,value:unknown)=>{writeFileSync(file+'.tmp',JSON.stringify(value));renameSync(file+'.tmp',file)};
const data=await readGuild();if(!data.available)throw Error('Stored guild data unavailable');
save('public/data/guild.json',data);
const editions=sqlite.prepare('SELECT day,data FROM daily_editions ORDER BY day DESC').all() as {day:string;data:string}[];
const today=new Date().toISOString().slice(0,10);
if(!editions.some(e=>e.day===today))editions.unshift({day:today,data:'[]'});
save('public/data/editions.json',{days:editions.map(e=>e.day)});
for(const e of editions)save('public/data/editions/'+e.day+'.json',{events:JSON.parse(e.data)});
console.log('Exported '+data.members.length+' characters from SQLite to static JSON.');
sqlite.close();
if(failed)process.exitCode=2;
