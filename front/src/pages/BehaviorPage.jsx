import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { C, FONT_MONO, INTENT_COLORS } from "../styles/tokens";
import {
  Card, CardBody, CardHeader, CustomTooltip, LoadingSpinner, PageHeader, ProgressBar, StatCard, IntentDisclaimerBanner,
} from "../components/ui";

const INTENT_DESCRIPTIONS = {
  feat: "A new feature added to the project.",
  fix: "A bug fix or correction of an issue.",
  docs: "Documentation changes only (README, comments, etc.).",
  test: "Adding or updating tests.",
  refactor: "Code restructuring without changing behavior.",
  chore: "Maintenance tasks (build, config, dependencies, etc.).",
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function BehaviorPage() {
  const { data: intentData, loading: intentLoading } = useApi(api.getIntent);
  const { data: trendData,  loading: trendLoading  } = useApi(api.getLanguageTrend);

  if (intentLoading || trendLoading) return <LoadingSpinner />;

  // Intent data 
  const intents         = intentData?.intents ?? [];
  const totalClassified = intentData?.total_classified ?? 0;
  const totalRows       = intentData?.total_rows ?? 0;
  const topIntent       = intents[0];

  // Day-of-week data
  const dowDays   = trendData?.days   ?? [];
  const dowCounts = trendData?.counts ?? [];
  const dowTotal  = dowCounts.reduce((s, v) => s + v, 0);
  const dowChart  = dowDays.map((d, i) => ({
    day: d,
    pct: dowTotal ? Math.round((dowCounts[i] * 100) / dowTotal) : 0,
  }));
  const topDay = dowChart.reduce((b, d) => (d.pct > (b?.pct ?? 0) ? d : b), null);

  return (
    <div>
      <PageHeader
        title="Developer Behavior"
        sub={`Commit intent classification across ${totalRows.toLocaleString()} events — ${totalClassified.toLocaleString()} rows classified`}
      />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 28 }}>
        <StatCard
          label="Leading Intent"
          value={topIntent?.intent ?? "—"}
          sub={`${topIntent?.pct ?? 0}% of classified commits`}
          accent={C.purple}
        />
        <StatCard
          label="Most Active Day"
          value={topDay?.day ?? "—"}
          sub={`${topDay?.pct ?? 0}% of weekly activity`}
          accent={C.green}
        />
        <StatCard
          label="Classification Rate"
          value={`${Math.round((totalClassified * 100) / (totalRows || 1))}%`}
          sub={`${totalClassified.toLocaleString()} commits classified`}
          accent={C.amber}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Intent distribution */}
        <Card>
          <CardHeader
            title="Commit intent distribution"
            sub="Classified commits only · conventional prefix matching"
          />
          <CardBody>
            {intents.map((item) => {
              const color = INTENT_COLORS[item.intent] ?? C.text3;
              return (
                <div key={item.intent} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex", justifyContent: "space-between", marginBottom: 5,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 2, background: color }} />
                      <span
                        style={{
                          fontSize: 12, color: C.text, fontWeight: 500, fontFamily: FONT_MONO,
                        }}
                      >
                        {item.intent}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: C.text3, fontFamily: FONT_MONO }}>
                      {item.pct}%
                    </span>
                  </div>
                  <ProgressBar pct={item.pct} color={color} height={7} />
                </div>
              );
            })}
          </CardBody>
        </Card>

        {/* Activity by day of week */}
        <Card>
          <CardHeader
            title="Activity by day of week"
            sub="Relative commit activity per weekday"
          />
          <CardBody style={{ paddingBottom: 0 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dowChart} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: C.text3, fontSize: 11, fontFamily: FONT_MONO }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: C.text3, fontSize: 9, fontFamily: FONT_MONO }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  formatter={(v) => [`${v}%`, "activity"]}
                />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                  {dowChart.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.day === topDay?.day ? `${C.cyan}99` : `${C.cyan}22`}
                      stroke={d.day === topDay?.day ? C.cyan : `${C.cyan}44`}
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
      <Card style={{ marginBottom: 16 }}>
        <CardHeader
          title="Commit intent meanings"
          sub="Based on Conventional Commits specification"
        />
        <CardBody>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {Object.entries(INTENT_DESCRIPTIONS).map(([key, desc]) => {
              const color = INTENT_COLORS[key] ?? C.text3;

              return (
                <div key={key} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: color,
                      marginTop: 5,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontFamily: FONT_MONO,
                        color: C.text,
                        fontWeight: 600,
                      }}
                    >
                      {key}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: C.text3,
                        lineHeight: "1.4",
                      }}
                    >
                      {desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
      <IntentDisclaimerBanner style={{ marginTop: 16 }}/>
    </div>
  );
}
