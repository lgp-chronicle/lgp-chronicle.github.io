import assert from "node:assert/strict";
import test from "node:test";
import { prepareVideo, validateVideo, videoEmbed, videoAuthor, videosForMember, withGalleryVideo, youtubeIdFromUrl } from "../lib/guild-videos.ts";
import { galleryBasePath } from "../lib/guild-navigation.ts";
const members = [{id:"forever-eu-naisen-grandwell",name:"Naisen Grandwell"}, {id:"forever-eu-rast-puñotormenta",name:"Rast Puñotormenta"}];
const input = {url:"https://youtu.be/M7lc1UVf-VE?si=ignored",title:"La expedición",characters:"Naisen Grandwell, Rast Puñotormenta",description:"Por los caminos de Azeroth."};

test("YouTube links accept watch, short, embed and mobile formats but reject lookalike hosts and unsafe URLs", () => {
  for (const url of [input.url,"https://www.youtube.com/watch?v=M7lc1UVf-VE&list=abc","https://m.youtube.com/shorts/M7lc1UVf-VE","https://www.youtube-nocookie.com/embed/M7lc1UVf-VE","https://youtube.com/live/M7lc1UVf-VE"])
    assert.equal(youtubeIdFromUrl(url),"M7lc1UVf-VE");
  for (const url of ["javascript:alert(1)","https://youtube.com.evil.test/watch?v=M7lc1UVf-VE","https://youtube.com@evil.test/watch?v=M7lc1UVf-VE","http://youtu.be/M7lc1UVf-VE","https://youtu.be/short","https://youtube.com/playlist?list=abc","https://user@youtu.be/M7lc1UVf-VE","https://youtu.be:8000/M7lc1UVf-VE"])
    assert.equal(youtubeIdFromUrl(url),null);
});

test("publication resolves full character names, deduplicates cast and updates a film without resetting its premiere", () => {
  const video=prepareVideo(input,members,[],"2026-11-16T12:00:00Z");
  assert.deepEqual(video.memberIds,members.map(m=>m.id)); assert.equal(video.authorId,videoAuthor);
  const revised=prepareVideo({...input,title:"La expedición revisada",characters:"naisen grandwell, Naisen Grandwell; rast punotormenta"},members,[video],"2026-11-18T12:00:00Z");
  assert.equal(revised.id,video.id); assert.equal(revised.publishedAt,video.publishedAt); assert.equal(revised.memberIds.length,2);
  assert.throws(()=>prepareVideo({...input,characters:"Naisen"},members,[]),/nombre completo/);
  assert.throws(()=>prepareVideo({...input,characters:""},members,[]),/protagonista/);
  assert.throws(()=>prepareVideo({...input,title:" "},members,[]),/no es válida/);
  assert.throws(()=>validateVideo({...video,youtubeId:"bad/path"}));
  assert.throws(()=>validateVideo({...video,publishedAt:"bad date"}));
});

test("personal video archives retain historical appearances and exclude unpublished future entries", () => {
  const a=prepareVideo(input,members,[],"2026-11-15T12:00:00Z");
  const b={...a,id:"new",youtubeId:"abcdefghijk",memberIds:[members[1].id],publishedAt:"2026-11-16T12:00:00Z"};
  const future={...b,id:"future",publishedAt:"2026-11-20T12:00:00Z"};
  const now=Date.parse("2026-11-17T12:00:00Z");
  assert.deepEqual(videosForMember(undefined,now,[a,future,b]).map(v=>v.id),["new",a.id]);
  assert.deepEqual(videosForMember(members[0].id,now,[a,b]),[a]);
});

test("film links preserve character tabs, clear illustration selection and share the site's own route", () => {
  const path="/character/forever-eu-naisen-grandwell?tab=gallery&escena=mapa";
  const selected=withGalleryVideo(path,"v-M7lc1UVf-VE");
  assert.equal(selected,"/character/forever-eu-naisen-grandwell?tab=gallery&vista=videos&video=v-M7lc1UVf-VE");
  assert.equal(galleryBasePath(selected),withGalleryVideo(path,null));
  const embed=new URL(videoEmbed(prepareVideo(input,members,[])));
  assert.equal(embed.hostname,"www.youtube-nocookie.com"); assert.equal(embed.searchParams.get("playsinline"),"1"); assert.equal(embed.searchParams.has("autoplay"),false);
});
