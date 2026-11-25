import type { CoverScene } from './guild-covers';

export const galleryCategories = [
  { id: 'bienvenidas', title: 'Bienvenidas', description: 'Nuevas caras, un mismo hogar.', icon: 'tabard' },
  { id: 'aventuras', title: 'Aventuras y batallas', description: 'Misiones, expediciones y encuentros en Azeroth.', icon: 'swords' },
  { id: 'ocurrencias', title: 'Líos y ocurrencias', description: 'Los planes que no salieron como esperábamos.', icon: 'clue' },
  { id: 'taberna', title: 'Taberna y celebraciones', description: 'Una pausa entre aventuras.', icon: 'campfire' },
  { id: 'fortaleza', title: 'Vida en la fortaleza', description: 'Oficios, rincones y momentos de los nuestros.', icon: 'keep' },
] as const;
export type GalleryCategory = typeof galleryCategories[number]['id'];

// Editorial grouping; new welcomes are classified automatically. Other new scenes
// default to fortress life until their theme is assigned here.
const themes: Partial<Record<string, GalleryCategory>> = {
  'acero-en-zulfarrak': 'aventuras',
  'guardia-de-cama': 'fortaleza',
  'luciernagas-en-la-azotea': 'fortaleza',
  'puerta-de-al-lado': 'ocurrencias',
  'campana-de-la-marea': 'aventuras',
  'puente-entre-brumas': 'aventuras', 'tetera-sin-permiso': 'ocurrencias',
  'libro-a-flote': 'fortaleza',
  'murlocs-nightray': 'aventuras', colmillos: 'aventuras', emboscada: 'aventuras',
  desolace: 'aventuras', reyerta: 'aventuras', impostor: 'aventuras',
  rastro: 'aventuras', humedales: 'aventuras', cripta: 'aventuras',
  'limpieza-arcana': 'ocurrencias', 'sueno-onyxia': 'ocurrencias',
  carpinteros: 'ocurrencias', pan: 'ocurrencias', contrato: 'ocurrencias',
  gallina: 'ocurrencias', cabra: 'ocurrencias', despensa: 'ocurrencias',
  grifon: 'ocurrencias', mandragora: 'ocurrencias', cisterna: 'ocurrencias',
  dardos: 'taberna', espuma: 'taberna', ajedrez: 'taberna', paella: 'taberna',
  farol: 'taberna', prensa: 'taberna', pique: 'taberna', cocinas: 'taberna',
};
export function galleryCategory(id: string, scene: CoverScene): GalleryCategory {
  return scene.party ? 'bienvenidas' : themes[id] ?? 'fortaleza';
}
