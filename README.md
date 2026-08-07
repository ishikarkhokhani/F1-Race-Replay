# F1 Race Replay 🏎️💨

Real-time Formula 1 telemetry processing, stream alignment, and interactive web visualization dashboard. Built with Python, FastF1, WebSockets, Next.js, and React Canvas.

## Features
- **FastF1 Data Extraction:** Automated caching and retrieval of high-frequency track position and telemetry metrics.
- **Stream Alignment & Normalization:** Resamples multi-driver telemetry feeds onto uniform 100ms timeframes.
- **WebSocket Broadcasting:** Low-latency server push engine that streams aligned frames directly to web clients.
- **Dyanmic Track Canvas:** Auto-centered track geometry renderer with smooth real-time driver positioning.
- **Multi-Circuit Selection:** Switch between tracks (Monza, Silverstone, Spa, Monaco, Red Bull Ring) on the fly via live WebSocket requests.
- **Playback Controls:** Interactive timeline scrubber slider, play/pause states, and variable speed multipliers (1x, 2x, 4x).
- **Live Telemetry & Analytics HUD:** Real-time speed comparison charts, telemetry feeds, and relative gap delta tracking.

## Tech Stack

- **Backend:** Python, FastF1, Pandas, WebSockets
- **Frontend:** Next.js, React, Tailwind CSS, Recharts, HTML5 Canvas

## Quickstart

### Backend Setup

```bash
# Step 1: Clone the repo
git clone https://github.com/ishikarkhokhani/F1-Race-Replay.git
cd F1-Race-Replay

# Step 2: Install the Python dependencies
pip install -r requirements.txt

# Step 3: Start the WebSocket streaming server
python main.py --year 2023 --gp Monza --drivers VER LEC HAM

```

---

### Frontend Setup

```bash
# Step 1: Go to the web dashboard directory
cd web

# Step 2: Install the Node dependencies
npm install

#Step 3: Run the development server
npm run dev

```

---

Open http://localhost:3000 in your browser to view the dashboard