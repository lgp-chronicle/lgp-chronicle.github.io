import { siteHref } from "@/lib/public-settings";
import {
  ArrowRight,
  LockKeyhole,
  Swords,
  ScrollText,
  Trophy,
  Sparkles,
} from "lucide-react";
import { characters } from "@/config/characters";
import { Shell } from "@/components/shell";
export default function Home() {
  const cards = [
    {
      Icon: Swords,
      n: "01",
      title: "La próxima compañía",
      copy: "Los héroes llegarán cuando se abra el portal. Por ahora, todas las leyendas están por escribir.",
    },
    {
      Icon: ScrollText,
      n: "02",
      title: "El diario de nuestras hazañas",
      copy: "Cada nivel, cada adelantamiento y cada pequeña victoria tendrán su lugar en la crónica.",
    },
    {
      Icon: Trophy,
      n: "03",
      title: "La gloria se gana",
      copy: "Rivalidad amistosa, premios cambiantes y suficientes motivos para mirar quién va primero.",
    },
  ];
  return (
    <Shell>
      <main>
        <section className="forever-hero">
          <div className="hero-shade" />
          <div className="hero-copy">
            <p className="eyebrow">✧ UNA NUEVA HISTORIA NOS ESPERA</p>
            <h1>
              WoW
              <br />
              <em>Forever.</em>
            </h1>
            <p className="coming">COMING SOON</p>
            <p className="hero-description">
              Mismos amigos. Nuevas aventuras.
              <br />Y alguna que otra decisión cuestionable.
            </p>
            <div className="hero-actions">
              <a href={siteHref("/tbc")} className="button gold">
                Mientras tanto, vamos a Terrallende <ArrowRight size={18} />
              </a>
              <span>
                <LockKeyhole size={14} /> El próximo capítulo aún está sellado
              </span>
            </div>
          </div>
          <div className="hero-caption">
            <span>CAPÍTULO 01</span>
            <strong>La aventura aún no ha comenzado.</strong>
            <small>The adventure has not begun yet.</small>
          </div>
        </section>
        <section className="waiting-strip">
          <div>
            <Sparkles size={21} />
            <span>EL DESTINO ESTÁ ESCRIBIÉNDOSE</span>
          </div>
          <p>Sin fecha. Sin prisas. Con demasiadas ganas.</p>
          <span>✧</span>
        </section>
        <section className="chapter-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">AQUÍ EMPIEZA LO NUESTRO</p>
              <h2>Un grupo. Mil historias.</h2>
            </div>
            <p>
              Las mejores estadísticas todavía
              <br />
              no caben en una tabla.
            </p>
          </div>
          <div className="chapter-grid">
            {cards.map(({ Icon, n, title, copy }) => (
              <article className="chapter-card" key={n}>
                <div className="chapter-top">
                  <Icon size={28} />
                  <span>{n}</span>
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
                <span className="locked">
                  <LockKeyhole size={12} /> SE DESBLOQUEA CON LA CAMPAÑA
                </span>
              </article>
            ))}
          </div>
        </section>
        <section className="tbc-invite">
          <div>
            <p className="eyebrow">LA OTRA CARA DEL PORTAL</p>
            <h2>Terrallende tiene nuestros nombres.</h2>
            <p>
              {characters
                .filter((c) => c.campaign === "tbc")
                .map((c) => c.name)
                .join(", ")}
              .
            </p>
          </div>
          <a className="button outline" href={siteHref("/tbc")}>
            Entrar en WoW TBC <ArrowRight size={18} />
          </a>
        </section>
      </main>
    </Shell>
  );
}
