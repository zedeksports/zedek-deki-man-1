'use client';

import { useEffect, useMemo, useState } from "react";
import HomeLiveData from "./HomeLiveData";

const nav = [
  ["Matches", "/matches"],
  ["Teams", "/teams"],
  ["Competitions", "/competitions"],
  ["Statistics", "/statistics"],
];

function dayItems() {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return {
      key: new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "Africa/Accra",
      }).format(d),
      day:
        i === 0
          ? "TODAY"
          : d.toLocaleDateString("en-GH", {
              weekday: "short",
              timeZone: "Africa/Accra",
            }).toUpperCase(),
      date: d.toLocaleDateString("en-GH", {
        day: "numeric",
        month: "short",
        timeZone: "Africa/Accra",
      }),
    };
  });
}

export default function HomePage() {
  const [night, setNight] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const days = useMemo(() => dayItems(), []);
  const [selectedDay, setSelectedDay] = useState(days[0].key);

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
      <header className="site-header zedek-score-header">
        <div className="container nav">
          <a className="brand" href="/" aria-label="Zedek Sports home">
            <span className="brand-mark">Z</span>
            <span>ZEDEK <b>SPORTS</b></span>
          </a>
          <nav className="nav-links" aria-label="Main navigation">
            {nav.map(([label, href]) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </nav>
          <div className="header-actions">
            <button className="icon-button" onClick={() => setSearchOpen((x) => !x)} aria-label="Search Zedek Sports" title="Search">⌕</button>
            <button className="theme-button" onClick={toggleTheme} aria-label="Toggle day and night mode">{night ? "☀" : "☾"}</button>
          </div>
        </div>
      </header>

      <div className={searchOpen ? "quick-search open" : "quick-search"}>
        <form className="container quick-search-inner" action="/search" method="get">
          <span>⌕</span>
          <input name="q" placeholder="Search teams, players, competitions or matches…" aria-label="Quick search" />
          <button type="submit">Search</button>
          <a href="/search">Full search →</a>
        </form>
      </div>

      <section className="score-hero">
        <div className="container score-hero-inner">
          <div>
            <span className="section-kicker"><i className="score-live-dot" /> OTI FOOTBALL NETWORK</span>
            <h1>Everything local football.<br /><em>At a glance.</em></h1>
            <p>Live scores, fixtures, results, teams and competitions — built around the football of Oti.</p>
          </div>
          <a className="score-live-card" href="/matches">
            <span>ZEDEK MATCH CENTRE</span>
            <strong><i className="score-live-dot" /> LIVE &amp; UPCOMING</strong>
            <b>Follow the game as it happens.</b>
            <small>Open Match Centre →</small>
          </a>
        </div>
      </section>

      <section className="container score-feed">
        <div className="score-topbar">
          <div>
            <span className="section-kicker">FOOTBALL</span>
            <h2>Matches</h2>
          </div>
          <a href="/matches" className="score-all-link">All matches →</a>
        </div>

        <div className="score-date-strip" aria-label="Match dates">
          {days.map((d) => (
            <button
              type="button"
              key={d.key}
              className={selectedDay === d.key ? "score-day active" : "score-day"}
              onClick={() => setSelectedDay(d.key)}
            >
              <b>{d.day}</b><span>{d.date}</span>
            </button>
          ))}
          <label className="score-calendar" aria-label="Choose match date">
            <span>CAL</span>
            <input type="date" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} />
          </label>
        </div>

        <div className="score-filter-row">
          <span className="score-filter active">ALL</span>
          <span className="score-filter">LIVE</span>
          <span className="score-filter">UPCOMING</span>
          <span className="score-filter">RESULTS</span>
          <span className="score-filter">MY TEAMS</span>
        </div>

        <div className="score-live-banner">
          <span><i className="score-live-dot" /> LIVE CENTRE</span>
          <strong>Official Zedek match information</strong>
          <a href="/matches">Open live matches →</a>
        </div>

        <HomeLiveData selectedDay={selectedDay} />
      </section>

      <section className="container score-explore">
        <div className="score-topbar">
          <div><span className="section-kicker">EXPLORE ZEDEK</span><h2>More football.</h2></div>
        </div>
        <div className="score-explore-grid">
          <a href="/teams"><span>01</span><strong>Teams</strong><small>Follow local clubs and their squads.</small><b>→</b></a>
          <a href="/competitions"><span>02</span><strong>Competitions</strong><small>Track cups, tournaments and divisions.</small><b>→</b></a>
          <a href="/statistics"><span>03</span><strong>Statistics</strong><small>Standings, form, scorers and player data.</small><b>→</b></a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div><div className="brand footer-brand"><span className="brand-mark">Z</span><span>ZEDEK <b>SPORTS</b></span></div><p>Local football. Properly followed.</p></div>
          <div className="footer-links">{nav.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</div>
        </div>
      </footer>
    </main>
  );
}
