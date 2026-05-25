# Setup — Running Live Mode

Live mode lets you type any occupation (not just the 50 pre-built ones) and get a fresh AI evaluation. The analysis runs entirely on your computer — no API keys, no usage costs.

**Time required:** about 15 minutes.
**Disk space needed:** about 3 GB (mostly the local AI model).
**Works on:** macOS, Linux, Windows.

If you just want to look at the program with the pre-built analyses, you don't need any of this — see the README for demo mode.

---

## What you're installing

Two things:

1. **Node.js** — runs the small server that the web page talks to. Free, open-source, no account needed.
2. **Ollama** — runs an AI model locally on your computer. Free, open-source, no account needed.

Plus a 2 GB AI model (Llama 3.2 3B) that Ollama downloads once.

---

## Step 1 — Install Node.js

### macOS
Open [nodejs.org](https://nodejs.org) and click the green "LTS" button to download the installer. Double-click the file and follow the prompts.

### Windows
Same as above — [nodejs.org](https://nodejs.org), LTS installer.

### Verify
Open Terminal (macOS) or Command Prompt (Windows) and run:
```
node --version
```
You should see something like `v20.x.x`. If you do, Node.js is installed.

---

## Step 2 — Install Ollama

### macOS
Open [ollama.com](https://ollama.com) and click the Download button. Open the downloaded file and drag Ollama into Applications. Open Ollama once to let it set up; it will keep running in your menu bar.

### Windows
Same as above — [ollama.com](https://ollama.com), Windows installer.

### Verify
Open Terminal / Command Prompt and run:
```
ollama --version
```
You should see something like `ollama version is 0.x.x`.

---

## Step 3 — Pull the AI model

Run this in Terminal / Command Prompt:
```
ollama pull llama3.2:3b
```
This downloads about 2 GB. Takes a few minutes depending on your connection.

---

## Step 4 — Start the server

From this project's folder, run:
```
cd server
npm install
npm start
```

The first time you run `npm install`, it installs the small set of dependencies the server uses. After that, `npm start` just starts the server.

You should see output ending with something like:
```
[startup] Career AI Explorer server listening on http://localhost:3001
```

Leave that Terminal window open while you use the program.

---

## Step 5 — Open the program

Open `constellation.html` in your browser (right-click → Open with → Chrome / Safari / Firefox).

Now when you click an occupation or type a custom one, the page will:
- First try the live local server (you'll see the loader run for ~25–35 seconds while the AI generates a fresh analysis).
- If the server can't be reached, it falls back to the pre-built analyses from demo mode.

---

## Troubleshooting

**"Server is offline" or loader shows an error:**
- Make sure the `npm start` Terminal window is still open and shows no errors.
- Make sure Ollama is running (look for the icon in your menu bar / system tray).
- Try opening `http://localhost:3001/health` in your browser. You should see a small JSON response. If you don't, the server isn't running.

**"command not found: node" or "ollama":**
- The install didn't complete or your Terminal hasn't picked it up yet. Close Terminal, open a new one, and try again.

**Analysis takes longer than a minute:**
- The first request after starting Ollama is slow because the model has to load into memory. Subsequent requests are faster.
- On older Macs or computers without dedicated graphics, the model will run on CPU and may take 60+ seconds.

---

## Stopping the server

In the Terminal window where the server is running, press `Ctrl+C`. That stops the server. To start it again, run `npm start` from the `server` folder.

You can leave Ollama running in the background — it doesn't slow your computer down when it's not actively generating.

---

## Re-building the demo bundle

If Mateo updates the project and wants the teacher's copy to get the latest pre-built analyses, the build script regenerates them by hitting the live server. Run:

```
node scripts/build-precomputed.js
```

That takes about 25 minutes (50 occupations × ~30 seconds each). Once it's done, the `dist/precomputed/` folder has fresh JSON files and the demo mode works with the latest analyses.
