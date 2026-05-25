// Electron main process for Career AI Explorer.
// - Spawns the Express backend as a child process
// - Loads constellation.html as the entry point
// - Watches HTML and server files for changes and hot-reloads

const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');
const chokidar = require('chokidar');

const SERVER_PORT = '3001';
const HEALTH_URL = `http://localhost:${SERVER_PORT}/health`;

let mainWindow = null;
let serverProc = null;
let watcher = null;
let reloadTimer = null;

// ---------- source path resolution ----------
// In dev (not packaged), source root is the project root one level above electron/
// In a packaged .app, the bundled HTML lives inside the asar/resources. To support
// hot-reload from a real source folder, allow user to point at it via a config file.
const CONFIG_DIR = path.join(os.homedir(), '.career-ai-explorer');
const CONFIG_FILE = path.join(CONFIG_DIR, 'source-path');

function readSourcePathConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const p = fs.readFileSync(CONFIG_FILE, 'utf8').trim();
      if (p && fs.existsSync(p)) return p;
    }
  } catch {}
  return null;
}

function writeSourcePathConfig(p) {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, p, 'utf8');
  } catch (e) {
    console.warn('[main] failed to save source path config:', e.message);
  }
}

function resolveRoot() {
  if (!app.isPackaged) {
    return path.resolve(__dirname, '..');
  }
  const configured = readSourcePathConfig();
  if (configured) return configured;

  // First-run prompt
  const choice = dialog.showMessageBoxSync({
    type: 'question',
    buttons: ['Pick source folder…', 'Use bundled (no hot reload)', 'Cancel'],
    defaultId: 0,
    cancelId: 2,
    title: 'Career AI Explorer — first launch',
    message: 'Where should the app load files from?',
    detail:
      'Pick your project source folder to enable hot reload (edits to HTML/JS appear live).\n\n' +
      'Or use the bundled snapshot inside the app (no hot reload).',
  });

  if (choice === 0) {
    const picked = dialog.showOpenDialogSync({
      title: 'Select Career AI Explorer source folder',
      properties: ['openDirectory'],
    });
    if (picked && picked[0]) {
      writeSourcePathConfig(picked[0]);
      return picked[0];
    }
  }
  // Fall back to bundled
  return path.resolve(__dirname, '..');
}

const ROOT = resolveRoot();
console.log('[main] root:', ROOT);

// ---------- server lifecycle ----------
function pingHealth() {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_URL, (res) => {
      res.resume();
      resolve(res.statusCode && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await pingHealth()) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

function startServer() {
  const serverEntry = path.join(ROOT, 'server', 'index.js');
  if (!fs.existsSync(serverEntry)) {
    console.warn('[main] server entry not found:', serverEntry);
    return null;
  }

  // GUI-launched .app processes don't inherit the user's shell PATH, so a bare
  // "node" spawn fails with ENOENT. Use Electron's bundled Node by spawning
  // process.execPath (the Electron binary) with ELECTRON_RUN_AS_NODE=1 — that
  // makes it behave exactly like `node`. Works whether packaged or `npm run app`.
  const proc = spawn(process.execPath, ['server/index.js'], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: SERVER_PORT,
      ELECTRON_RUN_AS_NODE: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  proc.on('error', (err) => {
    console.error('[main] failed to spawn server:', err.message);
  });
  proc.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
  proc.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  proc.on('exit', (code, sig) => {
    console.log(`[server] exited code=${code} sig=${sig}`);
  });
  return proc;
}

function stopServer() {
  // Only kill processes WE spawned. If serverProc is null, the daemon owns the
  // server and must keep running after the app quits.
  if (serverProc && !serverProc.killed) {
    try { serverProc.kill('SIGTERM'); } catch {}
  }
  serverProc = null;
}

async function restartServer() {
  stopServer();
  await new Promise((r) => setTimeout(r, 150));
  serverProc = startServer();
  await waitForServer(8000);
}

// ---------- window ----------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Career AI Explorer',
    backgroundColor: '#0a1d3d',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const entry = path.join(ROOT, 'constellation.html');
  mainWindow.loadFile(entry);

  // Open external http(s) links in the system browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---------- hot reload ----------
function setupHotReload() {
  if (process.env.NODE_ENV === 'production' && !app.isPackaged) return;
  // Default: enabled even when packaged (user explicitly wants this).

  const paths = [
    path.join(ROOT, '*.html'),
    path.join(ROOT, 'server', '**', '*.js'),
  ];
  watcher = chokidar.watch(paths, {
    ignored: /node_modules/,
    ignoreInitial: true,
  });

  const debounceReload = (file) => {
    if (reloadTimer) clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => {
      console.log(`[hot] reloaded (html): ${file}`);
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.reload();
    }, 200);
  };

  watcher.on('change', async (file) => {
    if (file.endsWith('.html')) {
      debounceReload(file);
    } else if (file.includes(path.sep + 'server' + path.sep) && file.endsWith('.js')) {
      console.log(`[hot] server file changed: ${file} — restarting server`);
      await restartServer();
      console.log('[hot] reloaded (server):', file);
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.reload();
    }
  });

  watcher.on('error', (err) => console.warn('[hot] watcher error:', err.message));
}

// ---------- app lifecycle ----------
app.whenReady().then(async () => {
  // If a daemon (LaunchAgent) is already serving /health, skip spawning our own.
  const alreadyUp = await pingHealth();
  if (alreadyUp) {
    console.log('[main] server already running (LaunchAgent) — skipping spawn');
    serverProc = null;
  } else {
    serverProc = startServer();
    const ok = await waitForServer(10000);
    if (!ok) console.warn('[main] server did not respond to /health within 10s — opening window anyway');
  }
  createWindow();
  setupHotReload();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (watcher) watcher.close();
  stopServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (watcher) watcher.close();
  stopServer();
});
