const nav = [
  ["Matches", "/matches"],
  ["Teams", "/teams"],
  ["Competitions", "/competitions"],
  ["Statistics", "/statistics"],
  ["News", "/news"]
];

export default function HomePage() {
  return (
    <main className="page">
      <header className="site-header">
        <div className="container nav">
          <a className="brand" href="/">ZEDEK <span>SPORTS</span></a>
          <nav className="nav-links" aria-label="Main navigation">
            {nav.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          </nav>
        </div>
      </header>

      <section className="container hero">
        <div className="eyebrow">Local football • Ghana / Oti</div>
        <h1>The home of local football.</h1>
        <p>
          ZEDEK SPORTS follows the football people actually follow:
          local teams, competitions, fixtures, live matches, players,
          statistics and stories.
        </p>
        <div className="actions">
          <a className="button primary" href="/matches">Explore matches</a>
          <a className="button" href="/competitions">Explore competitions</a>
        </div>
      </section>

      <section className="container section">
        <div className="grid">
          <article className="card"><h2>Live Football</h2><p>Fixtures, live matches, lineups and verified results.</p></article>
          <article className="card"><h2>Football Intelligence</h2><p>Standings, player statistics, team statistics, form and H2H.</p></article>
          <article className="card"><h2>Local Stories</h2><p>News and community stories built around Oti football.</p></article>
        </div>
      </section>
    </main>
  );
}