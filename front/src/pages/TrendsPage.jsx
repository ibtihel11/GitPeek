import { useState } from "react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";

import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { ACCENTS, C, FONT_BODY, FONT_DISPLAY, FONT_MONO } from "../styles/tokens";
import {
  Badge, Card, CardBody, CardHeader, CustomTooltip,
  DisclaimerBanner, LoadingSpinner, PageHeader, ProgressBar, StatCard,
} from "../components/ui";

const SHOW_INITIAL = 5;

export default function TrendsPage() {
  const { data: langData, loading: langLoading } = useApi(api.getLanguages);
  const { data: fwData,   loading: fwLoading   } = useApi(api.getFrameworks);
  const [showAll, setShowAll] = useState(false);

  if (langLoading || fwLoading) return <LoadingSpinner />;

  const langs      = (langData?.languages ?? []).filter((l) => l.pct > 0);
  const totalRows  = langData?.total_rows ?? 0;
  const withLang   = langData?.rows_with_language ?? 0;
  const coverage   = totalRows ? Math.round((withLang * 100) / totalRows) : 0;
  const topLang    = langs[0];
  const maxCount   = langs[0]?.count ?? 1;
  const displayed  = showAll ? langs : langs.slice(0, SHOW_INITIAL);

  const frameworks = (fwData?.frameworks ?? []).slice(0, 10);
  const maxFw      = frameworks[0]?.count ?? 1;

  return (
    <div>
      <PageHeader
        title="Tech Trends"
        sub={`Language distribution across ${(totalRows / 1_000_000).toFixed(1)}M GitHub events · January 2026`}
      />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
        <StatCard
          label="Total Events"
          value="1.1M"
          sub="from January archive files"
          accent={C.cyan}
        />
        <StatCard
          label="Ecosystems Detected"
          value={langs.length}
          sub="unique languages"
          accent={C.purple}
        />
        <StatCard
          label="Leading Language"
          value={topLang?.language ?? "—"}
          sub={`${topLang?.pct ?? 0}% of classified events`}
          accent={C.green}
        />
        <StatCard
          label="Classification Rate"
          value={`${coverage}%`}
          sub={`${(withLang / 1_000_000).toFixed(1)}M rows identified`}
          accent={C.amber}
        />
      </div>

      {/* Language distribution bar chart */}
      <Card style={{ marginBottom: 16 }}>
        <CardHeader
          title="Language distribution"
          sub="Top 15 languages by commit volume · Jan 2026"
        />
        <CardBody>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={langs.slice(0, 15).map((l, i) => ({ ...l, color: ACCENTS[i % ACCENTS.length] }))}
              margin={{ top: 4, right: 8, left: -16, bottom: 56 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis
                dataKey="language"
                tick={{ fill: C.text3, fontSize: 10, fontFamily: FONT_MONO }}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
              />
              <YAxis
                tick={{ fill: C.text3, fontSize: 9, fontFamily: FONT_MONO }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {langs.slice(0, 15).map((_, i) => (
                  <Cell key={i} fill={`${ACCENTS[i % ACCENTS.length]}cc`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Language rankings table */}
      <Card style={{ marginBottom: 16 }}>
        <CardHeader
          title="Language rankings"
          sub="Ordered by ecosystem activity"
          right={<Badge color={C.cyan}>{langs.length} languages</Badge>}
        />
        <div>
          {displayed.map((l, i) => {
            const color = ACCENTS[i % ACCENTS.length];
            const barW  = Math.round((l.count * 100) / maxCount);
            return (
              <div
                key={l.language}
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px 140px 1fr 60px",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 20px",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <span style={{ fontSize: 11, color: C.text3, fontFamily: FONT_MONO }}>
                  {i + 1}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: color, flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>
                    {l.language}
                  </span>
                </div>
                <ProgressBar pct={barW} color={color} height={5} />
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontSize: 11, fontFamily: FONT_MONO, fontWeight: 600,
                      color, background: `${color}15`,
                      padding: "2px 7px", borderRadius: 6,
                    }}
                  >
                    {l.pct}%
                  </span>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => setShowAll((v) => !v)}
            style={{
              width: "100%", padding: "12px",
              background: "transparent", border: "none",
              borderTop: `1px solid ${C.border}`,
              color: C.text2, fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontFamily: FONT_BODY, transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.bg3)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {showAll ? (
              <><ChevronUp size={14} /> Show less</>
            ) : (
              <><ChevronDown size={14} /> Show all detected languages</>
            )}
          </button>
        </div>
      </Card>

      {/* Leading ecosystems */}
      <Card style={{marginBottom: 16}}>
        <CardHeader
          title="Leading ecosystems"
          sub="Detected in commit messages via keyword pattern matching"
        />
        <CardBody>
          {frameworks.map((f, i) => {
            const color = ACCENTS[(i + 3) % ACCENTS.length];
            const pct   = Math.round((f.count * 100) / maxFw);
            return (
              <div key={f.framework} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>
                    {f.framework}
                  </span>
                  <span style={{ fontSize: 11, color: C.text3, fontFamily: FONT_MONO }}>
                    {f.count.toLocaleString()} mentions · {pct}%
                  </span>
                </div>
                <ProgressBar pct={pct} color={color} height={7} />
              </div>
            );
          })}
        </CardBody>
      </Card>
      <DisclaimerBanner style={{ marginTop: 16 }} />
    </div>
  );
}
