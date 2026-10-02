'use client';

import HomeLiveData from "./HomeLiveData";

import { useEffect, useState } from "react";

const nav = [
  ["Matches", "/matches"],
  ["Teams", "/teams"],
  ["Competitions", "/competitions"],
  ["Statistics", "/statistics"],
];

export default function HomePage() {
  const [night, setNight] = useState(false);

  useEffect(() => {
    setNight(localStorage.getItem("zedek-theme") === "night");
  }, []);

  function toggleTheme() {
    const next = !night;
    setNight(next);
    localStorage.setItem("zedek-theme", next ? "night" : "day");
  }

  return (
    <main className={night ? "page theme-night" : "page theme-day"}>
      <header className="site-header">
        <div className="container nav">
          <a className="brand" href="/" aria-label="Zedek Sports home">
            <span className="brand-mark">Z</span><span>ZEDEK <b>SPORTS</b></span>
          </a>
          <nav className="nav-links" aria-label="Main navigation">
            {nav.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          </nav>
          <div className="header-actions">
            <button className="icon-button" onClick={()=>document.getElementById("zedek-search")?.classList.toggle("open")} aria-label="Search Zedek Sports" title="Search">⌕</button>
            <button className="theme-button" onClick={toggleTheme} aria-label="Toggle day and night mode">{night ? "☀" : "☾"}</button>
          </div>
        </div>
      </header>

      <section className="hero-shell">
        <div className="container hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot" /> Ghana • Oti local football</div>
            <h1>Football <em>where it matters.</em></h1>
            <p>Follow the teams, matches, players and competitions that make local football matter. Official information, presented simply.</p>
            <div className="actions">
              <a className="button primary" href="/matches">Explore matches <span>→</span></a>
              <a className="button" href="/teams">Find a team</a>
            </div>
          </div>

          <div className="hero-panel" aria-label="Zedek Sports match preview">
            <div className="panel-top"><span>ZEDEK MATCH CENTRE</span><b>LIVE</b></div>
            <div className="match-preview">
              <div className="match-meta">LOCAL FOOTBALL • TODAY</div>
              <div className="teams-preview">
                <div><div className="crest-placeholder">AC</div><strong>Dmk Ac Milan</strong></div>
                <div className="score-preview"><small>FT</small><b>2 — 1</b></div>
                <div><div className="crest-placeholder">MS</div><strong>Mountaineers</strong></div>
              </div>
            </div>
            <div className="panel-foot"><span>Official result</span><a href="/matches">Match centre →</a></div>
          </div>
        </div>
      </section>

      <HomeLiveData />

      <section className="container section">
        <div className="section-heading">
          <div><span className="section-kicker">Explore</span><h2>Your football, one place.</h2></div>
          <a href="/matches" className="quiet-link">View all →</a>
        </div>
        <div className="feature-grid">
          <a className="feature-card" href="/matches"><span className="feature-icon">●</span><div><h3>Match Centre</h3><p>Fixtures, results, lineups and live match information.</p></div><span className="arrow">↗</span></a>
          <a className="feature-card" href="/competitions"><span className="feature-icon">◆</span><div><h3>Competitions</h3><p>Follow cups, divisions and tournaments across Oti.</p></div><span className="arrow">↗</span></a>
          <a className="feature-card" href="/statistics"><span className="feature-icon">⌁</span><div><h3>Football Intelligence</h3><p>Standings, form, scorers, player statistics and H2H.</p></div><span className="arrow">↗</span></a>
        </div>
      </section>

      <section className="container section split-section">
        <div className="story-block">
          <span className="section-kicker">Built for Oti</span>
          <h2>Local football deserves a proper home.</h2>
          <p>Zedek Sports brings the football people follow every weekend into one clear, reliable experience.</p>
          <a className="text-link" href="/teams">Explore local teams →</a>
        </div>
        <div className="quote-panel">
          <span>01</span><strong>View</strong><small>official football information</small>
          <strong>Follow</strong><small>the teams and competitions you care about</small>
          <strong>Explore</strong><small>players, matches and statistics</small>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div><div className="brand footer-brand"><span className="brand-mark">Z</span><span>ZEDEK <b>SPORTS</b></span></div><p>Local football. Properly followed.</p></div>
          <div className="footer-links"><a href="/matches">Matches</a><a href="/teams">Teams</a><a href="/competitions">Competitions</a><a href="/statistics">Statistics</a></div>
        </div>
      </footer>
    </main>
  );
}