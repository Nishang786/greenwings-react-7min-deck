import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { slides, totalDuration } from "./slides.js";
import "./styles.css";

const fmt = (seconds) => {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = String(Math.floor(safe / 60));
  const secs = String(safe % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
};

const indexFromHash = () => {
  const value = Number.parseInt(window.location.hash.replace("#", ""), 10);
  return Number.isFinite(value) ? Math.max(0, Math.min(slides.length - 1, value - 1)) : 0;
};

function useTimer(active) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    const startedAt = performance.now() - elapsed * 1000;
    const frame = { id: 0 };
    const tick = () => {
      setElapsed(Math.min(totalDuration, (performance.now() - startedAt) / 1000));
      frame.id = requestAnimationFrame(tick);
    };
    frame.id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.id);
  }, [active]);

  return [elapsed, setElapsed];
}

function App() {
  const [index, setIndex] = useState(indexFromHash);
  const [notesOpen, setNotesOpen] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [elapsed, setElapsed] = useTimer(timerActive);
  const current = slides[index];

  const timedIndex = useMemo(() => {
    const found = slides.findIndex((slide) => elapsed >= slide.start && elapsed < slide.end);
    return found === -1 ? slides.length - 1 : found;
  }, [elapsed]);

  useEffect(() => {
    if (timerActive && timedIndex !== index) setIndex(timedIndex);
  }, [timerActive, timedIndex, index]);

  const go = (next) => {
    setIndex((value) => Math.max(0, Math.min(slides.length - 1, value + next)));
  };

  useEffect(() => {
    const nextHash = `#${index + 1}`;
    if (window.location.hash !== nextHash) window.history.replaceState(null, "", nextHash);
  }, [index]);

  useEffect(() => {
    const onHash = () => setIndex(indexFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") go(1);
      if (event.key === "ArrowLeft" || event.key === "PageUp") go(-1);
      if (event.key.toLowerCase() === "n") setNotesOpen((value) => !value);
      if (event.key.toLowerCase() === "t") setTimerActive((value) => !value);
      if (event.key.toLowerCase() === "r") setElapsed(0);
      if (event.key.toLowerCase() === "f") document.documentElement.requestFullscreen?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setElapsed]);

  return (
    <main className="deck-shell">
      <section className="deck-frame" aria-live="polite" style={{ "--accent": current.color }}>
        <Progress index={index} elapsed={elapsed} />
        <Slide slide={current} index={index} key={current.id} />
        <Hud
          index={index}
          elapsed={elapsed}
          timerActive={timerActive}
          onPrev={() => go(-1)}
          onNext={() => go(1)}
          onTimer={() => setTimerActive((value) => !value)}
          onNotes={() => setNotesOpen((value) => !value)}
          onReset={() => setElapsed(0)}
        />
        {notesOpen && <Notes slide={current} />}
      </section>
    </main>
  );
}

function Progress({ index, elapsed }) {
  return (
    <div className="progress-wrap" aria-hidden="true">
      <div className="timer-line" style={{ width: `${(elapsed / totalDuration) * 100}%` }} />
      <div className="segment-row">
        {slides.map((slide, itemIndex) => (
          <span
            key={slide.id}
            className={`segment ${itemIndex <= index ? "active" : ""}`}
            style={{ flexGrow: slide.end - slide.start, backgroundColor: itemIndex <= index ? slide.color : undefined }}
          />
        ))}
      </div>
    </div>
  );
}

function Slide({ slide, index }) {
  const hasCustomHeader = slide.layout === "cover" || slide.layout === "closing";
  return (
    <article className={`slide slide-${slide.layout}`} style={{ "--accent": slide.color }}>
      <RouteBackdrop />
      {!hasCustomHeader && <SlideHeader slide={slide} index={index} />}
      <SlideBody slide={slide} index={index} />
    </article>
  );
}

function SlideHeader({ slide, index }) {
  return (
    <header className="slide-header">
      <div className="section-label">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <b>{slide.section}</b>
      </div>
      <h1>{slide.title}</h1>
    </header>
  );
}

function SlideBody({ slide, index }) {
  const layouts = {
    cover: Cover,
    problem: Problem,
    impactStack: ImpactStack,
    journey: Journey,
    orchestrator: Orchestrator,
    workflow: Workflow,
    architecture: Architecture,
    metricsDashboard: MetricsDashboard,
    riskControls: RiskControls,
    agentWorkflow: AgentWorkflow,
    governance: Governance,
    decisionBrief: DecisionBrief,
    positioning: Positioning,
    timeline: Timeline,
    closing: Closing,
  };
  const Component = layouts[slide.layout] || Closing;
  return <Component slide={slide} index={index} />;
}

function RouteBackdrop() {
  return (
    <svg className="route-backdrop" viewBox="0 0 1600 900" aria-hidden="true">
      <defs>
        <linearGradient id="routeStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="0.52" stopColor="var(--accent)" stopOpacity="0.42" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="ambient-path p1" d="M-40 650 C260 520 430 460 690 500 S1180 640 1660 330" />
      <path className="ambient-path p2" d="M60 220 C360 140 620 180 830 310 S1220 520 1560 150" />
      <path className="ambient-path p3" d="M180 840 C480 660 760 610 1050 670 S1370 650 1640 560" />
      <circle className="radar-ring r1" cx="1230" cy="210" r="74" />
      <circle className="radar-ring r2" cx="1240" cy="212" r="128" />
    </svg>
  );
}

function FlightMap({ compact = false }) {
  const nodes = [
    { x: 28, y: 66, label: "LHR" },
    { x: 42, y: 51, label: "CDG" },
    { x: 54, y: 43, label: "FRA" },
    { x: 65, y: 58, label: "MXP" },
    { x: 76, y: 34, label: "WAW" },
    { x: 60, y: 73, label: "MAD" },
  ];
  return (
    <div className={`flight-map ${compact ? "compact" : ""}`}>
      <svg viewBox="0 0 100 100" role="img" aria-label="European route network visual">
        <path className="altitude-band" d="M5 72 C22 56 40 52 55 60 S79 74 96 54" />
        <path className="altitude-band b2" d="M7 36 C27 21 45 20 61 34 S80 53 98 27" />
        <path className="route-arc" d="M28 66 C38 42 50 35 76 34" />
        <path className="route-arc delay-1" d="M42 51 C50 39 58 40 65 58" />
        <path className="route-arc delay-2" d="M60 73 C48 57 48 49 54 43" />
        <path className="route-arc delay-3" d="M28 66 C37 55 48 51 65 58" />
        {nodes.map((node) => (
          <g key={node.label}>
            <circle className="map-node" cx={node.x} cy={node.y} r="1.7" />
            {!compact && <text x={node.x + 2.5} y={node.y - 1.8}>{node.label}</text>}
          </g>
        ))}
      </svg>
    </div>
  );
}

function Cover({ slide }) {
  return (
    <div className="cover-layout">
      <div className="cover-copy">
        <div className="section-label cover-label">
          <span>01</span>
          <b>{slide.eyebrow}</b>
        </div>
        <h1>{slide.title}</h1>
        <p className="subtitle">{slide.subtitle}</p>
        <p className="cover-statement">{slide.statement}</p>
      </div>
      <div className="cover-visual">
        <FlightMap />
        <span className="aircraft-mark" />
      </div>
    </div>
  );
}

function Problem({ slide }) {
  return (
    <div className="problem-layout">
      <div className="problem-statement">
        <p>{slide.statement}</p>
        <span>Fragmented tools. Fragmented action.</span>
      </div>
      <div className="fragment-system">
        {slide.fragments.map((item, itemIndex) => (
          <div className="fragment-card" key={item} style={{ "--i": itemIndex }}>
            <span>0{itemIndex + 1}</span>
            <b>{item}</b>
          </div>
        ))}
        <div className="gap-node">{slide.gap}</div>
      </div>
    </div>
  );
}

function ImpactStack({ slide }) {
  const max = Math.max(...slide.layers.map((layer) => layer.value));
  return (
    <div className="impact-stack-layout">
      <div className="atmosphere-stack">
        {slide.layers.map((layer) => (
          <div className={`impact-layer tone-${layer.tone}`} key={layer.label} style={{ "--w": `${(layer.value / max) * 100}%` }}>
            <span>{layer.label}</span>
            <b>{layer.value}</b>
          </div>
        ))}
      </div>
      <div className="radial-impact">
        <div className="confidence-ring">
          <span>{slide.callout}</span>
        </div>
        <p>{slide.statement}</p>
      </div>
    </div>
  );
}

function Journey({ slide }) {
  return (
    <div className="journey-layout">
      <div className="journey-line">
        {slide.stages.map((stage, index) => (
          <div className={`journey-stage ${stage.status}`} key={stage.label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{stage.label}</h2>
            <p>{stage.capability}</p>
          </div>
        ))}
      </div>
      <div className="decision-question">{slide.question}</div>
    </div>
  );
}

function Orchestrator({ slide }) {
  return (
    <div className="orchestrator-layout">
      <div className="input-column">
        {slide.inputs.map((input) => <SystemPill key={input}>{input}</SystemPill>)}
      </div>
      <div className="orchestrator-node">
        <span>central layer</span>
        <strong>{slide.center}</strong>
      </div>
      <div className="output-column">
        {slide.outputs.map((output) => <SystemPill key={output}>{output}</SystemPill>)}
      </div>
    </div>
  );
}

function SystemPill({ children }) {
  return <div className="system-pill">{children}</div>;
}

function Workflow({ slide }) {
  return (
    <div className="workflow-track">
      {slide.steps.map((step, index) => (
        <div className="workflow-step" key={step}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <p>{step}</p>
        </div>
      ))}
    </div>
  );
}

function Architecture({ slide }) {
  return (
    <div className="architecture-board">
      <div className="arch-layer top">
        {slide.top.map((item) => <SystemPill key={item}>{item}</SystemPill>)}
      </div>
      <div className="arch-orchestrator">GreenWings AI Orchestrator</div>
      <div className="arch-tools">
        {slide.tools.map((tool) => <div key={tool}>{tool}</div>)}
      </div>
      <div className="arch-data">
        {slide.data.map((item) => <span key={item}>{item}</span>)}
      </div>
      <aside className="human-rail">
        <b>{slide.side}</b>
      </aside>
      <p className="architecture-principle">{slide.principle}</p>
    </div>
  );
}

function MetricsDashboard({ slide }) {
  return (
    <div className="metrics-dashboard">
      <div className="network-panel">
        <FlightMap compact />
        <span className="scope-badge">{slide.badge}</span>
      </div>
      <div className="metric-grid">
        {slide.metrics.map((metric) => (
          <div className="metric-tile" key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskControls({ slide }) {
  return (
    <div className="risk-control-layout">
      <Panel title="Risks" tone="risk" items={slide.risks} />
      <Panel title="GreenWings controls" tone="control" items={slide.controls} />
    </div>
  );
}

function Panel({ title, tone, items }) {
  return (
    <section className={`list-panel ${tone}`}>
      <h2>{title}</h2>
      <div>
        {items.map((item) => <p key={item}>{item}</p>)}
      </div>
    </section>
  );
}

function AgentWorkflow({ slide }) {
  return (
    <div className="agent-layout">
      <div className="request-card">
        <span>User request</span>
        <p>"{slide.request}"</p>
      </div>
      <div className="call-sequence">
        {slide.calls.map((call, index) => (
          <div className="call-step" key={call}>
            <span>{index + 1}</span>
            <p>{call}</p>
          </div>
        ))}
      </div>
      <div className="safeguard-gate">{slide.gate}</div>
    </div>
  );
}

function Governance({ slide }) {
  return (
    <div className="governance-layout">
      <div className="governance-hub">
        <div className="shield">Governed AI</div>
      </div>
      <div className="governance-cards">
        {slide.controls.map((control) => (
          <section key={control.title}>
            <h2>{control.title}</h2>
            <p>{control.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function DecisionBrief({ slide }) {
  return (
    <div className="brief-ui">
      <div className="brief-top">
        {slide.summary.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
      <div className="brief-table">
        <div className="brief-row header">
          <span>Option</span>
          <span>Benefit</span>
          <span>Cost</span>
          <span>Feasibility</span>
          <span>Confidence</span>
        </div>
        {slide.options.map((option) => (
          <div className="brief-row" key={option.action}>
            <strong>{option.action}</strong>
            <span>{option.benefit}</span>
            <span>{option.cost}</span>
            <span>{option.feasibility}</span>
            <span>{option.confidence}</span>
          </div>
        ))}
      </div>
      <div className="approval-bar">Status: {slide.status}</div>
    </div>
  );
}

function Positioning({ slide }) {
  return (
    <div className="positioning-layout">
      <div className="market-stack">
        {slide.tools.map((tool) => <SystemPill key={tool}>{tool}</SystemPill>)}
      </div>
      <div className="positioning-arrow">
        <span>{slide.line}</span>
        <b>{slide.greenwings}</b>
      </div>
    </div>
  );
}

function Timeline({ slide }) {
  return (
    <div className="timeline-layout">
      <div className="timeline-track">
        {slide.events.map((event, index) => (
          <div className="timeline-event" key={event}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{event}</p>
          </div>
        ))}
      </div>
      <div className="timeline-close">{slide.close}</div>
    </div>
  );
}

function Closing({ slide }) {
  return (
    <div className="closing-layout">
      <div>
        <div className="section-label">
          <span>15</span>
          <b>{slide.section}</b>
        </div>
        <h1>{slide.title}</h1>
        <p>{slide.subline}</p>
      </div>
      <svg className="exit-path" viewBox="0 0 700 240" aria-hidden="true">
        <path d="M20 190 C180 70 330 90 460 120 S600 170 680 40" />
        <circle cx="680" cy="40" r="6" />
      </svg>
    </div>
  );
}

function Hud({ index, elapsed, timerActive, onPrev, onNext, onTimer, onNotes, onReset }) {
  return (
    <nav className="hud">
      <button type="button" onClick={onPrev} title="Previous slide" aria-label="Previous slide">&lt;</button>
      <div className="timer-readout">
        <strong>{fmt(elapsed)}</strong>
        <span>{index + 1}/{slides.length} / {fmt(totalDuration)}</span>
      </div>
      <button type="button" onClick={onTimer} title="Toggle timer" aria-label="Toggle timer">{timerActive ? "II" : ">"}</button>
      <button type="button" onClick={onReset} title="Reset timer" aria-label="Reset timer">R</button>
      <button type="button" onClick={onNotes} title="Speaker notes" aria-label="Speaker notes">N</button>
      <button type="button" onClick={onNext} title="Next slide" aria-label="Next slide">&gt;</button>
    </nav>
  );
}

function Notes({ slide }) {
  return (
    <aside className="notes-panel">
      <div>
        <span>{slide.section}</span>
        <strong>{fmt(slide.start)}-{fmt(slide.end)}</strong>
      </div>
      <p>{slide.notes}</p>
    </aside>
  );
}

createRoot(document.getElementById("root")).render(<App />);
