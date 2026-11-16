import { ChevronDown } from "lucide-react";
import { GuildIcon } from "@/components/guild-icon";
import { siteHref } from "@/lib/public-settings";
import { archivePath } from "@/lib/guild-navigation";
import { groups, trophyCatalog } from "./trophy-catalog";
import type { Member, TrophyRoom as Room } from "./types";
import "../app/trophy-room.css";

const emptyRoom: Room = { unlocks: {}, factions: {} };
const date = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const groupIcons = [
  "tabard",
  "finish",
  "medal",
  "blacksmithing",
  "shield",
  "clue",
  "swords",
] as const;

export function RecentTrophies({ room = emptyRoom, members }: { room?: Room; members: Member[] }) {
  const latest = trophyCatalog(room.factions, room.battlefields)
    .flatMap(trophy => {
      const win = room.unlocks[trophy.id];
      return win?.winners.length ? [{trophy, win}] : [];
    })
    .sort((a, b) => b.win.at.localeCompare(a.win.at))
    .slice(0, 3);
  const roster = new Set(members.map(m => m.id));
  return <section className="recent-trophies" aria-labelledby="recent-trophy-title">
    <header>
      <h2 id="recent-trophy-title">Últimos logros</h2>
      <a href={siteHref(archivePath("awards"))}>Sala de trofeos →</a>
    </header>
    {latest.length ? <ul>{latest.map(({trophy, win}) => {
      const href = siteHref(archivePath("awards") + "?trofeo=" + encodeURIComponent(trophy.id));
      return <li key={trophy.id}>
        <GuildIcon name={trophy.icon} size={28} />
        <div>
          <a className="recent-trophy-title" href={href}>{trophy.title}</a>
          <div className="recent-winners">{win.winners.slice(0, 2).map(w =>
            roster.has(w.id)
              ? <a href={siteHref("/character/" + encodeURIComponent(w.id))} style={{color:w.tint}} key={w.id}>{w.name}</a>
              : <span style={{color:w.tint}} key={w.id}>{w.name}</span>
          )}
          {win.winners.length > 2 && <a href={href}>y {win.winners.length - 2} más</a>}
          </div>
          <time dateTime={win.at}>{date.format(new Date(win.at))}</time>
        </div>
      </li>;
    })}</ul> : <p>Todavía no se ha registrado ningún logro.</p>}
  </section>;
}
export function TrophyRoom({
  room = emptyRoom,
  members,
  selectedId,
}: {
  room?: Room;
  members: Member[];
  selectedId?: string | null;
}) {
  const catalog = trophyCatalog(room.factions, room.battlefields);
  const selected = catalog.find(trophy => trophy.id === selectedId);
  const earned = catalog.filter(t => room.unlocks[t.id]).length;
  const roster = new Set(members.map((m) => m.id));
  return (
    <section className="trophy-room" aria-labelledby="trophy-room-title">
      <header className="trophy-room-header">
        <GuildIcon name="trophy" size={70} />
        <div>
          <h3 id="trophy-room-title">Sala de trofeos</h3>
          <p>
            Los primeros de La Ganga, según la armería. Cada conquista conserva
            sus nombres y su fecha.
          </p>
        </div>
        <span>
          <b>{earned}</b> de {catalog.length} trofeos
        </span>
      </header>
      {groups.map((group, i) => {
        const entries = catalog.filter((t) => t.group === group);
        const count = entries.filter((t) => room.unlocks[t.id]).length;
        return (
          <details key={group} className="trophy-case" open={selected ? selected.group === group : i === 0}>
            <summary>
              <GuildIcon name={groupIcons[i]} size={28} />
              <strong>{group}</strong>
              <span>
                {count} / {entries.length}
              </span>
              <ChevronDown size={17} />
            </summary>
            {i === 0 && (
              <p>
                Para el equipo completo cuentan armadura, joyas, armas y el
                hueco de arma a distancia o reliquia. Un arma a dos manos cubre
                ambas manos. El tabardo tiene su propio trofeo.
              </p>
            )}
            {i === 3 && (
              <p>
                El máximo requiere completar el último tramo de al menos 300
                puntos. Las cinco profesiones deben figurar al máximo en una
                misma consulta.
              </p>
            )}
            {!entries.length && (
              <p>{group === "Campos de batalla" ? "Cada campo aparecerá con su primera partida registrada." : "Las facciones aparecerán al registrarse en la armería."}</p>
            )}
            <ul>
              {entries.map((t) => {
                const win = room.unlocks[t.id];
                return (
                  <li key={t.id} data-earned={win ? "" : undefined}
                    data-selected={selected?.id === t.id || undefined}
                    tabIndex={selected?.id === t.id ? -1 : undefined}>
                    <GuildIcon name={t.icon} size={32} />
                    <div>
                      <h4>{t.title}</h4>
                      {win ? (
                        <>
                          <p className="trophy-names">
                            {win.winners.map((w) =>
                              roster.has(w.id) ? (
                                <a
                                  key={w.id}
                                  href={siteHref(
                                    "/character/" + encodeURIComponent(w.id),
                                  )}
                                  style={{ color: w.tint }}
                                >
                                  {w.name}
                                </a>
                              ) : (
                                <span key={w.id} style={{ color: w.tint }}>
                                  {w.name}
                                </span>
                              ),
                            )}
                          </p>
                          <a className="trophy-edition" href={siteHref(archivePath("news")+"?trofeos="+win.at.slice(0,10))}>
                            El Heraldo · <time dateTime={win.at}>{date.format(new Date(win.at))}</time>
                          </a>
                        </>
                      ) : (
                        <small>Por conquistar</small>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
      <p className="trophy-room-note">
        Si varios personajes estrenan un hito en la misma consulta, comparten el
        trofeo. En el histórico antiguo se agrupan las lecturas consecutivas de
        la armería.
      </p>
    </section>
  );
}
