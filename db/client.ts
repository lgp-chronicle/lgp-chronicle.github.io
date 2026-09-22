import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const dir=resolve(process.env.GUILD_DATA_DIR||'.guild-data');mkdirSync(dir,{recursive:true});
const file=resolve(dir,'guild.sqlite');
export const sqlite=new DatabaseSync(file);
sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
if(Number(sqlite.prepare('PRAGMA user_version').get()?.user_version)===0){
 sqlite.exec('BEGIN IMMEDIATE');
 try {
 sqlite.exec(readFileSync('drizzle/0000_thankful_blob.sql','utf8'));
 if(existsSync('seed/export.json')){
  const seed=JSON.parse(readFileSync('seed/export.json','utf8'));


   for(const table of ['campaigns','characters','character_snapshots','warcraft_logs_snapshots','activity_events','daily_editions']){
    for(const row of seed.tables[table]??[]){const cols=Object.keys(row);if(cols.some(k=>!/^[_a-z]+$/.test(k)))throw Error('Invalid seed schema');
     sqlite.prepare(`INSERT INTO ${table} (${cols.map(c=>'"'+c+'"').join(',')}) VALUES (${cols.map(()=>'?').join(',')})`).run(...cols.map(c=>row[c]));
    }
   }

 }
 sqlite.exec('PRAGMA user_version=1; COMMIT');
 } catch(e){sqlite.exec('ROLLBACK');throw e}
}
class Prepared {
 values: any[]=[];
 constructor(public sql:string){}
 bind(...values:any[]){this.values=values;return this}
 run(){const r=sqlite.prepare(this.sql).run(...this.values);return {success:true,meta:{changes:Number(r.changes)}}}
 first<T>(){return (sqlite.prepare(this.sql).get(...this.values)??null) as T|null}
 all<T>(){return {success:true,results:sqlite.prepare(this.sql).all(...this.values) as T[]}}
}
const adapter={prepare:(sql:string)=>new Prepared(sql),batch:(statements:Prepared[])=>{
 sqlite.exec('BEGIN IMMEDIATE');try{const results=statements.map(s=>s.run());sqlite.exec('COMMIT');return results}catch(e){sqlite.exec('ROLLBACK');throw e}
}};
export const database=()=>adapter as unknown as D1Database;
export const settings=()=>process.env as Record<string,string|undefined>;
