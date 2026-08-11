"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, BadgeDollarSign, Camera, Check, ChevronRight, Clock3, ExternalLink, FileImage, History, Info, Pencil, Plus, RotateCcw, ScanLine, Settings, ShieldAlert, Sparkles, Trash2, TrendingUp, Upload, X } from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { calculateDeal } from "../lib/dealCalculator";
import { makeId } from "../lib/id";
import { cardRecognitionService, createManualCard } from "../services/cardRecognitionService";
import { compService } from "../services/compService";
import { marketplaceService } from "../services/marketplaceService";
import type { AppSettings, CompResult, DetectedCard, SavedAnalysis } from "../types";

const DEFAULTS: AppSettings = { marketplace: "eBay", desiredRoi: 30, ebayFeePercent: 13.25, perOrderFee: .30, shippingCost: 4.25, suppliesCost: .35, conservativeDiscount: 12, defaultCondition: "Near Mint or Better", currency: "USD" };
type View = "scan" | "history" | "settings";
const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

function Confidence({ value }: { value: number }) {
  const low = value < .8;
  return <span className={`confidence ${low ? "low" : ""}`}>{Math.round(value * 100)}% confidence</span>;
}

function Score({ card, comp }: { card: DetectedCard; comp?: CompResult }) {
  let points = comp ? Math.min(4, comp.sampleSize / 2) : 0;
  if (card.rookie) points += 2; if (card.autograph || card.serialNumber) points += 2; if (card.confidence > .85) points += 1;
  return <span className="liquidity">Liquidity {points >= 8 ? "A" : points >= 6 ? "B" : points >= 4 ? "C" : points >= 2 ? "D" : "F"} <Info size={12} /></span>;
}

function EditModal({ card, onSave, onClose }: { card: DetectedCard; onSave: (c: DetectedCard) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(card);
  const field = (key: keyof DetectedCard, label: string, type = "text") => (
    <label><span>{label}</span><input type={type} value={String(draft[key] ?? "")} onChange={e => setDraft({ ...draft, [key]: type === "number" ? Number(e.target.value) : e.target.value })} /></label>
  );
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="modal">
      <div className="modal-head"><div><p className="eyebrow">Verify identification</p><h2>Edit card details</h2></div><button className="icon-btn" onClick={onClose}><X /></button></div>
      <div className="form-grid">{field("player", "Player")}{field("sport", "Sport")}{field("year", "Year", "number")}{field("manufacturer", "Brand")}{field("set", "Set")}{field("cardNumber", "Card number")}{field("parallel", "Parallel / color")}{field("serialNumber", "Serial number")}{field("gradingCompany", "Grading company")}{field("grade", "Grade")}</div>
      <div className="checks">
        {([["rookie", "Rookie"], ["autograph", "Autograph"], ["memorabilia", "Patch / relic"]] as const).map(([k, l]) => <label key={k}><input type="checkbox" checked={draft[k]} onChange={e => setDraft({ ...draft, [k]: e.target.checked })} />{l}</label>)}
      </div>
      <button className="upload-back"><FileImage /> Upload card back <span>Coming with live AI</span></button>
      <div className="modal-actions"><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => onSave({ ...draft, searchQuery: [draft.year, draft.manufacturer, draft.set, draft.player, draft.cardNumber, draft.parallel, draft.serialNumber].filter(Boolean).join(" ") })}><Check /> Save changes</button></div>
    </section>
  </div>;
}

export default function CardScoutApp() {
  const [view, setView] = useState<View>("scan");
  const [settings, setSettings] = useLocalStorage<AppSettings>("cardscout-settings", DEFAULTS);
  const [history, setHistory] = useLocalStorage<SavedAnalysis[]>("cardscout-history", []);
  const [cards, setCards] = useState<DetectedCard[]>([]);
  const [comps, setComps] = useState<CompResult[]>([]);
  const [asking, setAsking] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<DetectedCard | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const deal = useMemo(() => comps.length ? calculateDeal(comps, Number(asking) || 0, settings) : null, [comps, asking, settings]);

  async function analyze(file?: File) {
    if (!file) return;
    setError(""); setLoading(true); setCards([]); setComps([]); setAsking("");
    setImage(URL.createObjectURL(file));
    try {
      const result = await cardRecognitionService.analyze(file);
      setCards(result.cards);
      setComps(await Promise.all(result.cards.map(c => compService.getComps(c))));
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      setError(code === "UNSUPPORTED_FILE" ? "That file is not an image. Try JPG, PNG, HEIC, or WebP." : code === "LARGE_IMAGE" ? "That image is over 12 MB. Use a smaller photo or screenshot." : "We couldn't read that image. Try a sharper, well-lit photo.");
    } finally { setLoading(false); }
  }
  async function addManual() {
    const c = createManualCard(); setCards(v => [...v, c]); setEditing(c); setError("");
  }
  async function saveCard(updated: DetectedCard) {
    setCards(v => v.map(c => c.id === updated.id ? updated : c));
    const result = await compService.getComps(updated);
    setComps(v => [...v.filter(c => c.cardId !== updated.id), result]);
    setEditing(null);
  }
  function saveAnalysis() {
    if (!deal || !asking) return;
    const saved: SavedAnalysis = { id: makeId(), date: new Date().toISOString(), cards, comps, askingPrice: Number(asking), deal };
    setHistory([saved, ...history]); setError(""); 
  }
  function reset() { setCards([]); setComps([]); setAsking(""); setImage(null); setError(""); }
  function openSaved(saved: SavedAnalysis) { setCards(saved.cards); setComps(saved.comps); setAsking(String(saved.askingPrice)); setImage(null); setView("scan"); }

  return <div className="app-shell">
    <header>
      <button className="brand" onClick={() => setView("scan")}><span><ScanLine /></span>CardScout</button>
      <nav>
        <button className={view === "scan" ? "active" : ""} onClick={() => setView("scan")}><ScanLine /> <span>Scan</span></button>
        <button className={view === "history" ? "active" : ""} onClick={() => setView("history")}><History /> <span>History</span></button>
        <button className={view === "settings" ? "active" : ""} onClick={() => setView("settings")}><Settings /> <span>Settings</span></button>
      </nav>
    </header>

    {view === "scan" && <main>
      {!cards.length && !loading && <section className="hero">
        <div className="hero-copy"><p className="eyebrow"><Sparkles /> YOUR POCKET DEAL DESK</p><h1>Know the deal<br /><em>before you buy.</em></h1><p>Scan sports cards. See rough comps. Calculate your real profit—before the auction clock hits zero.</p></div>
        <div className="scanner-card" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); analyze(e.dataTransfer.files[0]); }}>
          <div className="scan-art"><div className="card-silhouette"><span>CS</span></div><div className="scan-line" /></div>
          <h2>Drop a card photo here</h2><p>One card or a whole lot. Clear, well-lit images work best.</p>
          <div className="cta-row"><button className="btn primary large" onClick={() => cameraRef.current?.click()}><Camera /> Scan Cards</button><button className="btn secondary large" onClick={() => fileRef.current?.click()}><Upload /> Upload Screenshot</button></div>
          <button className="manual-link" onClick={addManual}><Plus /> Enter a card manually</button>
          <input ref={fileRef} hidden type="file" accept="image/*" onChange={e => analyze(e.target.files?.[0])} />
          <input ref={cameraRef} hidden type="file" accept="image/*" capture="environment" onChange={e => analyze(e.target.files?.[0])} />
          <div className="privacy"><ShieldAlert /> Images stay in demo mode on your device</div>
        </div>
        <div className="trust-row"><span><Check /> Sold-price focused</span><span><Check /> Fee-aware math</span><span><Check /> Visible uncertainty</span></div>
      </section>}

      {loading && <section className="loading-state"><div className="radar"><ScanLine /></div><h2>Analyzing cards…</h2><p>Reading players, sets, parallels, serial numbers, and grades.</p><div className="progress"><i /></div></section>}
      {error && <div className="error"><ShieldAlert /><div><strong>Scan issue</strong><p>{error}</p></div><button onClick={() => setError("")}><X /></button></div>}

      {!!cards.length && !loading && <section className="results">
        <div className="results-top">
          <div><button className="back-link" onClick={reset}><ArrowLeft /> New scan</button><p className="eyebrow">ANALYSIS COMPLETE</p><h1>{cards.length} {cards.length === 1 ? "card" : "cards"} detected</h1><p>Review the IDs, then enter the seller's price.</p></div>
          {image && <img className="thumb" src={image} alt="Uploaded cards" />}
        </div>

        {deal && <section className={`verdict-card ${deal.verdict.toLowerCase()}`}>
          <div className="verdict-main"><span className="verdict">{deal.verdict}</span><div><small>Expected profit</small><strong>{deal.expectedProfit >= 0 ? "+" : ""}{usd(deal.expectedProfit)}</strong></div></div>
          <div className="hero-metrics"><div><span>ROI</span><b>{asking ? `${deal.roi >= 0 ? "+" : ""}${deal.roi.toFixed(1)}%` : "—"}</b></div><div><span>Max buy</span><b>{usd(deal.maxBuyPrice)}</b></div><div><span>Expected net</span><b>{usd(deal.netProceeds)}</b></div></div>
          {!asking && <p className="price-prompt"><Info /> Enter the seller's asking price below to unlock your deal verdict.</p>}
        </section>}

        <div className="content-grid">
          <div className="cards-column">
            <div className="section-head"><div><h2>Detected cards</h2><p>CardScout estimates—verify uncertain parallels.</p></div><button className="btn compact secondary" onClick={addManual}><Plus /> Add card</button></div>
            {cards.map((card, index) => {
              const comp = comps.find(c => c.cardId === card.id);
              return <article className="detected-card" key={card.id}>
                <div className="card-index">{String(index + 1).padStart(2, "0")}</div>
                <div className="card-info">
                  <div className="card-title"><div><h3>{card.player || "Unnamed card"}</h3><p>{card.year} {card.manufacturer} {card.set} {card.cardNumber && `#${card.cardNumber}`}</p></div><button className="edit-btn" onClick={() => setEditing(card)}><Pencil /> Edit</button></div>
                  <div className="badges">{card.rookie && <span className="badge rc">RC</span>}{card.autograph && <span className="badge auto">AUTO</span>}{card.memorabilia && <span className="badge">PATCH</span>}{card.parallel && <span>{card.parallel}</span>}{card.serialNumber && <span>{card.serialNumber}</span>}</div>
                  {card.confidence < .8 && <div className="warning"><ShieldAlert /><span><b>Exact parallel is uncertain.</b> Upload the back before relying on this comp.</span></div>}
                  <div className="card-meta"><Confidence value={card.confidence} /><Score card={card} comp={comp} /><a href={marketplaceService.buildSearchUrl(card.searchQuery)} target="_blank" rel="noreferrer">Sold search <ExternalLink /></a></div>
                </div>
                <div className="comp-box"><span>ROUGH COMP</span><strong>{comp ? `${usd(comp.lowPrice)}–${usd(comp.highPrice)}` : "No comps"}</strong><small>{comp ? `Based on ${comp.sampleSize} demo sales` : "Edit details to retry"}</small><hr /><span>CONSERVATIVE</span><b>{comp ? usd(comp.conservativeValue) : "—"}</b></div>
              </article>;
            })}
            {cards.length > 1 && <section className="lot-groups"><h2>Lot breakdown</h2><div className="group-grid">
              <div><TrendingUp /><span><b>Best cards</b><small>{[...cards].sort((a,b) => (comps.find(c=>c.cardId===b.id)?.medianPrice||0)-(comps.find(c=>c.cardId===a.id)?.medianPrice||0)).slice(0,3).map(c=>c.player).join(", ")}</small></span></div>
              <div><BadgeDollarSign /><span><b>Bulk / low value</b><small>{comps.filter(c=>c.medianPrice<8).length} card(s) under $8</small></span></div>
              <div><Check /><span><b>Highest confidence</b><small>{cards.filter(c=>c.confidence>=.85).length} strong identification(s)</small></span></div>
              <div><ShieldAlert /><span><b>Needs verification</b><small>{cards.filter(c=>c.confidence<.8).length} uncertain card(s)</small></span></div>
            </div></section>}
          </div>

          <aside className="deal-panel">
            <div className="sticky"><p className="eyebrow">DEAL CALCULATOR</p><h2>{cards.length > 1 ? "Lot economics" : "Card economics"}</h2>
              <label className="asking"><span>{cards.length > 1 ? "Seller asking for entire lot" : "Seller asking price"}</span><div><b>$</b><input inputMode="decimal" value={asking} placeholder="0.00" onChange={e => setAsking(e.target.value.replace(/[^0-9.]/g, ""))} /></div></label>
              {deal && <div className="economics">
                <div><span>Estimated market value</span><b>{usd(deal.marketValue)}</b></div><div><span>Conservative resale</span><b>{usd(deal.conservativeValue)}</b></div>
                <hr /><div className="minus"><span>Estimated selling fees</span><b>-{usd(deal.sellingFees)}</b></div><div className="minus"><span>Shipping</span><b>-{usd(deal.shipping)}</b></div><div className="minus"><span>Supplies</span><b>-{usd(deal.supplies)}</b></div>
                <hr /><div className="net"><span>Expected net</span><b>{usd(deal.netProceeds)}</b></div>{asking && <><div className="minus"><span>Seller asking</span><b>-{usd(Number(asking))}</b></div><div className="profit"><span>Expected profit</span><b>{deal.expectedProfit >= 0 ? "+" : ""}{usd(deal.expectedProfit)}</b></div></>}
              </div>}
              {deal && <div className="offer-guide"><div><span>Ideal offer</span><b>{usd(deal.idealBuyPrice)}</b></div><div><span>Good buy</span><b>≤ {usd(deal.maxBuyPrice * .92)}</b></div><div><span>Absolute max</span><b>{usd(deal.maxBuyPrice)}</b></div><p>Above {usd(deal.maxBuyPrice)}: <strong>PASS</strong></p></div>}
              <p className="assumption"><Info /> Editable assumptions: {settings.ebayFeePercent}% fee, {settings.desiredRoi}% target ROI. No fee is universally correct.</p>
              <button className="btn primary full" disabled={!asking} onClick={saveAnalysis}><Clock3 /> Save to history</button>
            </div>
          </aside>
        </div>
        <div className="sold-note"><Info /><span><b>How pricing works</b> CardScout prioritizes sold-price data when available. Active listings are secondary evidence. Demo mode uses realistic simulated sales and never claims live data.</span></div>
      </section>}
    </main>}

    {view === "history" && <main className="page"><div className="page-title"><p className="eyebrow">YOUR DEAL LOG</p><h1>Analysis history</h1><p>Saved on this device. Reopen any scan to revisit the numbers.</p></div>
      {!history.length ? <div className="empty"><History /><h2>No saved deals yet</h2><p>Run a scan, enter an asking price, and save your first analysis.</p><button className="btn primary" onClick={() => setView("scan")}><ScanLine /> Scan cards</button></div> :
      <div className="history-list">{history.map(item => <article key={item.id}><div className={`mini-verdict ${item.deal.verdict.toLowerCase()}`}>{item.deal.verdict}</div><div className="history-info"><b>{item.cards.length} {item.cards.length === 1 ? "card" : "card lot"}</b><span>{new Date(item.date).toLocaleString()}</span><small>{item.cards.slice(0,3).map(c=>c.player).join(", ")}{item.cards.length>3?"…":""}</small></div><div className="history-number"><span>Asking</span><b>{usd(item.askingPrice)}</b></div><div className="history-number"><span>Expected profit</span><b className={item.deal.expectedProfit>=0?"positive":""}>{item.deal.expectedProfit>=0?"+":""}{usd(item.deal.expectedProfit)}</b></div><button className="icon-btn" onClick={() => openSaved(item)}><ChevronRight /></button><button className="icon-btn danger" onClick={() => setHistory(history.filter(h=>h.id!==item.id))}><Trash2 /></button></article>)}</div>}
    </main>}

    {view === "settings" && <main className="page"><div className="page-title"><p className="eyebrow">YOUR ASSUMPTIONS</p><h1>Deal settings</h1><p>Tune CardScout to your actual selling costs and profit goals.</p></div>
      <section className="settings-card"><div className="settings-note"><Info /><span><b>These are editable examples—not universal fees.</b> Check your own marketplace category, account, and shipping costs.</span></div>
        <div className="settings-grid">
          {([["marketplace","Default marketplace","text"],["desiredRoi","Desired minimum ROI (%)","number"],["ebayFeePercent","Marketplace fee (%)","number"],["perOrderFee","Per-order fee ($)","number"],["shippingCost","Default shipping ($)","number"],["suppliesCost","Supplies cost ($)","number"],["conservativeDiscount","Conservative discount (%)","number"],["defaultCondition","Default condition","text"],["currency","Currency","text"]] as const).map(([key,label,type])=><label key={key}><span>{label}</span><input type={type} step=".01" value={settings[key]} onChange={e=>setSettings({...settings,[key]:type==="number"?Number(e.target.value):e.target.value})}/></label>)}
        </div><div className="settings-actions"><button className="btn ghost" onClick={()=>setSettings(DEFAULTS)}><RotateCcw /> Restore examples</button><span><Check /> Changes save automatically</span></div>
      </section>
    </main>}
    {editing && <EditModal card={editing} onSave={saveCard} onClose={() => setEditing(null)} />}
    <footer><span><ScanLine /> CardScout</span><p>Rough comps, honest uncertainty, smarter buys.</p><small>Demo mode • Not financial advice</small></footer>
  </div>;
}
