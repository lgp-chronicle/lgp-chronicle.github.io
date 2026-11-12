import {mkdirSync,writeFileSync,renameSync} from 'node:fs';
import {sqlite} from '../db/client';
import {sync} from '../services/sync';
import {readGuild} from '../services/guild';
import {archiveChronicles} from '../services/illustrated-chronicles';
import {attachMembership} from '../services/membership';
import {guildSpotlight} from '../services/spotlight';
import {recordTrophies,trophyNews} from '../services/permanent-trophies';
const mode=process.argv[2]||'export';
let failed=false;
if(mode==='sync'){
 const result=await sync(process.argv.includes('--force'));
 console.log(JSON.stringify(result));
 if(result.status==='error')failed=true;
 else if('characters' in result)failed=!!result.characters?.some(c=>c.errors.some(e=>!e.startsWith('logs:not-found')));
}
mkdirSync('public/data/editions',{recursive:true});
const save=(file:string,value:unknown)=>{writeFileSync(file+'.tmp',JSON.stringify(value));renameSync(file+'.tmp',file)};
const data=await readGuild();if(!data.available)throw Error('Stored guild data unavailable');
attachMembership(sqlite,data.members);
data.spotlight=guildSpotlight(sqlite,data.members,data.generatedAt);
data.chronicles=archiveChronicles(sqlite,data.members);
data.trophyRoom=recordTrophies(sqlite,data.members);
const trophies=trophyNews(data.trophyRoom);
const recentFirst=(a:{at:string},b:{at:string})=>b.at.localeCompare(a.at);
data.events=[...data.events,...trophies].sort(recentFirst).slice(0,250);
save('public/data/guild.json',data);
const editions=sqlite.prepare('SELECT day,data FROM daily_editions ORDER BY day DESC').all() as {day:string;data:string}[];
const today=new Date().toISOString().slice(0,10);
const byDay=new Map(editions.map(e=>[e.day,JSON.parse(e.data) as typeof data.events]));
for(const event of trophies) {
  const day=event.at.slice(0,10);
  if(!byDay.has(day))byDay.set(day,[]);
  byDay.get(day)!.push(event);
}
if(!byDay.has(today))byDay.set(today,[]);
save('public/data/editions.json',{days:[...byDay.keys()].sort().reverse()});
for(const [day,events] of byDay)save('public/data/editions/'+day+'.json',{events:events.sort(recentFirst)});
console.log('Exported '+data.members.length+' characters from SQLite to static JSON.');
sqlite.close();
if(failed)process.exitCode=2;
