import { readFile, writeFile } from "node:fs/promises";
import { fullName } from "../features/member-name.ts";
import { guildVideos, prepareVideo } from "../lib/guild-videos.ts";

const eventFile = process.env.GITHUB_EVENT_PATH || process.argv[2];
if (!eventFile) throw new Error("Falta el formulario de publicación.");
const { inputs } = JSON.parse(await readFile(eventFile, "utf8"));
if (!inputs || ["url", "title", "characters"].some(key => typeof inputs[key] !== "string"))
  throw new Error("Rellena el enlace, el título y los protagonistas.");
if (inputs.description !== undefined && typeof inputs.description !== "string") throw new Error("Descripción no válida.");
const response = await fetch("https://lgp-chronicle.github.io/data/guild.json", { cache: "no-store", signal: AbortSignal.timeout(30000) });
if (!response.ok) throw new Error("No se pudo leer el censo. Inténtalo de nuevo.");
const guild = await response.json();
if (!Array.isArray(guild.members)) throw new Error("El censo no está disponible.");
const video = prepareVideo(inputs, guild.members.map(m => ({id: m.id, name: fullName(m)})), guildVideos);
const next = [...guildVideos.filter(v => v.id !== video.id), video];
next.sort((a,b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
await writeFile(new URL("../config/videos.json", import.meta.url), JSON.stringify(next, null, 2) + "\n");
console.log("Vídeo registrado. La publicación actualizará el catalejo y las fichas de sus protagonistas.");
