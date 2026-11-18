import { assetUrl } from "./public-settings";

export const guildWallpaper = {
  title: "El patio de La Ganga",
  description: "La fortaleza de la hermandad, ahora en tu escritorio.",
  authorId: "forever-eu-naisen-grandwell",
  author: "Naisen Grandwell",
  requestNote: "Iré añadiendo personajes a petición.",
  image: assetUrl("/guild/wallpaper/patio.jpg"),
  editions: [
    {
      id: "naisen",
      character: "Naisen Grandwell",
      description: "Un rato de lectura junto a la hoguera.",
      image: assetUrl("/guild/wallpaper/patio.jpg"),
      alt: "Naisen lee junto a la hoguera en el patio de La Ganga.",
      workshopUrl: "https://steamcommunity.com/sharedfiles/filedetails/?id=3841368821",
    },
    {
      id: "vincie",
      character: "Vincie Quickhands",
      description: "Una daga reluciente y un ojo en cada rincón del patio.",
      image: assetUrl("/guild/wallpaper/vincie.jpg"),
      alt: "Vincie limpia su daga sentado junto a la hoguera, con su mochila al lado.",
      workshopUrl: "https://steamcommunity.com/sharedfiles/filedetails/?id=3841449495",
    },
    {
      id: "roman",
      character: "Rompecraneos Roman",
      description: "Una siesta después de entrenar. Ronquidos, pompas y algún sobresalto.",
      image: assetUrl("/guild/wallpaper/roman.jpg"),
      alt: "Rompecraneos Roman duerme junto a la hoguera del patio con su mochila de guerrero.",
      workshopUrl: "https://steamcommunity.com/sharedfiles/filedetails/?id=3841877255",
    },
    {
      id: "olynn",
      character: "Olynn Grandwell",
      description: "Preparando los cebos para la próxima jornada de pesca.",
      image: assetUrl("/guild/wallpaper/olynn.jpg"),
      alt: "Olynn prepara cebos de pesca en el patio de La Ganga, con su cesta y la caña junto al banco.",
      workshopUrl: "https://steamcommunity.com/sharedfiles/filedetails/?id=3841985732",
    },
  ],
};
