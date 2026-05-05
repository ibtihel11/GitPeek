import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

import { C, FONT_BODY, FONT_MONO } from "../styles/tokens";

// typing indicator dots animation
const typingDots = `
  @keyframes typingBounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-4px); opacity: 1; }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .msg-enter { animation: fadeSlideIn 0.2s ease forwards; }
  .dot1 { animation: typingBounce 1.2s infinite 0s; }
  .dot2 { animation: typingBounce 1.2s infinite 0.2s; }
  .dot3 { animation: typingBounce 1.2s infinite 0.4s; }
  pre { margin: 0 !important; }
  pre code { font-size: 11px !important; }
`;

export default function ChatbotPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I can explain programming languages, ecosystems, and GitHub trends. What would you like to explore?",
    },
  ]);

  // auto-scroll 
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chat/", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role:    "assistant",
        content: data.reply || "No response received.",
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role:    "assistant",
        content: "Unable to reach the AI backend. Make sure the server is running on port 8000.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  // suggested prompts 
  const SUGGESTIONS = [
    "What is the most used language?",
    "Tell me about the React ecosystem",
    "What does 'commit intent' mean?",
    "Which ecosystems are trending?",
  ];

  const showSuggestions = messages.length === 1;

  return (
    <div style={{
      height: "calc(100vh - 80px)",
      display: "flex",
      flexDirection: "column",
      maxWidth: 820,
      margin: "0 auto",
      padding: "0 8px 24px",
      gap: 0,
    }}>
      <style>{typingDots}</style>

      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "20px 0 16px",
        borderBottom:   `1px solid ${C.border}`,
        marginBottom:   0,
        flexShrink:     0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width:          36,
            height:         36,
            borderRadius:   "50%",
            background:     `${C.cyan}18`,
            border:         `1px solid ${C.cyan}44`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
          }}>
            <Sparkles size={16} color={C.cyan} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: FONT_BODY }}>
              AI Assistant
            </div>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: FONT_MONO }}>
              Powered by GitHub Explorer dataset
            </div>
          </div>
        </div>

        {/* live indicator badge */}
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          6,
          padding:      "4px 12px",
          borderRadius: 20,
          border:       `1px solid ${C.cyan}44`,
          background:   `${C.cyan}08`,
          fontSize:     10,
          color:        C.cyan,
          fontFamily:   FONT_MONO,
        }}>
          <span style={{
            width:      5,
            height:     5,
            borderRadius: "50%",
            background: C.cyan,
            animation:  "typingBounce 2s infinite",
            display:    "inline-block",
          }}/>
          online
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "32px 0",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        // subtle scrollbar
        scrollbarWidth: "thin",
        scrollbarColor: `${C.border} transparent`,
      }}>

        {showSuggestions && (
          <div style={{
            display:       "flex",
            flexWrap:      "wrap",
            gap:           8,
            marginBottom:  16,
            paddingBottom: 16,
            borderBottom:  `1px solid ${C.border}`,
          }}>
            <div style={{ width: "100%", fontSize: 10, color: C.text3, fontFamily: FONT_MONO, marginBottom: 4 }}>
              Suggested questions
            </div>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => { setInput(s); inputRef.current?.focus(); }}
                style={{
                  padding:      "5px 12px",
                  borderRadius: 20,
                  border:       `1px solid ${C.border}`,
                  background:   "transparent",
                  color:        C.text2,
                  fontSize:     11,
                  fontFamily:   FONT_MONO,
                  cursor:       "pointer",
                  transition:   "all 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.cyan;
                  e.currentTarget.style.color       = C.cyan;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.color       = C.text2;
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* message bubbles redesigned with avatar + better spacing */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className="msg-enter"
            style={{
              display:    "flex",
              gap:        10,
              alignItems: "flex-start",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              marginBottom: 4,
            }}
          >
            {/* avatar */}
            <div style={{
              width:          30,
              height:         30,
              borderRadius:   "50%",
              flexShrink:     0,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              background:     msg.role === "user"
                ? `${C.cyan}22`
                : `${C.border}`,
              border: `1px solid ${msg.role === "user" ? C.cyan + "44" : C.border}`,
              marginTop: 2,
            }}>
              {msg.role === "user"
                ? <User  size={13} color={C.cyan} />
                : <Bot   size={13} color={C.text2} />
              }
            </div>

            {/* bubble */}
            <div style={{
              maxWidth:     "72%",
              padding: msg.role === "user" ? "14px 18px" : "16px 20px",
              borderRadius: msg.role === "user"
                ? "14px 4px 14px 14px"
                : "4px 14px 14px 14px",
              fontSize:     12,
              fontFamily:   FONT_BODY,
              lineHeight:   1.6,
              background:   msg.role === "user"
                ? C.cyan
                : C.bg3,
              color: msg.role === "user" ? "#000" : C.text,
              border: msg.role === "assistant"
                ? `1px solid ${C.border}`
                : "none",
            }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  p: ({ children }) => (
                    <p style={{ margin: "0 0 8px", whiteSpace: "pre-wrap" }}>{children}</p>
                  ),
                  // inline code vs block code styled differently
                  code: ({ inline, children }) => inline
                    ? <code style={{
                        fontFamily:   FONT_MONO,
                        fontSize:     10,
                        background:   msg.role === "user" ? "rgba(0,0,0,0.15)" : C.bg2,
                        padding:      "1px 5px",
                        borderRadius: 4,
                      }}>{children}</code>
                    : <code style={{ fontFamily: FONT_MONO }}>{children}</code>,
                  // pre block with proper overflow
                  pre: ({ children }) => (
                    <pre style={{
                      borderRadius:   6,
                      overflow:       "auto",
                      margin:         "8px 0",
                      fontSize:       11,
                      border:         `1px solid ${C.border}`,
                    }}>{children}</pre>
                  ),
                  // list styling
                  ul: ({ children }) => (
                    <ul style={{ paddingLeft: 16, margin: "4px 0" }}>{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li style={{ marginBottom: 2 }}>{children}</li>
                  ),
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {/* typing indicator with animated dots */}
        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{
              width:  30, height: 30, borderRadius: "50%",
              flexShrink: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: C.border, border: `1px solid ${C.border}`,
            }}>
              <Bot size={13} color={C.text2} />
            </div>
            <div style={{
              padding:      "12px 16px",
              borderRadius: "4px 14px 14px 14px",
              background:   C.bg3,
              border:       `1px solid ${C.border}`,
              display:      "flex",
              gap:          5,
              alignItems:   "center",
            }}>
              {["dot1","dot2","dot3"].map(cls => (
                <span key={cls} className={cls} style={{
                  width:        6,
                  height:       6,
                  borderRadius: "50%",
                  background:   C.text3,
                  display:      "inline-block",
                }}/>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* input area redesigned with character feel */}
      <div style={{
        flexShrink:   0,
        borderTop:    `1px solid ${C.border}`,
        paddingTop: 20,
      }}>
        <div style={{
          display:      "flex",
          gap:          8,
          alignItems:   "flex-end",
          padding:      "10px 14px",
          borderRadius: 12,
          border:       `1px solid ${C.border}`,
          background:   C.bg2,
          transition:   "border-color 0.15s",
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = C.cyan}
          onBlurCapture={e  => e.currentTarget.style.borderColor = C.border}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask about React, Python, GitHub ecosystems..."
            style={{
              flex:       1,
              background: "transparent",
              border:     "none",
              outline:    "none",
              color:      C.text,
              fontSize:   12,
              fontFamily: FONT_BODY,
              lineHeight: 1.5,
              resize:     "none",
              padding:    0,
              minHeight:  20,
            }}
          />

          {/* send button with disabled state */}
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              width:          32,
              height:         32,
              borderRadius:   "50%",
              border:         "none",
              background:     input.trim() && !loading ? C.cyan : C.border,
              cursor:         input.trim() && !loading ? "pointer" : "not-allowed",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
              transition:     "background 0.15s, transform 0.1s",
            }}
            onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.transform = "scale(1.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            <Send size={13} color={input.trim() && !loading ? "#000" : C.text3} />
          </button>
        </div>

        {/* hint text below input */}
        <div style={{
          fontSize:   10,
          color:      C.text3,
          fontFamily: FONT_MONO,
          marginTop:  6,
          textAlign:  "center",
        }}>
          Press Enter to send · data from January 2026 GitHub Archive
        </div>
      </div>
    </div>
  );
}