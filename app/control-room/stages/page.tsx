"use client";

import { FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";

type Season = { id: string; competition_id: string; name: string; year: number | null; is_active: boolean };
type Stage = { id: string; season_id: string; name: string; stage_type: StageType; stage_order: number; is_active: boolean };
type StageType = "league" | "group" | "knockout" | "quarter_final" | "semi_final" | "final";

const stageTypes: Array<[StageType, string]> = [
  ["league", "League"], ["group", "Group"], ["knockout", "Knockout"],
  ["quarter_final", "Quarter-final"], ["semi_final", "Semi-final"], ["final", "Final"]
];

export default function StagesPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [items, setItems] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ season_id: "", name: "", stage_type: "league" as StageType, stage_order: "1" });

  async function load() {
    setLoading(true); setError("");
    const supabase = createSupabaseBrowserClient();
    const [{ data: seasonsData, error: seasonsError }, { data: stagesData, error: stagesError }] = await Promise.all([
      supabase.from("seasons").select("id,competition_id,name,year,is_active").order("year", { ascending: false, nullsFirst: false }).order("name"),
      supabase.from("stages").select("id,season_id,name,stage_type,stage_order,is_active").order("stage_order").order("name")
    ]);
    if (seasonsError) setError(seasonsError.message); else {
      setSeasons(seasonsData ?? []);
      if (!form.season_id && seasonsData?.length) setForm(f => ({ ...f, season_id: seasonsData[0].id }));
    }
    if (stagesError) setError(stagesError.message); else setItems(stagesData ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createStage(event: FormEvent) {
    event.preventDefault();
    if (!form.season_id || !form.name.trim()) return;
    setSaving(true); setError(""); setNotice("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("stages").insert({
      season_id: form.season_id,
      name: form.name.trim(),
      stage_type: form.stage_type,
      stage_order: Number(form.stage_order) || 1
    });
    if (error) setError(error.message);
    else {
      setForm(f => ({ ...f, name: "", stage_order: String((Number(f.stage_order) || 1) + 1) }));
      setNotice("Stage created.");
      await load();
    }
    setSaving(false);
  }

  async function editStage(item: Stage) {
    const name = window.prompt("Stage name", item.name);
    if (name === null) return;
    const orderText = window.prompt("Stage order", String(item.stage_order));
    if (orderText === null) return;
    const typeText = window.prompt("Stage type: league, group, knockout, quarter_final, semi_final, final", item.stage_type);
    if (typeText === null) return;
    if (!stageTypes.some(([value]) => value === typeText)) { setError("Invalid stage type."); return; }
    const supabase = createSupabaseBrowserClient();
    setError(""); setNotice("");
    const { error } = await supabase.from("stages").update({
      name: name.trim() || item.name,
      stage_order: Number(orderText) || item.stage_order,
      stage_type: typeText as StageType
    }).eq("id", item.id);
    if (error) setError(error.message); else { setNotice("Stage updated."); await load(); }
  }

  async function toggleActive(item: Stage) {
    setError(""); setNotice("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("stages").update({ is_active: !item.is_active }).eq("id", item.id);
    if (error) setError(error.message); else { setNotice(item.is_active ? "Stage deactivated." : "Stage activated."); await load(); }
  }

  async function remove(item: Stage) {
    if (!window.confirm(`Archive “${item.name}”? It will remain available for historical records.`)) return;
    setError(""); setNotice("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("stages").update({ is_active: false }).eq("id", item.id);
    if (error) setError(error.message); else { setNotice("Stage archived."); await load(); }
  }

  const seasonName = (id: string) => {
    const season = seasons.find(s => s.id === id);
    return season ? `${season.name}${season.year ? ` (${season.year})` : ""}` : "Unknown season";
  };

  return (
    <main className="page">
      <header className="site-header"><div className="container nav"><a className="brand" href="/control-room">ZEDEK <span>SPORTS</span></a><nav className="nav-links"><a href="/control-room">Control Room</a><a href="/control-room/seasons">Seasons</a></nav></div></header>
      <section className="container page-header"><div className="eyebrow">Football Operations · Phase 2</div><h1>Stage Management</h1><p>Build the competition pathway from a season into league, group and knockout stages.</p></section>
      <section className="container section"><div className="panel"><h2>Create stage</h2>
        {seasons.length === 0 ? <p>Create a season first.</p> : <form className="form-stack" onSubmit={createStage}>
          <label>Season<select value={form.season_id} onChange={e => setForm({...form, season_id:e.target.value})} required>{seasons.map(s => <option key={s.id} value={s.id}>{seasonName(s.id)}{s.is_active ? "" : " (inactive)"}</option>)}</select></label>
          <label>Stage name<input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="e.g. Group Stage" required /></label>
          <label>Stage type<select value={form.stage_type} onChange={e => setForm({...form,stage_type:e.target.value as StageType})}>{stageTypes.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label>Stage order<input type="number" min="1" value={form.stage_order} onChange={e => setForm({...form,stage_order:e.target.value})} /></label>
          <button className="button primary" disabled={saving}>{saving ? "Creating..." : "Create stage"}</button>
        </form>}
        {notice && <div className="success-box">{notice}</div>}{error && <div className="error-box">{error}</div>}
      </div></section>
      <section className="container section"><div className="section-heading"><h2>Registered stages</h2><span>{items.length} total</span></div>
        {loading ? <p>Loading stages…</p> : items.length === 0 ? <div className="panel"><p>No stages yet.</p></div> :
        <div className="module-grid">{items.map(item => <article className="module" key={item.id}>
          <strong>{item.name}</strong><small>{seasonName(item.season_id)}</small><small>{item.stage_type} · Order {item.stage_order}</small><small>{item.is_active ? "Active" : "Inactive"}</small>
          <div className="button-row"><button className="button" onClick={() => editStage(item)}>Edit</button><button className="button" onClick={() => toggleActive(item)}>{item.is_active ? "Deactivate" : "Activate"}</button><button className="button danger" onClick={() => remove(item)}>Delete</button></div>
        </article>)}</div>}
      </section>
    </main>
  );
}
