# Ilustraciones de La Ganga

Para cada ilustración nueva, consulta el censo vigente y vuelve a descargar el retrato y el modelo de la armería de cada protagonista. Contrasta el equipo de la misma ficha y respeta las correcciones visuales o referencias manuales del jugador si el modelo está defectuoso.

## Actividad antes de elegir protagonistas

Por indicación del usuario, los personajes con **5 días completos o más sin cambios registrados** quedan fuera del Cuadro de honor, los premios actuales y la selección automática para nuevas ilustraciones, portadas y escenas. Si no hay una fecha de actividad fiable, tampoco se eligen. Volver a consultar una ficha sin cambios no cuenta como actividad. Cuando vuelvan a registrar cambios, vuelven a ser candidatos.

Antes de preparar imágenes, ejecuta `node scripts/illustration-candidates.mjs`: consulta el censo publicado y aplica el mismo filtro de actividad que la web, junto con la disponibilidad de armería y las correcciones manuales. El resultado incluye cuántas ilustraciones tiene cada candidato: combina azar y un reparto razonable **solo entre los candidatos activos**. Después vuelve a descargar e inspeccionar las referencias y el equipo como se indica arriba. La cifra no sustituye esa comprobación visual. Una petición explícita del usuario de retratar a alguien tiene prioridad sobre la selección automática.

La regla no elimina ilustraciones históricas ni trofeos permanentes ya ganados. El calendario de actividad conserva su vista de siete días; el corte de elegibilidad es de cinco días.

Al preparar una portada, un retrato o una escena de grupo, comprueba por separado si cada personaje lleva un objeto en la ranura de tabardo (`slotType: TABARD` o `slot: Tabardo`). También puedes confirmarlo con una captura o indicación del jugador.

Siempre que lleve cualquier tabardo equipado, píntalo con la apariencia de la hermandad: tela amarilla y dos serpientes negras entrelazadas en el pecho. Aplica este diseño aunque el modelo de la armería muestre otro dibujo o una textura defectuosa, como ocurre con Franz Martel. Si el personaje no lleva tabardo, conserva visible su equipo de pecho.

Usa [el tabardo de Alexion Grandwell](config/illustration-references/alexion-grandwell.webp) como referencia de cómo cae la tela y [el escudo de La Ganga](public/guild/escudo-la-ganga.webp) para el amarillo y la silueta de las serpientes. En la tela va solo el motivo de las serpientes.

## Cara de Naisen Grandwell

La armería de Naisen Grandwell (`forever-eu-naisen-grandwell`) muestra una apariencia facial incorrecta. En todas las ilustraciones futuras, usa estas referencias proporcionadas por el jugador como identidad de su cara:

- [Cara de Naisen, referencia 1](config/illustration-references/naisen-grandwell-cara-1.png).
- [Cara de Naisen, referencia 2](config/illustration-references/naisen-grandwell-cara-2.png).

Conserva sus rasgos de gnomo, su piel cálida, nariz prominente, orejas grandes, pelo verde con tupé, cejas verdes espesas y bigote verde. No copies la cara ni la piel bugueadas del modelo de la armería.

Consulta la armería actual para la armadura y el resto del equipo: las imágenes de referencia fijan la cara, no el atuendo. Si lleva casco, dibuja ese casco y conserva esta identidad en las partes visibles del rostro; no le quites el casco para mostrar el pelo. Esta corrección afecta solo a Naisen Grandwell, no a otros personajes de nombre parecido.

## Alexion Grandwell

Alexion es un elfo de la noche, con pelo blanco y barba blanca corta, como en [su referencia manual](config/illustration-references/alexion-grandwell.webp). El 16 de noviembre la ficha vuelve a indicar correctamente la raza, pero sus imágenes de armería muestran otra vez un no-muerto. Si ocurre, conserva la identidad de elfo de la referencia manual y consulta los objetos de la ficha para actualizar su equipo; no reproduzcas la cara, el cuerpo ni el atuendo del modelo incorrecto.
