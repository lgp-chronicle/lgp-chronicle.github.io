import type { Member } from "./types";
export function SourceNotice({ members }: { members: Member[] }) {
  const dated = members.filter(
    (m) =>
      m.data.sourceModified &&
      Number.isFinite(Date.parse(m.data.sourceModified)),
  );
  const old = dated.filter(
    (m) => Date.now() - Date.parse(m.data.sourceModified!) > 7 * 86400000,
  );
  if (!old.length) return null;
  const dates = old.map((m) => Date.parse(m.data.sourceModified!));
  const format = (n: number) =>
    new Date(n).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  return (
    <div className="notice">
      <strong>La fuente lleva tiempo sin cambiar.</strong> Blizzard fecha{" "}
      {old.length === 1 ? "este perfil" : `${old.length} perfiles`} en{" "}
      {format(Math.min(...dates))}
      {Math.max(...dates) !== Math.min(...dates)
        ? ` – ${format(Math.max(...dates))}`
        : ""}
      . «Consultado» indica cuándo lo leímos. Los rankings comparan el último
      dato publicado y el histórico registra los cambios que detectemos.
    </div>
  );
}
