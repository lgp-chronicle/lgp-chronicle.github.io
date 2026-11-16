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

Los originales y prompts están en `design/patio`. `render-v4.js` renderiza fuera de la web 96 fotogramas a **1920 × 1080 y 48 fps**, con profundidad de madera, tiradores curvos, herrajes elevados sin marco ni pasaje de piedra: solo las dos hojas de la puerta, con el patio directamente detrás. La web únicamente reproduce el vídeo WebM transparente (1,55 MB); la salida usa la secuencia inversa acelerada (805 KB). No ejecuta el renderer WebGL. Los navegadores sin VP9 descargan únicamente la alternativa WebP animada a 1280 × 720 y 24 fps. Los nombres `puerta-v4-*` evitan reutilizar vídeos anteriores de la caché.

La transición espera a que esté disponible la pintura del patio. Las animaciones de ambiente se decodifican después, de una en una y solo si son visibles. La salida se precarga en un momento libre después de la entrada, y se libera el decodificador de vídeo al terminar. Con movimiento reducido o ahorro de datos no se descargan las películas. Los brillos y el audio siguen cargándose solo cuando se usan.

El control de sonido está siempre visible abajo a la izquierda: botón para activar/silenciar, volumen y porcentaje, también antes de activar el audio. No hay reproducción automática. Ajustes contiene la pausa de las animaciones.

En dispositivos táctiles el patio usa scroll nativo horizontal y vertical, con inercia y zoom del navegador. La escena tiene un pequeño margen de recorrido vertical. El foco provocado por un toque no recentra la imagen durante el gesto. El arrastre con ratón y la navegación por teclado se conservan. Si existe recorrido, un indicador muestra «Arrastra para explorar» con ratón y «Desliza para explorar» en dispositivos táctiles; se oculta cuando el patio cabe entero o se entra en una vista de detalle. En móvil, el selector **Clásico / Patio** ocupa una fila independiente con blancos táctiles de 40 px y el mismo orden en ambas vistas.

El escenario, sprites, luces y mezcla ambiental conservan el diseño aprobado en las pruebas del patio. El movimiento de la llama utiliza la referencia acreditada en pantalla: [Campfire At Night · Pixabay/Pexels](https://www.pexels.com/video/campfire-at-night-855587/).

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

Los enlaces usan `../#/…`, también al publicar bajo una subcarpeta. La barra mantiene los destinos principales del sitio, incluidas las creaciones de miembros. El selector antiguo de tarjetas del prototipo no forma parte de esta versión.

## Comprobación local

Ejecutar `pnpm typecheck`, `pnpm test`, `pnpm build` y `pnpm preview`. Comprobar la portada y `/patio/`, entrada/salida, tooltips de las once zonas, teclado, Atrás, movimiento reducido y móvil. La portada no debe solicitar recursos de `/patio/` hasta elegir ese menú. Comprobar también el estandarte con una densidad de pantalla de 2: debe animarse usando el atlas optimizado.

La compilación exporta los datos de la SQLite local. Un checkout sin histórico puede mostrar un censo vacío; no sustituir el histórico de producción para hacer la prueba. Pages sincroniza y exporta su propia rama `guild-data`.
