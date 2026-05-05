import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
 
import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { ACCENTS, C, FONT_BODY, FONT_DISPLAY, FONT_MONO } from "../styles/tokens";
import {
  Badge, Card, CardBody, CardHeader,
  LoadingSpinner, PageHeader, ProgressBar, StatCard,
} from "../components/ui";
 
const SHOW_INITIAL   = 4;
const ECO_PAGE_SIZE  = 6;
 
export default function EcosystemPage() {
  const { data: ecoData, loading: ecoLoading } = useApi(api.getFrameworksByLang);
  const { data: fwData,  loading: fwLoading  } = useApi(api.getFrameworks);
  const [selected, setSelected] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [ecoPage,  setEcoPage]  = useState(0);
 
  if (ecoLoading || fwLoading) return <LoadingSpinner />;
 
  const ecosystems = (ecoData?.ecosystems ?? []).map((e, i) => ({
    ...e,
    color: ACCENTS[i % ACCENTS.length],
  }));
 
  const totalPages      = Math.ceil(ecosystems.length / ECO_PAGE_SIZE);
  const pagedEcosystems = ecosystems.slice(ecoPage * ECO_PAGE_SIZE, (ecoPage + 1) * ECO_PAGE_SIZE);
 
  const selectedName  = selected ?? ecosystems[0]?.language ?? null;
  const selectedEco   = ecosystems.find((e) => e.language === selectedName);
  const libs          = selectedEco?.frameworks ?? [];
  const maxCount      = libs[0]?.count ?? 1;
  const displayedLibs = showMore ? libs : libs.slice(0, SHOW_INITIAL);
 
  const totalMentions = fwData?.total_mentions ?? 0;
 
  function handleSelect(language) {
    setSelected(language);
    setShowMore(false);
  }
 
  return (
    <div>
      <PageHeader
        title="Ecosystem Explorer"
        sub={`Technology ecosystem analysis across ${totalMentions.toLocaleString()} tech mentions detected in commit messages`}
      />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 28 }}>
        <StatCard
          label="Ecosystems Mapped"
          value={ecosystems.length}
          sub="language ecosystems"
          accent={C.cyan}
        />
        <StatCard
          label="Total Tech Mentions"
          value={totalMentions.toLocaleString()}
          sub="across all commit messages"
          accent={C.purple}
        />
        <StatCard
          label="Top Technology"
          value={fwData?.frameworks?.[0]?.framework ?? "—"}
          sub={`${fwData?.frameworks?.[0]?.count?.toLocaleString() ?? 0} mentions`}
          accent={C.green}
        />
      </div>
 
      {/* Ecosystem selector grid */}
      <Card style={{ marginBottom: 16 }}>
        <CardHeader
          title="Select an ecosystem"
          sub="Click to explore technology usage within each language"
        />
        <CardBody>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {pagedEcosystems.map((e) => {

              const active = selectedName === e.language;
              return (
                <button
                  key={e.language}
                  onClick={() => handleSelect(e.language)}
                  style={{
                    background: active ? `${e.color}12` : C.bg3,
                    border: `1px solid ${active ? e.color : C.border}`,
                    borderRadius: 10,
                    padding: "14px 16px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700,
                      color: active ? e.color : C.text, marginBottom: 4,
                    }}
                  >
                    {e.language}
                  </div>
                  <div style={{ fontSize: 10, color: C.text3, marginBottom: 10 }}>
                    {e.frameworks.length} technologies detected
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {e.frameworks.slice(0, 3).map((f) => (
                      <span
                        key={f.framework}
                        style={{
                          fontSize: 10, padding: "2px 7px", borderRadius: 5,
                          background: C.bg4, color: C.text2,
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        {f.framework}
                      </span>
                    ))}
                    {e.frameworks.length > 3 && (
                      <span
                        style={{
                          fontSize: 10, padding: "2px 7px", borderRadius: 5,
                          background: C.bg4, color: C.text3,
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        +{e.frameworks.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 16, gap: 10 }}>
          <button
            onClick={() => setEcoPage((p) => Math.max(p - 1, 0))}
            disabled={ecoPage === 0}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              background: C.bg3,
              border: `1px solid ${C.border}`,
              color: C.text2,
              cursor: "pointer",
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: 12, color: C.text3 }}>
            Part {ecoPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setEcoPage((p) => Math.min(p + 1, totalPages - 1))}
            disabled={ecoPage === totalPages - 1}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              background: C.bg3,
              border: `1px solid ${C.border}`,
              color: C.text2,
              cursor: "pointer",
            }}
          >
            Next
          </button>
        </div>

        </CardBody>
      </Card>
      
      {/* Selected ecosystem detail */}
      {selectedEco && (
        <Card>
          <CardHeader
            title={`${selectedName} ecosystem`}
            sub="Technology usage by mention frequency in commit messages"
            right={<Badge color={selectedEco.color}>{libs.length} technologies</Badge>}
          />
          <CardBody>
            {displayedLibs.map((f) => {
              const pct = Math.round((f.count * 100) / maxCount);
              return (
                <div key={f.framework} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex", justifyContent: "space-between", marginBottom: 6,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: selectedEco.color,
                        }}
                      />
                      <span style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>
                        {f.framework}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontFamily: FONT_MONO, color: C.text3 }}>
                      {pct}% of {selectedName} mentions
                    </span>
                  </div>
                  <ProgressBar pct={pct} color={selectedEco.color} height={8} />
                </div>
              );
            })}
 
            {libs.length > SHOW_INITIAL && (
              <button
                onClick={() => setShowMore((v) => !v)}
                style={{
                  marginTop: 8, padding: "8px 14px",
                  background: C.bg3, border: `1px solid ${C.border}`,
                  borderRadius: 8, color: C.text2, fontSize: 11,
                  cursor: "pointer", fontFamily: FONT_BODY,
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {showMore ? (
                  <><ChevronUp size={12} /> Show less</>
                ) : (
                  <><ChevronDown size={12} /> Show {libs.length - SHOW_INITIAL} more</>
                )}
              </button>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}