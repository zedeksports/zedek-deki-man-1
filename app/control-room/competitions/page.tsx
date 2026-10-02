"use client";

import { FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";

type Competition = {
  id: string;
  name: string;
  code: string | null;
  format: "league" | "group" | "h2h" | "knockout" | "two_leg";
  location: string | null;
  is_active: boolean;
};

const formats = [
  ["league", "League"],
  ["group", "Group"],
  ["h2h", "Head-to-head"],
  ["knockout", "Knockout"],
  ["two_leg", "Two-leg"]
] as const;

export default function CompetitionsPage() {
  const [items, setItems] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ name: "", code: "", format: "league" as Competition["format"], location: "" });

  async function load() {
    setLoading(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.from("competitions").select("*").order("name");
    if (error) setError(error.message);
    else setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createCompetition(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("competitions").insert({
      name: form.name.trim(),
      code: form.code.trim() || null,
      format: form.format,
      location: form.location.trim() || null
    });

    if (error) setError(error.message);
    else {
      setForm({ name: "", code: "", format: "league", location: "" });
      setNotice("Competition created.");
      await load();
    }
    setSaving(false);
  }

  async function toggleActive(item: Competition) {
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("competitions").update({ is_active: !item.is_active }).eq("id", item.id);
    if (error) setError(error.message);
    else await load();
  }

  async function remove(item: Competition) {
    if (!window.confirm(`Archive “${item.name}”? It will remain available for historical records.`)) return;
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("competitions").update({ is_active: false }).eq("id", item.id);
    if (error) setError(error.message);
    else { setNotice("Competition archived."); await load(); }
  }

  return (
    <main className="page">
      <header className="site-header"><div className="container nav"><a className="brand" href="/control-room">ZEDEK <span>SPORTS</span></a><nav className="nav-links"><a href="/control-room">Control Room</a></nav></div></header>
      <section className="container page-header"><div className="eyebrow">Competition Management</div><h1>Competitions</h1><p>Create and manage the competitions that anchor every football season.</p></section>

      <section className="container section">
        <div className="panel">
          <h2>Create competition</h2>
          <form className="form-stack" onSubmit={createCompetition}>
            <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. DAMANKO COMMUNITY CUP" required /></label>
            <label>Code<input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Optional short code" /></label>
            <label>Format<select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value as Competition["format"] })}>{formats.map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>Location<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Damanko, Oti Region" /></label>
            <button className="button primary" disabled={saving}>{saving ? "Creating..." : "Create competition"}</button>
          </form>
          {notice && <div className="success-box">{notice}</div>}
          {error && <div className="error-box">{error}</div>}
        </div>
      </section>

      <section className="container section">
        <div className="section-heading"><h2>Registered competitions</h2><span>{items.length} total</span></div>
        {loading ? <p>Loading competitions…</p> : items.length === 0 ? <div className="panel"><p>No competitions yet.</p></div> : (
          <div className="module-grid">
            {items.map((item) => (
              <article className="module" key={item.id}>
                <strong>{item.name}</strong>
                <small>{item.code || "No code"} · {item.format} · {item.location || "Location not set"}</small>
                <small>{item.is_active ? "Active" : "Inactive"}</small>
                <div className="button-row">
                  <button className="button" onClick={() => toggleActive(item)}>{item.is_active ? "Deactivate" : "Activate"}</button>
                  <button className="button danger" onClick={() => remove(item)} disabled={!item.is_active}>{item.is_active ? "Archive" : "Archived"}</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
