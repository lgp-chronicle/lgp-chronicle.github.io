# Patio interactivo

La portada clásica sigue siendo la entrada predeterminada (`/#/`). El selector de la barra abre `/patio/` solamente al pulsar **Patio**. No se guarda una preferencia que cambie futuras visitas. **Clásico** siempre vuelve a la portada real.

El patio es una página estática independiente, incluida por Vite desde `public/patio`. No requiere otro servidor ni añade sus imágenes, audio o animaciones a la carga de la portada. `pnpm build` y el workflow de Pages publican ambos menús juntos.

## Archivos

- `public/patio/index.html`: escena, zonas enlazadas y barra de navegación.
- `patio.js` / `patio.css`: sprites, ambiente, disposición y luces pintadas. Las capas visibles se decodifican de una en una después de abrir las puertas; los realces se cargan al enfocarlos. El audio se activa manualmente.
- `navegacion.js`: hover, tooltips, teclado y encuadre de las zonas.
- `transiciones.js` / `transiciones.css`: puertas pintadas, omisión con botón/Escape, salida y recuperación al volver con Atrás. Respeta la reducción de movimiento.
- `img`, `audio`, `recursos.json`: recursos optimizados y catálogo de tamaños. Los nombres incluyen el hash del archivo; si se cambia una imagen, actualizar sus referencias.
- `app/courtyard.css`, `components/shell.tsx`: selector integrado en la navegación clásica.
- `lib/courtyard-arrival.ts`: consume una marca de sesión que dura como máximo 15 segundos para fundir la llegada desde el patio. No cambia rutas ni recuerda un modo de navegación.

El original de las puertas y su prompt están en `design/patio`. La ilustración se generó tomando como referencia el patio aprobado; dos recortes WebP se animan como hojas rígidas. El escenario, sprites, luces y mezcla ambiental conservan el diseño aprobado en las pruebas del patio. El movimiento de la llama utiliza la referencia acreditada en pantalla: [Campfire At Night · Pixabay/Pexels](https://www.pexels.com/video/campfire-at-night-855587/).

## Destinos

| Elemento | Sección |
| --- | --- |
| Puerta y cartel de la taberna | Actividad y cotilleos |
| Cuartel | Hermandad |
| Tablón | El Heraldo |
| Diana | Cara a cara |
| Mapa | Leveling Race |
| Puertas con laureles | Salón de la fama |
| Galería | Galería de ilustraciones |
| Hoguera | Portada |
| Estandarte | Composición de la hermandad |
| Gato | Mascotas y monturas |

Los enlaces usan `../#/…`, también al publicar bajo una subcarpeta. La barra mantiene los cuatro destinos principales del sitio. El selector antiguo de tarjetas del prototipo no forma parte de esta versión.

## Comprobación local

Ejecutar `pnpm typecheck`, `pnpm test`, `pnpm build` y `pnpm preview`. Comprobar la portada y `/patio/`, entrada/salida, tooltips de las once zonas, teclado, Atrás, movimiento reducido y móvil. La portada no debe solicitar recursos de `/patio/` hasta elegir ese menú. Comprobar también el estandarte con una densidad de pantalla de 2: debe animarse usando el atlas optimizado.

La compilación exporta los datos de la SQLite local. Un checkout sin histórico puede mostrar un censo vacío; no sustituir el histórico de producción para hacer la prueba. Pages sincroniza y exporta su propia rama `guild-data`.
