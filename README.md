# F1 Race Replay 🏎️💨

Real-time Formula 1 telemetry processing, interpolation, and visualization pipeline. Built with Python, FastF1, WebSockets, and PySpark.

## Features
- **FastF1 Data Extraction:** Automated caching and retrieval of high-frequency track telemetry.
- **Stream Alignment:** Resamples multi-driver telemetry feeds onto uniform 100ms timeframes.
- **WebSocket Broadcasting:** Real-time push engine for frontend rendering engines.

## Quickstart

```bash
# Clone the repository
git clone [https://github.com/ishikarkhokhani/F1-Race-Replay.git](https://github.com/ishikarkhokhani/F1-Race-Replay.git)
cd F1-Race-Replay

# Install dependencies
pip install -r requirements.txt

# Run stream processor
python main.py --year 2023 --gp Monza --drivers VER LEC HAM

---

### Step 3: Commands to Push to GitHub

Run these commands in your local terminal:

```bash
# Create local repo directory if not already created
mkdir -p ~/Desktop/Projects/F1-Race-Replay
cd ~/Desktop/Projects/F1-Race-Replay

# Initialize git
git init
git branch -M main

# Add remote
git remote add origin https://github.com/ishikarkhokhani/F1-Race-Replay.git

# Create files, stage and commit
git add .
git commit -m "feat: initial commit for F1 Race Replay ingestion and streaming pipeline"

# Push to GitHub
git push -u origin main