export const professions = [
  ["Mining", "Minería", "mining"],
  ["Engineering", "Ingeniería", "engineering"],
  ["Cooking", "Cocina", "cooking"],
  ["Fishing", "Pesca", "fishing"],
  ["First Aid", "Primeros auxilios", "first-aid"],
  ["Herbalism", "Herboristería", "herbalism"],
  ["Leatherworking", "Peletería", "leatherworking"],
  ["Skinning", "Desuello", "skinning"],
  ["Alchemy", "Alquimia", "alchemy"],
  ["Blacksmithing", "Herrería", "blacksmithing"],
  ["Tailoring", "Sastrería", "tailoring"],
  ["Enchanting", "Encantamiento", "enchanting"],
] as const;
export const knownProfession = (name: string) =>
  professions.find(([en, es]) =>
    [en.toLowerCase(), es.toLowerCase()].includes(name.trim().toLowerCase()),
  );
