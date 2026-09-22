declare const __PAGES_MODE__: boolean;
export const pagesMode = typeof __PAGES_MODE__ !== 'undefined' && __PAGES_MODE__;
export function apiUrl(path:string){
 if(path==='/api/guild')return './data/guild.json';
 const day=new URL(path,'https://local.invalid').searchParams.get('day');
 if(path.startsWith('/api/editions'))return day&&/^\d{4}-\d{2}-\d{2}$/.test(day)?'./data/editions/'+day+'.json':'./data/editions.json';
 throw new Error('Unknown local dataset');
}
export const siteHref=(path:string)=>'#'+path;
export const assetUrl=(path:string)=>'.'+path;
