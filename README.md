# KAAPPAAN — காப்பான் Maritime Safety Platform

AI-powered fisherman safety platform for the Bay of Bengal.
Built for the AWS Strands SDK: Workshop to Ship hackathon.

> ⚠ All GPS positions, geofence zones, and fisherman data are **simulated for demonstration only**.
> This is not connected to real maritime tracking systems, GPS hardware, or official maritime boundaries.

---

## Quick Start

### Prerequisites
- Python 3.12
- Node.js 18+ and npm

### 1. Backend (FastAPI + Strands AI)

```bash
# From project root
python3.12 -m venv .venv
source .venv/bin/activate
pip install fastapi "uvicorn[standard]" sqlalchemy aiosqlite "strands-agents==1.62.0" "boto3==1.43.118" "pydantic==2.14.1" python-multipart

# Set AWS credentials (never paste keys in chat)
export AWS_PROFILE=new-account
export AWS_REGION=us-east-1

# Start backend (auto-seeds 5 demo fishermen)
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Or use the existing venv:
```bash
AWS_PROFILE=new-account AWS_REGION=us-east-1 .venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend (React + TypeScript + Tailwind)

```bash
cd frontend
npm install
npm run dev
```

### 3. Open the app

```
http://localhost:3000
```

---

## Demo Flow

### Start GPS simulation
1. Click **Start** in the sidebar — fishermen move every 3 seconds
2. Watch the **Live Map** — markers update with new positions
3. **Alerts** panel will show geofence warnings as fishermen approach zones

### Trigger SOS
1. Go to **SOS** tab
2. Select a fisherman from the dropdown → **SEND SOS**
3. Or click the **SOS** button next to any fisherman in the list
4. Acknowledge and resolve from the SOS panel

### Run AI Analysis
1. Go to **AI Safety** tab
2. Click **Run AI Analysis**
3. The Strands agent calls Amazon Bedrock Nova 2 Lite
4. If Bedrock is unavailable, a **deterministic fallback** (clearly labelled) is used
5. Recommendations include Tamil summaries (local, no translation API)

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard` | Dashboard statistics |
| GET | `/api/fishermen` | All fishermen with latest location |
| GET | `/api/locations/latest` | Latest GPS for all fishermen |
| POST | `/api/telemetry` | Ingest telemetry batch |
| GET | `/api/alerts` | All alerts (latest 100) |
| POST | `/api/sos` | Trigger SOS event |
| PATCH | `/api/sos/{id}` | Update SOS status |
| GET | `/api/agents/status` | Run Strands AI agent |
| POST | `/api/simulation/step` | Advance simulation one tick |
| POST | `/api/simulation/reset` | Reset to initial positions |
| GET | `/api/geofences` | Geofence zone definitions |
| GET | `/api/health` | Backend health check |

---

## Architecture

```
kaapaan/
├── backend/
│   ├── main.py          # FastAPI app, all routes
│   ├── models.py        # SQLAlchemy models (SQLite)
│   ├── database.py      # DB setup, seeding, haversine, geofence compute
│   ├── simulation.py    # GPS movement simulation engine
│   └── ai_agent.py      # Strands Agent + Bedrock tools + fallback
├── frontend/
│   └── src/
│       ├── App.tsx              # Main layout + routing
│       ├── components/
│       │   ├── MapView.tsx       # Leaflet interactive map
│       │   ├── FishermanList.tsx # Status list with SOS buttons
│       │   ├── AlertPanel.tsx    # Geofence alert list
│       │   ├── SOSPanel.tsx      # SOS management
│       │   ├── AIRecommendations.tsx # Strands AI results
│       │   └── StatCard.tsx      # Dashboard stats
│       ├── api/client.ts         # Typed API client
│       ├── hooks/useSimulation.ts # Simulation interval hook
│       └── types/index.ts        # Shared TypeScript types
├── agent/               # Strands Ship starter (original)
├── kaapaan.db           # SQLite database (auto-created)
└── README.md
```

## Strands AI Agent

The AI agent in `backend/ai_agent.py` uses:
- **Strands Agents SDK** with two `@tool` functions:
  - `assess_geofence_risk` — calculates distances to all simulated zones
  - `analyse_fisherman_safety` — evaluates battery, signal, speed, and status
- **Amazon Bedrock Nova 2 Lite** (`us.amazon.nova-2-lite-v1:0`) via `AWS_PROFILE=new-account`
- **Deterministic fallback** (clearly labelled in UI) if Bedrock is unavailable
- **Tamil safety messages** — hardcoded locally, no external translation API
- **Hard-coded safety thresholds** in `THRESHOLDS` dict — the model reads them but cannot change them

## Geofence Zones (Simulated)

Three demo zones near Tamil Nadu coast:
- **Restricted Zone Alpha** — center 10.5°N 80.2°E, radius 25 km
- **Warning Zone Beta** — center 10.0°N 80.8°E, radius 35 km
- **Caution Zone Gamma** — center 9.6°N 79.5°E, radius 20 km

Status thresholds (code-owned, not model-controlled):
- `> 25 km`: safe
- `10–25 km`: warning
- `< 10 km`: critical
- Inside zone: critical + immediate alert

## Hackathon Notes

- Social good area: **Health / Climate Resilience** — protecting fishermen at sea
- Uses Strands SDK real agents with Bedrock, not mock responses
- Geofence risk + safety tools are the Strands tools
- Tamil language support included (local fallback messages)
- Hard stop if battery ≤ 10% (SOS auto-trigger threshold in code, not model)
