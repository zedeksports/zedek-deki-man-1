import ControlRoomDashboard from "./control-room-dashboard";
import ControlRoomShell from "./control-room-shell";

const modules = [
  ["Competitions", "Manage competitions, formats and seasons.", "/control-room/competitions"],
  ["Teams & Players", "Manage clubs, squads and player records.", "/control-room/teams"],
  ["Coaches", "Manage coaches, assignments and history.", "/control-room/coaches"],
  ["Fixtures", "Create, reschedule and verify fixtures.", "/control-room/matches"],
  ["Match Control", "Operate live matches, score and events.", "/control-room/match-control"],
  ["Lineups", "Starting XI, substitutes, captain and formation.", "/control-room/lineups"],
  ["Reports & Verification", "Reports, corrections and official results.", "/control-room/reports"],
  ["Statistics Hub", "Official team, player and competition intelligence.", "/control-room/statistics"],
  ["Newsroom", "Create, review, publish and archive stories.", "/control-room/newsroom"]
];

function Dashboard() {
  return (
    <main className="page">
      <header className="site-header">
        <div className="container nav">
          <a className="brand" href="/">ZEDEK <span>SPORTS</span></a>
          <nav className="nav-links" aria-label="Control Room navigation"><a href="/">Public Site</a></nav>
        </div>
      </header>
      <section className="container page-header">
        <div className="eyebrow">Operations</div><h1>Control Room</h1>
        <p>The operational foundation for running local football accurately.</p>
      </section>
      <section className="container section"><ControlRoomDashboard /></section>
      <section className="container module-grid">
        {modules.map(([title, description, href]) => <a className="module" href={href} key={title}><strong>{title}</strong><small>{description}</small></a>)}
      </section>
    </main>
  );
}

export default function ControlRoomPage() {
  return <ControlRoomShell><Dashboard /></ControlRoomShell>;
}
