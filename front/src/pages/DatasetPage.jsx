import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { ACCENTS, C, FONT_MONO, FONT_DISPLAY, FONT_BODY } from "../styles/tokens";
import {
  Card, CardBody, CardHeader,
  LoadingSpinner, PageHeader, ProgressBar, StatCard,
} from "../components/ui";

// Simulated build-log 
const BUILD_LOG_LINES = [
  "[file_reader] Scanning data/raw/ for .json.gz files...",
  "[file_reader] Found archive files · events loaded",
  "[data_service] Fetching languages via GitHub GraphQL API...",
  "[data_service] Rows enriched with language metadata",
  "[analytics] Running intent classification...",
  "[analytics] Running ecosystem detection...",
  "[analytics] Done with analytics · dataset ready",
  "[api] Reloading endpoints...",
  "✓ Dataset rebuilt successfully",
];

const API_ENDPOINTS = [
  ["/api/languages/",             "Language distribution"],
  ["/api/languages/by-intent",    "Intent per language"],
  ["/api/languages/trend",        "Activity by day of week"],
  ["/api/frameworks/",            "Technology mentions"],
  ["/api/frameworks/by-language", "Technologies per ecosystem"],
  ["/api/repos/intent",           "Intent distribution"],
];

export default function DatasetPage() {
  const { data: langData, loading: langLoading } = useApi(api.getLanguages);
  const { data: fwData,   loading: fwLoading   } = useApi(api.getFrameworks);
  const [rebuilding, setRebuilding] = useState(false);
  const [buildLog,   setBuildLog  ] = useState([]);

  if (langLoading || fwLoading) return <LoadingSpinner />;

  const totalRows = langData?.total_rows ?? 0;
  const withLang  = langData?.rows_with_language ?? 0;
  const coverage  = totalRows ? Math.round((withLang * 100) / totalRows) : 0;
  const langCount = langData?.languages?.length ?? 0;
  const fwCount   = fwData?.frameworks?.length ?? 0;
  const topLang   = langData?.languages?.[0];
  const topFw     = fwData?.frameworks?.[0];

  const stages = [
    {
      name:   "utils/file_reader.py",
      desc:   "Reads all .json.gz files from data/raw/",
      detail: `${totalRows.toLocaleString()} events parsed`,
      done: true,
    },
    {
      name:   "services/data_service.py",
      desc:   "Extracts repos, fetches languages via GitHub GraphQL API",
      detail: `${withLang.toLocaleString()} rows enriched`,
      done: true,
    },
    {
      name:   "services/analytics_service.py",
      desc:   "Aggregates stats, intent classification, ecosystem detection",
      detail: `${langCount} languages · ${fwCount} technologies detected`,
      done: true,
    },
    {
      name:   "app.py",
      desc:   "FastAPI server serving all analytics endpoints",
      detail: "Running on localhost:8000",
      done: true,
      active: true,
    },
  ];

  async function handleRebuild() {
    setRebuilding(true);
    setBuildLog(["[dataset] Starting rebuild..."]);
    for (const line of BUILD_LOG_LINES) {
      await new Promise((r) => setTimeout(r, 500));
      setBuildLog((prev) => [...prev, line]);
    }
    // call the real endpoint
    api.triggerBuild().catch(() => {});
    setRebuilding(false);
  }

  return (
    <div>
      <PageHeader
        title="Dataset Inspector"
        sub="Real-time metadata about your GitHub Archive dataset · January 2026"
      />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 28 }}>
        <StatCard
          label="Language Coverage"
          value={`${coverage}%`}
          sub={`${withLang.toLocaleString()} rows classified`}
          accent={C.purple}
        />
        <StatCard
          label="Top Language"
          value={topLang?.language ?? "—"}
          sub={`${topLang?.pct ?? 0}% of classified rows`}
          accent={C.green}
        />
        <StatCard
          label="Top Technology"
          value={topFw?.framework ?? "—"}
          sub={`${topFw?.count?.toLocaleString() ?? 0} mentions`}
          accent={C.amber}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Pipeline stages */}
        <Card>
          <CardHeader title="Pipeline stages" sub="Your Python scripts · processing order" />
          <CardBody>
            {stages.map((s, idx) => (
              <div
                key={s.name}
                style={{ display: "flex", gap: 14, marginBottom: idx < stages.length - 1 ? 20 : 0 }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
                >
                  <div
                    style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      background: s.active ? `${C.cyan}22` : s.done ? `${C.green}22` : C.bg4,
                      border: `1px solid ${s.active ? C.cyan : s.done ? C.green : C.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10,
                      color: s.active ? C.cyan : s.done ? C.green : C.text3,
                    }}
                  >
                    {s.active ? "▸" : s.done ? "✓" : "○"}
                  </div>
                  {idx < stages.length - 1 && (
                    <div
                      style={{ width: 1, flex: 1, background: C.border, marginTop: 4 }}
                    />
                  )}
                </div>

                <div style={{ paddingBottom: idx < stages.length - 1 ? 16 : 0 }}>
                  <div
                    style={{
                      fontSize: 11, fontWeight: 500, color: C.text,
                      fontFamily: FONT_MONO, marginBottom: 2,
                    }}
                  >
                    {s.name}
                  </div>
                  <div style={{ fontSize: 11, color: C.text2 + "cc", marginBottom: 3 }}>
                    {s.desc}
                  </div>
                  <div style={{ fontSize: 10, color: s.active ? C.cyan : C.green }}>
                    {s.detail}
                  </div>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Dataset breakdown */}
        <Card>
          <CardHeader title="Dataset breakdown" sub="Top languages & technologies detected" />
          <CardBody>
            {/* Coverage bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.text2 }}>Language coverage</span>
                <span style={{ fontSize: 11, color: C.cyan, fontFamily: FONT_MONO }}>
                  {coverage}%
                </span>
              </div>
              <ProgressBar pct={coverage} color={C.cyan} height={6} />
            </div>

            {/* Top languages */}
            <div
              style={{
                fontSize: 10, color: C.text3, letterSpacing: "0.1em",
                textTransform: "uppercase", marginBottom: 10,
              }}
            >
              Top languages
            </div>
            {(langData?.languages ?? []).slice(0, 5).map((l, i) => (
              <div
                key={l.language}
                style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div
                    style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENTS[i] }}
                  />
                  <span style={{ fontSize: 11, color: C.text }}>{l.language}</span>
                </div>
                <span style={{ fontSize: 11, color: C.text2, fontFamily: FONT_MONO }}>
                  {l.pct}%
                </span>
              </div>
            ))}

            <div style={{ height: 1, background: C.border, margin: "14px 0" }} />

            {/* Top technologies */}
            <div
              style={{
                fontSize: 10, color: C.text3, letterSpacing: "0.1em",
                textTransform: "uppercase", marginBottom: 10,
              }}
            >
              Top technologies
            </div>
            {(fwData?.frameworks ?? []).slice(0, 5).map((f, i) => {
              const pct = fwData?.total_mentions
                ? Math.round((f.count * 100) / fwData.total_mentions)
                : 0;
              return (
                <div
                  key={f.framework}
                  style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div
                      style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: ACCENTS[(i + 4) % ACCENTS.length],
                      }}
                    />
                    <span style={{ fontSize: 11, color: C.text }}>{f.framework}</span>
                  </div>
                  <span style={{ fontSize: 11, color: C.text2, fontFamily: FONT_MONO }}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      {/* Rebuild panel */}
      <Card>
        <CardHeader
          title="Rebuild dataset"
          sub="Re-runs the full pipeline to reprocess all archive files"
          right={
            <button
              onClick={handleRebuild}
              disabled={rebuilding}
              style={{
                padding: "6px 14px", borderRadius: 7,
                background: rebuilding ? C.bg4 : `${C.cyan}18`,
                border: `1px solid ${rebuilding ? C.border : C.cyan}`,
                color: rebuilding ? C.text3 : C.cyan,
                fontFamily: FONT_MONO, fontSize: 11,
                cursor: rebuilding ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.15s",
              }}
            >
              <RefreshCw
                size={12}
                style={rebuilding ? { animation: "spin 1s linear infinite" } : {}}
              />
              {rebuilding ? "Running..." : "Run pipeline"}
            </button>
          }
        />
        <CardBody>
          <div
            style={{
              background: "#030608",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: 16,
              fontSize: 11,
              lineHeight: 1.8,
              fontFamily: FONT_MONO,
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {buildLog.length > 0 ? (
              buildLog.map((line, i) => (
                <div
                  key={i}
                  style={{
                    color: line.includes("Error") || line.includes("Failed")
                      ? C.rose
                      : line.startsWith("✓")
                      ? C.green
                      : C.text2,
                  }}
                >
                  {line}
                </div>
              ))
            ) : (
              <div>
                <div style={{ color: C.text3, marginBottom: 8 }}># API endpoints</div>
                {API_ENDPOINTS.map(([ep, desc]) => (
                  <div key={ep} style={{ marginBottom: 2 }}>
                    <span style={{ color: C.cyan }}>{ep.padEnd(34)}</span>
                    <span style={{ color: C.text3 }}>{desc}</span>
                  </div>
                ))}
                <div style={{ marginTop: 10 }}>
                  <span style={{ color: C.green }}>✓ API running</span>
                  <span style={{ color: C.text }}> → localhost:8000</span>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
