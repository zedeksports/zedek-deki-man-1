"use client";

import { FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";

type Competition = { id: string; name: string; is_active: boolean };
type Season = {
  id: string; competition_id: string; name: string; year: number | null;
  start_date: string | null; end_date: string | null; is_active: boolean;
};

export default function SeasonsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [items, setItems] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ competition_id: "", name: "", year: "", start_date: "", end_date: "" });

  async function load() {
    setLoading(true); setError("");
    const supabase = createSupabaseBrowserClient();
    const [{ data: comps, error: ce }, { data: seasons, error: se }] = await Promise.all([
      supabase.from("competitions").select("id,name,is_active").order("name"),
      supabase.from("seasons").select("id,competition_id,name,year,start_date,end_date,is_active").order("year", { ascending: false, nullsFirst: false }).order("name")
    ]);
    if (ce) setError(ce.message);
    else setCompetitions(comps ?? []);
    if (se) setError(se.message);
    else setItems(seasons ?? []);
    if (!form.competition_id && comps?.length) setForm((f) => ({ ...f, competition_id: comps[0].id }));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createSeason(event: FormEvent) {
    event.preventDefault();
    if (!form.competition_id || !form.name.trim()) return;
    setSaving(true); setError(""); setNotice("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("seasons").insert({
      competition_id: form.competition_id,
      name: form.name.trim(),
      year: form.year ? Number(form.year) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null
    });
    if (error) setError(error.message);
    else {
      setForm((f) => ({ ...f, name: "", year: "", start_date: "", end_date: "" }));
      setNotice("Season created.");
      await load();
    }
    setSaving(false);
  }

  async function toggleActive(item: Season) {
    setError(""); setNotice("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("seasons").update({ is_active: !item.is_active }).eq("id", item.id);
    if (error) setError(error.message); else { setNotice(`Season ${item.is_active ? "deactivated" : "activated"}.`); await load(); }
  }

  async function editSeason(item: Season) {
    const name = window.prompt("Season name", item.name);
    if (name === null) return;
    const yearText = window.prompt("Year (optional)", item.year?.toString() ?? "");
    if (yearText === null) return;
    const supabase = createSupabaseBrowserClient();
    setError(""); setNotice("");
    const { error } = await supabase.from("seasons").update({
      name: name.trim() || item.name,
      year: yearText.trim() ? Number(yearText) : null
    }).eq("id", item.id);
    if (error) setError(error.message); else { setNotice("Season updated."); await load(); }
  }

  async function remove(item: Season) {
    if (!window.confirm(`Archive “${item.name}”? It will remain available for historical records.`)) return;
    setError(""); setNotice("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("seasons").update({ is_active: false }).eq("id", item.id);
    if (error) setError(error.message); else { setNotice("Season archived."); await load(); }
  }

  const competitionName = (id: string) => competitions.find((c) => c.id === id)?.name ?? "Unknown competition";

  return (
    <main className="page">
      <header className="site-header"><div className="container nav"><a className="brand" href="/control-room">ZEDEK <span>SPORTS</span></a><nav className="nav-links"><a href="/control-room">Control Room</a><a href="/control-room/competitions">Competitions</a></nav></div></header>
      <section className="container page-header"><div className="eyebrow">Football Operations · Phase 2</div><h1>Season Management</h1><p>Connect each season to a competition, dates and an active state before stages and fixtures are created.</p></section>

      <section className="container section">
        <div className="panel">
          <h2>Create season</h2>
          {competitions.length === 0 ? <p>Create a competition first.</p> : (
            <form className="form-stack" onSubmit={createSeason}>
              <label>Competition<select value={form.competition_id} onChange={(e) => setForm({ ...form, competition_id: e.target.value })} required>{competitions.map((c) => <option value={c.id} key={c.id}>{c.name}{c.is_active ? "" : " (inactive)"}</option>)}</select></label>
              <label>Season name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 2026 Season" required /></label>
              <label>Year<input type="number" min="1900" max="2200" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2026" /></label>
              <label>Start date<input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></label>
              <label>End date<input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></label>
              <button className="button primary" disabled={saving}>{saving ? "Creating..." : "Create season"}</button>
            </form>
          )}
          {notice && <div className="success-box">{notice}</div>}
          {error && <div className="error-box">{error}</div>}
        </div>
      </section>

      <section className="container section">
        <div className="section-heading"><h2>Registered seasons</h2><span>{items.length} total</span></div>
        {loading ? <p>Loading seasons…</p> : items.length === 0 ? <div className="panel"><p>No seasons yet.</p></div> : (
          <div className="module-grid">{items.map((item) => (
            <article className="module" key={item.id}>
              <strong>{item.name}</strong>
              <small>{competitionName(item.competition_id)}</small>
              <small>{item.year ?? "Year not set"} · {item.start_date ?? "Start not set"} → {item.end_date ?? "End not set"}</small>
              <small>{item.is_active ? "Active" : "Inactive"}</small>
              <div className="button-row">
                <button className="button" onClick={() => editSeason(item)}>Edit</button>
                <button className="button" onClick={() => toggleActive(item)}>{item.is_active ? "Deactivate" : "Activate"}</button>
                <button className="button danger" onClick={() => remove(item)} disabled={!item.is_active}>{item.is_active ? "Archive" : "Archived"}</button>
              </div>
            </article>
          ))}</div>
        )}
      </section>
    </main>
  );
}
