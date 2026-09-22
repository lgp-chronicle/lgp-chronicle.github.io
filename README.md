# LGP Chronicle — edición independiente

Web completa para GitHub Pages. GitHub Actions consulta Blizzard y Warcraft Logs aproximadamente cada 15 minutos, guarda el histórico en SQLite en la rama `guild-data` y publica la web con archivos JSON. No necesita ChatGPT Sites, otro backend ni un PC encendido.

## Publicar por primera vez

1. Descomprime el ZIP. Crea un repositorio en GitHub llamado, por ejemplo, `lgp-chronicle`, con rama principal `main`.
2. Sube el contenido del proyecto a la raíz del repositorio, incluyendo `.github/workflows/publish.yml`, `seed`, `public`, `package.json` y el resto del código. No subas el ZIP como un único archivo. Comprueba que `.github` está presente: algunas vistas ocultan las carpetas que empiezan por punto.
3. El archivo `.env` incluido contiene tus cuatro credenciales. Copia sus valores en **Settings → Secrets and variables → Actions → New repository secret**, usando exactamente estos nombres:
   - `BLIZZARD_CLIENT_ID`
   - `BLIZZARD_CLIENT_SECRET`
   - `WARCRAFTLOGS_CLIENT_ID`
   - `WARCRAFTLOGS_CLIENT_SECRET`
   `.env` está excluido de Git y no se publica en la web. Si subes archivos desde la web de GitHub, omite `.env`; las claves ya estarán en Secrets.
4. En **Settings → Pages → Build and deployment → Source**, selecciona **GitHub Actions**.
5. En **Actions → Actualizar y publicar LGP Chronicle → Run workflow**, selecciona `main` y ejecútalo. Si un primer intento se inició antes de configurar Pages o las claves, vuelve a ejecutarlo ahora.
6. Espera a que termine en verde. La dirección aparecerá en el despliegue y en Settings → Pages, normalmente `https://TU-USUARIO.github.io/lgp-chronicle/`.
7. Abre esa dirección, entra en TBC y comprueba los siete personajes y la hora de comprobación. Después de una segunda ejecución correcta, comprueba que existe la rama `guild-data`. **Ya puedes eliminar el alojamiento de ChatGPT: esta edición no lo utiliza.** Comparte la nueva URL con tus amigos.

La programación se activa en la rama predeterminada `main`. Se ejecuta en los minutos 07, 22, 37 y 52 de cada hora. GitHub puede retrasar ejecuciones; no es un servicio de tiempo real. En repositorios públicos puede desactivar tareas programadas tras 60 días sin actividad: revisa Actions y reactívalas si ocurre. Las cuotas de Actions dependen del plan y la visibilidad del repositorio.

## Histórico y recuperación

`seed/export.json` contiene una copia real de los datos recuperados durante la migración, con personajes, equipo, snapshots de Blizzard y Warcraft Logs y ediciones del periódico. Se importa solamente al crear una base de datos nueva. No contiene contraseñas.

Cada ejecución descarga `guild-data/guild.sqlite`, sincroniza, guarda el archivo en esa misma rama y publica una copia de lectura en Pages. **No borres la rama `guild-data`**: contiene los nuevos registros. Sus commits permiten recuperar versiones anteriores. Descarga `guild.sqlite` para conservar una copia adicional. Si una API falla, se conservan los últimos datos válidos y el workflow avisa del fallo aunque haya publicado la web con esos datos.

Las fechas de comprobación y de actualización de Blizzard son distintas. Consultar más a menudo no obliga a Blizzard a publicar datos nuevos. Las gráficas solo crecen cuando hay observaciones reales; no se rellena el pasado ni se inventan cambios.

## Añadir personajes y cambiar frecuencia

Edita `config/characters.ts`, añade nombre, reino, región y campaña. La siguiente sincronización crea el personaje automáticamente. Forever sigue vacío y realmless hasta configurarlo.

La frecuencia de ejecución se cambia en `.github/workflows/publish.yml`, campo `schedule`. `SYNC_INTERVAL_MINUTES` es un límite mínimo adicional para evitar consultas duplicadas, no el programador. Está en 10 minutos para permitir las ejecuciones previstas cada 15 minutos. Puedes lanzar una actualización desde Actions → Run workflow.

## Desarrollo local

Requiere Node.js 24 y pnpm 11.19.0.

```sh
pnpm install --frozen-lockfile
pnpm sync
pnpm build
pnpm preview
```

Abre `http://localhost:4174`. `pnpm sync --force` omite la espera mínima local. `pnpm test` verifica cálculos y proveedores; `pnpm typecheck` comprueba TypeScript. `pnpm build` solo lee SQLite y genera archivos estáticos, sin consultar las APIs externas. Las claves se cargan desde `.env` o variables de entorno exclusivamente en el proceso de sincronización.

## Estructura y fuentes

- `providers/`: APIs oficiales, normalización, reintentos y límites.
- `services/`: sincronización, eventos, histórico y lectura de datos.
- `db/client.ts`: SQLite de Node.js y transacciones.
- `features/`, `components/`: fichas, rankings, gráficas, comparación y periódico.
- `github-pages/`: aplicación React con navegación por hash, compatible con subcarpetas y recargas de GitHub Pages.
- `scripts/standalone.mjs`: sincronización y exportación independientes.

Blizzard usa `profile-classicann-eu`. Se consultan los recursos que el perfil anuncia: nivel, clase, raza, equipo, talentos activos, estadísticas y PvP según disponibilidad. Profesiones, reputaciones y logros no se simulan si no están disponibles. Warcraft Logs usa OAuth y la API oficial de Anniversary, con zonas verificadas 1047, 1048 y 1056. Los informes se atribuyen solo con participación y reino confirmados. La falta de logs no equivale a cero rendimiento.

## Referencias de despliegue

- [GitHub Pages con workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Programación, retrasos e inactividad de Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)

Validación de esta entrega: compilación estática, TypeScript, 16 pruebas de lógica/proveedores y sincronización real correcta de los siete personajes. El workflow debe ejecutarse por primera vez en tu repositorio; esta entrega no lo activa en tu cuenta.
