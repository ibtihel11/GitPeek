import { useState } from "react";
import { BarChart2, Layers, Activity, Database, Sparkle } from "lucide-react";

import { C, FONT_DISPLAY, FONT_MONO, FONT_BODY } from "./styles/tokens";
import TrendsPage    from "./pages/TrendsPage";
import EcosystemPage from "./pages/EcosystemPage";
import BehaviorPage  from "./pages/BehaviorPage";
import DatasetPage   from "./pages/DatasetPage";
import ChatbotPage from "./pages/ChatbotPage";
import logo from "./assets/GitPeek.png";

const NAV_ITEMS = [
  { id: "trends", label: "Tech Trends", icon: BarChart2, page: TrendsPage},
  { id: "ecosystem", label: "Ecosystems", icon: Layers, page: EcosystemPage},
  { id: "behavior", label: "Dev Behavior", icon: Activity, page: BehaviorPage},
  { id: "dataset", label: "Dataset", icon: Database, page: DatasetPage},
  { id: "chatbot", label: "Chatbot", icon: Sparkle, page: ChatbotPage},
];

// Sidebar
function Sidebar({ active, onSelect }) {
  return (
    <aside
      style={{
        width: 200,
        flexShrink: 0,
        background: C.bg2,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "0 0 24px 0",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "22px 20px 18px",
          borderBottom: `1px solid ${C.border}`,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {/* Logo */}
          <img src={logo} style={{ width: "30px", height: "auto" }} alt="logo" />
          <span
            style={{
              fontSize: 22,
              fontFamily: FONT_DISPLAY,
              color: C.cyan,
              fontWeight: 600,
            }}
          >
            GitPeek
          </span>
        </div>
        <div
          style={{
            fontSize: 10,
            color: C.text3,
            fontFamily: FONT_MONO,
            marginTop: 6,
            paddingLeft: 18,
          }}
        >
          January 2026 Analysis
        </div>
      </div>

      {/* Nav label */}
      <div
        style={{
          fontSize: 9,
          color: C.text3,
          fontFamily: FONT_MONO,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "0 20px",
          marginBottom: 8,
        }}
      >
        Views
      </div>

      {/* Nav items */}
      <nav style={{ padding: "0 10px", flex: 1 }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 8,
                border: "none",
                background: isActive ? `${C.cyan}12` : "transparent",
                color: isActive ? C.cyan : C.text2,
                cursor: "pointer",
                fontFamily: FONT_BODY,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                marginBottom: 2,
                transition: "all 0.15s",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = C.bg3;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon
                size={15}
                style={{
                  flexShrink: 0,
                  color: isActive ? C.cyan : C.text3,
                }}
              />
              {label}
              {isActive && (
                <div
                  style={{
                    marginLeft: "auto",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: C.cyan,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "16px 20px 0",
          borderTop: `1px solid ${C.border}`,
          marginTop: 16,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: C.text3,
            fontFamily: FONT_MONO,
            lineHeight: 1.7,
          }}
        >
          <div style={{ color: C.green, marginBottom: 2 }}>● API connected</div>
          <div>localhost:8000</div>
        </div>
      </div>
    </aside>
  );
}

// App
export default function App() {
  const [activePage, setActivePage] = useState("trends");

  const ActivePage = NAV_ITEMS.find((n) => n.id === activePage)?.page ?? TrendsPage;

  return (
    <>
      {/* Global keyframe for sidebar dot + spinner */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg2}; }
        ::-webkit-scrollbar-thumb { background: ${C.border2}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.text3}; }
      `}</style>

      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: C.bg,
          fontFamily: FONT_BODY,
          color: C.text,
        }}
      >
        <Sidebar active={activePage} onSelect={setActivePage} />

        {/* Main content */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "36px 40px",
            maxWidth: 1200,
          }}
        >
          <ActivePage />
        </main>
      </div>
    </>
  );
}
