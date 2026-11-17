# Patio interactivo

La portada clásica sigue siendo la entrada predeterminada (`/#/`). El selector de la barra abre `/patio/` solamente al pulsar **Patio**. No se guarda una preferencia que cambie futuras visitas. **Clásico** siempre vuelve a la portada real.

El patio es una página estática independiente, incluida por Vite desde `public/patio`. No requiere otro servidor ni añade sus imágenes, audio o animaciones a la carga de la portada. `pnpm build` y el workflow de Pages publican ambos menús juntos.

## Archivos

- `public/patio/index.html`: escena, zonas enlazadas y barra de navegación.
- `patio.js` / `patio.css`: sprites, disposición y luces pintadas. La pintura y todas las capas de ambiente se preparan de una en una detrás del portón cerrado; los realces de navegación se cargan al enfocarlos.
- `sonido.js`: audio compartido de ambiente y puerta, activado inicialmente al 25 %. Recuerda volumen y silencio; respeta los bloqueos de reproducción automática del navegador.
- `navegacion.js`: hover, tooltips, teclado y encuadre de las zonas.
- `naisen.js`: versión ilustrada de Naisen del 17/11/2026, con lectura, ojos, respiración y gestos separados por pausas de 8–12 segundos. Se prepara detrás del portón y comparte pausa/movimiento reducido con el patio; usa un reloj independiente del reinicio de las otras capas.
- `vincie.js`: Vincie Quickhands del 17/11/2026, limpiando su daga con pausas breves para mirar a ambos lados. Incluye la mochila y la postura/sombras aprobadas: pie adelantado, sombras de suela y del asiento separadas por la geometría del banco. Cada fotograma sustituye el brazo completo, incluido el espacio transparente que deja al moverse, sin duplicarlo. Una máscara limita el cambio al brazo y al paño: pecho, emblema y cinturón conservan la misma pintura, con la respiración común.
- `personajes.js`: selector visible entre Naisen y Vincie. Elige uno al azar en cada entrada, sin recordar la elección anterior. Carga únicamente sus cinco recursos, conserva el personaje actual mientras prepara el siguiente y libera las imágenes/canvas retirados. El patio y el audio continúan sin reiniciarse. Ante error mantiene el anterior y permite reintentar; respeta movimiento reducido.
- `transiciones.js` / `transiciones.css`: puertas pintadas, omisión con botón/Escape, salida y recuperación al volver con Atrás. Respeta la reducción de movimiento.
- `img`, `audio`, `recursos.json`: recursos optimizados y catálogo de tamaños. Los nombres incluyen el hash del archivo; si se cambia una imagen, actualizar sus referencias.
- `app/courtyard.css`, `components/shell.tsx`: selector integrado en la navegación clásica.
- `lib/courtyard-arrival.ts`: consume una marca de sesión que dura como máximo 15 segundos para fundir la llegada desde el patio. No cambia rutas ni recuerda un modo de navegación.

Los originales y prompts están en `design/patio`. `render-v4.js` renderiza fuera de la web 96 fotogramas a **1920 × 1080 y 48 fps**, con profundidad de madera, tiradores curvos, herrajes elevados sin marco ni pasaje de piedra: solo las dos hojas de la puerta, con el patio directamente detrás. La web únicamente reproduce el vídeo WebM transparente (1,55 MB); la salida usa la secuencia inversa acelerada (805 KB). No ejecuta el renderer WebGL. Los navegadores sin VP9 descargan únicamente la alternativa WebP animada a 1280 × 720 y 24 fps. Los nombres `puerta-v4-*` evitan reutilizar vídeos anteriores de la caché.

La entrada espera a la pintura, todas las capas de ambiente decodificadas, un primer fotograma pintado, la película preparada y las dos pistas ambientales realmente en reproducción. Un sello dorado sobre la madera y una barra grabada muestran el progreso real. El reloj de la escena arranca al abrir el portón. Las capas se preparan secuencialmente entre fotogramas para repartir el coste; las ilustraciones de hover siguen siendo diferidas. Ante errores hay Reintentar y vuelta a la portada. Omitir animación/Escape omite solo la película: conserva la espera de carga. La salida y su sonido se precargan en un momento libre después de entrar y el decodificador de vídeo se libera al terminar. Con movimiento reducido o ahorro de datos no se descargan películas ni efectos de puerta.

El control de sonido está siempre visible abajo a la izquierda: botón para activar/silenciar, volumen y porcentaje. Desde el 17/11/2026, una primera visita intenta activar el sonido al 25 %; las siguientes respetan el volumen y el silencio guardados en `la-ganga:sonido-patio`. Si el navegador exige un gesto, el portón permanece cerrado y muestra «Entrar al patio» para activar el sonido; también permite «Entrar sin sonido». Se conserva un silencio elegido previamente y se puede reintentar un fallo de audio. Nunca se abre automáticamente con el ambiente aún bloqueado. El botón refleja si el audio puede reproducirse realmente. No hay menú de Ajustes. El audio se suspende al ocultar la pestaña. Al salir, el ambiente se desvanece en un bus separado para que pueda oírse el cierre; pagehide suspende todo.

Compatibilidad con Firefox: las transiciones de volumen usan `cancelScheduledValues` y `setValueAtTime` cuando falta `cancelAndHoldAtTime`. Un error al arrancar desde `statechange` se muestra en la entrada en vez de quedar sin tratar. La descarga y decodificación de cada audio tienen un límite de 20 segundos; después se puede reintentar. En cuanto están listos el escenario y el portón se permite entrar sin sonido, también durante una espera de audio. Si esa espera supera ocho segundos visibles, aparece un aviso y Reintentar. La opción silenciosa sigue siendo una decisión del visitante: no se abre antes de cargar la escena ni se silencia por defecto. La barra representa la preparación de recursos y desaparece al completarse, también cuando solo falta pulsar para activar el sonido; ese permiso ya no deja la barra al 95 %.

La apertura usa `audio/puerta-abrir-v1.ogg` (2 s, unos 12 KB), una adaptación de una grabación CC0 documentada en `design/patio/audio/CREDITOS.md`. Comparte el control de volumen y silencio con el ambiente. Se dispara al comenzar los fotogramas de apertura y se detiene al omitir/finalizar la transición; nunca se reproduce tarde después de desbloquear el audio. Un fallo al cargar el efecto no bloquea la entrada. El cierre usa `audio/puerta-cerrar-v1.ogg` (0,8 s, unos 5 KB), adaptado de otra grabación CC0 acreditada en el mismo archivo. Se dispara al comenzar los fotogramas de salida, comparte volumen/silencio y no suena cuando se omite el movimiento. El fondo de Wallpaper Engine es independiente de estos cambios.

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
| Naisen leyendo | Ficha de Naisen Grandwell |
| Vincie limpiando su daga | Ficha de Vincie Quickhands |

Naisen aparece en el banco con respaldo con su mochila y bastón. Su tooltip reproduce el aspecto de una ficha de jugador de WoW: nombre en color de brujo, `<La Ganga>`, nivel 34, gnomo, brujo, Demonología, Alianza, EU y JcJ. Incluye **Apariencia del 17/11/2026**: es una fecha fija de esta ilustración, no la fecha de visita ni un estado en vivo. Los datos proceden de la armería consultada ese día; no se inventa un rango de hermandad o estado JcJ activo. El enlace `../#/character/forever-eu-naisen-grandwell` abre la ficha con la transición del patio. Hover y foco muestran el tooltip; en táctil un toque abre directamente la ficha. Los cinco atlas optimizados suman 1.536.014 bytes y se decodifican por turnos durante la carga.

El paquete actualizado de Wallpaper Engine se genera aparte a partir de su escena aprobada, conserva sus nubes y controles y no incluye enlaces ni transición de puertas. Esta publicación no reemplaza el fondo estable anterior ni publica automáticamente el paquete en Steam Workshop.

El selector está abajo a la derecha en escritorio y sobre el sonido en móvil. El personaje visible tiene su propia silueta clicable, tooltip de jugador y ficha. Vincie figura como nivel 38, humano pícaro, Combate, con apariencia fechada el 17/11/2026. Cambiarlo oculta cualquier tooltip anterior. Sus cinco imágenes suman 517.282 bytes. Las fechas son del diseño aprobado y no representan una consulta en vivo de armería. La variante individual de Vincie para Wallpaper Engine conserva las mismas sombras, la misma animación y las correcciones del brazo y del torso; el selector es exclusivo de la web.

Los enlaces usan `../#/…`, también al publicar bajo una subcarpeta. La barra mantiene los destinos principales del sitio, incluidas las creaciones de miembros. El selector antiguo de tarjetas del prototipo no forma parte de esta versión.

## Comprobación local

Ejecutar `pnpm typecheck`, `pnpm test`, `pnpm exec vite build --config github-pages/vite.config.ts` y `pnpm preview`. Comprobar la portada y `/patio/`, entrada/salida, tooltips de las once zonas, teclado, Atrás, movimiento reducido y móvil. La portada no debe solicitar recursos de `/patio/` hasta elegir ese menú. Comprobar también el estandarte con una densidad de pantalla de 2: debe animarse usando el atlas optimizado.

La compilación exporta los datos de la SQLite local. Un checkout sin histórico puede mostrar un censo vacío; no sustituir el histórico de producción para hacer la prueba. Pages sincroniza y exporta su propia rama `guild-data`.

La entrada se ha comprobado con sprites y audio retrasados, reintento de un sprite fallido, fallo de audio y entrada en silencio, WebP alternativo, película ausente, movimiento reducido, Escape/omisión durante la carga, móvil, autoplay bloqueado, pestaña oculta y navegación de vuelta. Las pruebas instrumentan Web Audio para verificar que los bucles empiezan antes de abrir y que los efectos se sincronizan con cada película.
