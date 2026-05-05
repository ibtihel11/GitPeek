# 🔬 GitPeek: GitHub Tech Explorer

A full-stack data analytics platform that analyzes real GitHub Archive events to surface technology trends, developer behavior, and ecosystem insights from January 2026 data.

---

## 📸 Preview

| Tech Trends | Ecosystem Explorer |
|---|---|
| Language distribution across all events | Framework co-occurrence per language |

| Developer Behavior | Dataset Inspector |
|---|---|
| Commit intent classification | Real-time dataset metadata |

---

## 🧠 What it does

- Parses **GitHub Archive `.json.gz` files** covering January 2026
- Enriches repos with their primary language via the **GitHub GraphQL API**
- Detects **tech/framework mentions** in commit messages using regex word-boundary matching
- Classifies **commit intent** (fix, feat, refactor, docs, chore, test) from commit prefixes
- Serves all analytics through a **FastAPI REST API**
- Visualizes everything in a **React dashboard**

---

## 🏗️ Architecture

```
GitHub Archive (.json.gz)
        ↓
utils/file_reader.py        — reads + streams raw events 
        ↓
services/data_service.py    — parses events, calls GitHub GraphQL API
        ↓
data/final_dataset.json     — enriched rows with language + intent + techs
        ↓
services/analytics_service.py — aggregations + in-memory cache
        ↓
FastAPI (localhost:8000)    — REST API with 8 endpoints
        ↓
React (localhost:5173)      — dashboard with 4 pages
```

---

## 🗂️ Project structure

```
GithubExplorer/
│
├── back/                          # Python backend
│   ├── app.py                     # FastAPI entry point
│   ├── requirements.txt
│   │
│   ├── routes/
│   │   ├── languages.py           # GET /api/languages/
│   │   ├── frameworks.py          # GET /api/frameworks/
│   │   ├── chat.py                # GET /api/chat/
│   │   └── repos.py               # GET /api/repos/
│   │
│   ├── services/
│   │   ├── data_service.py        # pipeline: parse → enrich → save
│   │   └── analytics_service.py   # aggregations served by API
│   │
│   ├── utils/
│   │   └── file_reader.py         # reads .json.gz files
│   │
│   ├── checks/                    # diagnostic scripts
│   │   ├── check_data.py
│   │   └──  ...                   # files used to check data
│   │
│   └── data/
│       ├── raw/                   # .json.gz files (gitignored)
│       └── final_dataset.json     # built dataset (gitignored)
│
└── front/                      # React frontend
    ├── src/
    │   ├── App.jsx                # layout + navigation
    │   ├── index.css
    │   ├── main.jsx
    │   │
    │   ├── pages/
    │   │   ├── TrendsPage.jsx     # language distribution + frameworks
    │   │   ├── EcosystemPage.jsx  # framework co-occurrence per language
    │   │   ├── BehaviorPage.jsx   # commit intent + day-of-week activity
    │   │   ├── DatasetPage.jsx    # dataset inspector + rebuild trigger
    │   │   └── ChatbotPage.jsx    # chatbot integration page
    │   │
    │   ├── hooks/
    │   │   └── useApi.js          # reusable data fetching hook
    │   │
    │   ├── styles/
    │   │   └── tokens.js          # theme, fonts and colors 
    │   │
    │   ├── components/
    │   │   └──ui
    │   │      └── index.jsx       # reusable components
    │   │
    │   ├── assets/                # logos and images
    │   │
    │   └── api/
    │       └── index.js           # all API calls in one place
    │
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## ⚙️ Tech stack

### Backend
| Tool | Purpose |
|---|---|
| Python | Core language |
| FastAPI | REST API framework |
| pandas | Data loading and manipulation |
| requests | GitHub GraphQL API calls |
| uvicorn | ASGI server |

### Frontend
| Tool | Purpose |
|---|---|
| React 18 | UI framework |
| Recharts | Charts (bar, line, cell) |
| Tailwind CSS | Utility-first styling |
| Lucide React | Icons |
| Vite | Build tool and dev server |

### Data
| Source | What we get |
|---|---|
| GitHub Archive | Raw events (PushEvent, PullRequestEvent, CreateEvent) |
| GitHub GraphQL API | Primary language per repo |

---

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A GitHub Personal Access Token ([get one here](https://github.com/settings/tokens))
- GitHub Archive `.json.gz` files in `back/data/raw/`

### 🧪 Tested configuration

- CPU: Intel i3
- RAM: 20 GB
- Dataset: ~3 GB compressed
- Build time: ~12 hours (for 32 files)

### Quick setup

```bash
# clone
git clone https://github.com/ibtihel11/GitPeek
cd GitPeek

# backend
cd back
pip install -r requirements.txt
export GITHUB_TOKEN=your_token  # or set on Windows
py -3.11 -m services.data_service
py -3.11 -m uvicorn app:app --reload

# frontend
cd ../front
npm install
npm run dev
```

---

## 📡 API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/languages/` | Language distribution + percentages |
| GET | `/api/languages/by-intent` | Commit intent breakdown per language |
| GET | `/api/languages/trend` | Activity by day of week per language |
| GET | `/api/frameworks/` | Framework mention counts |
| GET | `/api/frameworks/by-language` | Top frameworks per language ecosystem |
| GET | `/api/repos/` | Top 100 repos by commit activity |
| GET | `/api/repos/intent` | Overall commit intent distribution |
| GET | `/api/repos/build-status` | Dataset build status + log |
| POST | `/api/repos/build-dataset` | Trigger a dataset rebuild |
---

## 🙏 Data sources

- **[GitHub Archive](https://gharchive.org)** — public GitHub event data recorded hourly since 2011
- **[GitHub GraphQL API](https://docs.github.com/en/graphql)** — repo metadata including primary language

---

## 📄 License

MIT
