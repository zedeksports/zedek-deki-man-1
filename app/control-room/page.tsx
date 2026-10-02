const modules = [
  ["Competitions", "Manage competitions, formats and seasons."],
  ["Teams & Players", "Manage clubs, squads and player records."],
  ["Coaches", "Manage coaches, assignments and history."],
  ["Fixtures", "Create, reschedule and verify fixtures."],
  ["Match Control", "Operate live matches, score and events."],
  ["Lineups", "Starting XI, substitutes, captain and formation."],
  ["Reports & Verification", "Reports, corrections and official results."],
  ["Statistics Hub", "Official team, player and competition intelligence."],
  ["Newsroom", "Create, review, publish and archive stories."]
];

export default function ControlRoomPage() {
  return (
    <main className="page">
      <header className="site-header">
        <div className="container nav">
          <a className="brand" href="/">ZEDEK <span>SPORTS</span></a>
          <nav className="nav-links" aria-label="Control Room navigation">
            <a href="/">Public Site</a>
          </nav>
        </div>
      </header>

      <section className="container page-header">
        <div className="eyebrow">Operations</div>
        <h1>Control Room</h1>
        <p>The operational foundation for running local football accurately.</p>
      </section>

      <section className="container module-grid">
        {modules.map(([title, description]) => (
          <article className="module" key={title}>
            <strong>{title}</strong>
            <small>{description}</small>
          </article>
        ))}
      </section>
    </main>
  );
}
