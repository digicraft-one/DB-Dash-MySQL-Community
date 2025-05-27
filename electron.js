const { app, BrowserWindow, ipcMain, shell, Tray, Menu } = require('electron');
const { exec, fork } = require('child_process');
const path = require('path');
const fs = require('fs');
const configManager = require('./config/config-manager');
const { ensureNodeExists } = require('./utils/checkNode');

let mainWindow = null;
let tray = null;
let backendProcess = null;
let frontendProcess = null;

// --- Helper: Log to Renderer --- 
function logToRenderer(server, message) {
    if (mainWindow && mainWindow.webContents && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('server-log', { server, message });
    }
}

// --- Process Killing Functions (killProcessOnPort, killProcessTree) --- 
// Use logToRenderer instead of direct mainWindow access
function killProcessOnPort(port) {
    return new Promise((resolve) => {
        if (process.platform === 'win32') {
            exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
                if (stdout) {
                    const lines = stdout.trim().split('\n');
                    const killPromises = lines.map(line => {
                        if (line.includes(`:${port}`)) {
                            const parts = line.trim().split(/\s+/);
                            const pid = parts[parts.length - 1];
                            if (pid && pid !== '0') {
                                return new Promise(res => {
                                    exec(`taskkill /F /PID ${pid}`, (err) => {
                                        if (!err) {
                                            logToRenderer('system', `Killed process ${pid} using port ${port}`);
                                        }
                                        res();
                                    });
                                });
                            }
                        }
                        return Promise.resolve();
                    });
                    Promise.all(killPromises).then(resolve);
                } else {
                    resolve();
                }
            });
        } else {
            exec(`lsof -i tcp:${port} -t`, (error, stdout) => {
                if (stdout) {
                    const pids = stdout.trim().split('\n').filter(pid => pid);
                    const killPromises = pids.map(pid => {
                        return new Promise(res => {
                            exec(`kill -9 ${pid}`, (err) => {
                                if (!err) {
                                    logToRenderer('system', `Killed process ${pid} using port ${port}`);
                                }
                                res();
                            });
                        });
                    });
                    Promise.all(killPromises).then(resolve);
                } else {
                    resolve();
                }
            });
        }
    });
}

function killProcessTree(pid) {
    return new Promise((resolve) => {
        if (process.platform === 'win32') {
            exec(`taskkill /F /T /PID ${pid}`, (error) => {
                if (!error) {
                    logToRenderer('system', `Killed process tree for PID ${pid}`);
                }
                resolve();
            });
        } else {
            exec(`pgrep -P ${pid}`, (error, stdout) => {
                const children = stdout ? stdout.trim().split('\n') : [];
                const killPromises = children.map(childPid => {
                    return new Promise(res => exec(`kill -9 ${childPid}`, () => res()));
                });
                Promise.all(killPromises).then(() => {
                    exec(`kill -9 ${pid}`, (err) => {
                        if (!err) {
                            logToRenderer('system', `Killed parent process ${pid}`);
                        }
                        resolve();
                    });
                });
            });
        }
    });
}

// --- Helper: Get Platform-Specific App Icon ---
function getAppIconPath() {
    const base = path.join(__dirname, 'assets', 'icon');
    if (process.platform === 'win32') return `${base}.ico`;
    if (process.platform === 'darwin') return `${base}.icns`;
    return `${base}.png`;
}

// Helper to get correct resource path
function getResourcePath(subPath) {
    if (app.isPackaged) {
        // In packaged app, resources are typically in process.resourcesPath/app/
        return path.join(process.resourcesPath, 'app', subPath);
    } else {
        // In development, path is relative to project root
        return path.join(__dirname, subPath);
    }
}

// --- Window Creation --- 
function createOrShowMainWindow() {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
        return;
    }
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800, // Prevent making the window too small
        minHeight: 600,
        frame: false, // Remove default frame
        titleBarStyle: 'hidden', // Hides title bar but keeps controls on macOS (optional)
        icon: getAppIconPath(), // Set window icon
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: true // Enable DevTools (useful for debugging UI)
        },
        show: false,
    });
    mainWindow.loadFile('dashboard.html');
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        logToRenderer('system', 'Dashboard loaded. Sending initial server statuses.');
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('server-status', { server: 'backend', isRunning: !!backendProcess });
            mainWindow.webContents.send('server-status', { server: 'frontend', isRunning: !!frontendProcess });
        }
    });
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// --- Tray Creation --- 
function createTray() {
    const iconName = 'icon_default.png'; // Platform specific icon
    const iconPath = path.join(__dirname, 'assets', iconName);

    try {
        if (!fs.existsSync(iconPath)) {
            throw new Error(`Icon not found: ${iconPath}`);
        }
        tray = new Tray(iconPath);
    } catch (error) {
        console.error("Failed to create tray icon:", error);
        logToRenderer('system', `Error creating tray icon: ${error.message}. Using fallback.`);
        // Fallback needed - create a simple text-based tray if possible or handle error
        // For now, we might skip tray creation on error
        return; // Exit if tray can't be created
    }

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show Dashboard', click: () => createOrShowMainWindow() },
        { type: 'separator' },
        { label: 'Quit', click: () => { app.isQuitting = true; quitApplication(); } },
    ]);
    tray.setToolTip('Server Control Dashboard');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.isVisible() ? mainWindow.hide() : createOrShowMainWindow();
        } else {
            createOrShowMainWindow();
        }
    });
}

// --- Server Management --- 
async function startServer(serverType) {
    const isDev = !app.isPackaged;
    logToRenderer('system', `Running in ${isDev ? 'development' : 'packaged'} mode.`);

    if (serverType === 'frontend' && !backendProcess) {
        logToRenderer('frontend', 'Cannot start: Backend server must be running first.');
        return;
    }
    if ((serverType === 'backend' && backendProcess) || (serverType === 'frontend' && frontendProcess && isDev)) {
        logToRenderer(serverType, 'Server is already running.');
        return;
    }

    const config = configManager.loadConfig(serverType);
    // Use getResourcePath for consistency, though config/logs might need separate handling if outside 'app'
    // For now, assume config/logs are relative to project root / app root
    const serverSourcePath = getResourcePath(serverType);
    const logFilePath = configManager.getLogFilePath(serverType); // Assuming this resolves correctly relative to project/app root

    logToRenderer(serverType, `Attempting to start ${config.name} on port ${config.port}...`);

    await killProcessOnPort(config.port);
    logToRenderer(serverType, `Ensured port ${config.port} is free.`);

    // Ensure log directory exists (important for packaged app)
    const logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    fs.closeSync(fs.openSync(logFilePath, 'a'));
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

    let newProcess = null;

    if (serverType === 'backend') {
        // Use getResourcePath to find backend index.js and its CWD
        const backendScriptPath = getResourcePath(path.join('backend', 'index.js'));
        const backendCwd = getResourcePath('backend');
        logToRenderer('backend', `Starting backend via: node ${backendScriptPath}`);

        // Verify script exists
        if (!fs.existsSync(backendScriptPath)) {
            logToRenderer('backend', `ERROR: Backend script not found at ${backendScriptPath}`);
            return;
        }

        newProcess = fork(backendScriptPath, [], {
            cwd: backendCwd,
            silent: true,
        });

        backendProcess = newProcess;

    } else if (serverType === 'frontend') {
        if (isDev) {
            // --- Start Frontend Dev Server --- 
            logToRenderer('frontend', 'Starting frontend via: npm run dev');
            const backendConfig = configManager.loadConfig('backend');
            const actualBackendUrl = `http://${backendConfig.host}:${backendConfig.port}`;
            const env = { ...process.env, ACTUAL_BACKEND_URL: actualBackendUrl };
            logToRenderer('frontend', `Injecting ACTUAL_BACKEND_URL=${actualBackendUrl} into frontend dev process.`);
            newProcess = exec('npm run dev', { cwd: serverSourcePath, env: env }); // Use serverSourcePath for CWD
            frontendProcess = newProcess;
            // -----------------------------------
        } else {
            // --- Load Built Frontend --- 
            logToRenderer('frontend', 'Loading built frontend from filesystem...');

            // Calculate the expected path
            const relativeFrontendPath = path.join('frontend', 'dist', 'index.html');
            const frontendIndexPath = getResourcePath(relativeFrontendPath);

            // --- Add detailed logging --- 
            logToRenderer('frontend', `Calculated frontend index path: ${frontendIndexPath}`);
            console.log(`[Packaged Frontend Load] Calculated Path: ${frontendIndexPath}`); // Log to console too
            // ---------------------------

            if (!fs.existsSync(frontendIndexPath)) {
                logToRenderer('frontend', `ERROR: Built frontend index.html not found at specified path!`);
                console.error(`[Packaged Frontend Load] File not found: ${frontendIndexPath}`);
                return;
            }

            if (mainWindow && !mainWindow.isDestroyed()) {
                logToRenderer('frontend', `Attempting to load file: ${frontendIndexPath}`);
                mainWindow.loadFile(frontendIndexPath) // loadFile expects a path string
                    .then(() => {
                        logToRenderer('frontend', 'Built frontend loaded successfully via loadFile.');
                        console.log(`[Packaged Frontend Load] Success loading: ${frontendIndexPath}`);
                    })
                    .catch(err => {
                        logToRenderer('frontend', `Error loading frontend file: ${err}`);
                        console.error(`[Packaged Frontend Load] Error loading ${frontendIndexPath}:`, err);
                    });
                mainWindow.webContents.send('server-status', { server: 'frontend', isRunning: true });
            } else {
                logToRenderer('frontend', 'Cannot load frontend: Main window not available.');
            }
            return;
            // ---------------------------
        }
    }

    if (!newProcess) {
        logToRenderer(serverType, 'Failed to create server process.');
        return;
    }

    logToRenderer(serverType, `Starting process with PID ${newProcess.pid}...`);

    // --- Log Streaming --- 
    const streamLogs = (stream, prefix) => {
        if (!stream) return;
        stream.on('data', (data) => {
            const message = data.toString();
            const logEntry = `[${new Date().toISOString()}] ${prefix}${message}`;
            logStream.write(logEntry);
            logToRenderer(serverType, message.trim());
        });
    };
    streamLogs(newProcess.stdout, 'STDOUT: ');
    streamLogs(newProcess.stderr, 'STDERR: ');
    // -------------------

    // --- Process Event Handlers ---
    newProcess.on('error', (error) => {
        console.error(`Error executing ${serverType} process (${newProcess?.pid}):`, error);
        logToRenderer(serverType, `Process Error: ${error.message}`);
        logStream.write(`[${new Date().toISOString()}] PROCESS ERROR: ${error.message}\n`);
        if (serverType === 'backend') backendProcess = null;
        else if (serverType === 'frontend' && frontendProcess === newProcess) frontendProcess = null;

        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('server-status', { server: serverType, isRunning: false });
        }
        logStream.end();
    });

    newProcess.on('close', (code) => {
        const pid = newProcess?.pid || 'unknown';
        const message = `Process ${pid} exited with code ${code}.`;
        logToRenderer(serverType, message);
        logStream.write(`[${new Date().toISOString()}] ${message}\n`);
        logStream.end();
        if (serverType === 'backend' && backendProcess === newProcess) {
            backendProcess = null;
            // Stop frontend dev server if backend is stopped
            if (frontendProcess && !triggeredByBackendStop && isDev) {
                logToRenderer('frontend', 'Backend stopped. Stopping frontend dev server.');
                stopServer('frontend', true);
            } else if (!isDev) {
                // If backend stops in packaged mode, update frontend UI to stopped
                logToRenderer('frontend', 'Backend stopped. Updating frontend status.');
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('server-status', { server: 'frontend', isRunning: false });
                }
            }
        } else if (serverType === 'frontend' && frontendProcess === newProcess) {
            frontendProcess = null;
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('server-status', { server: serverType, isRunning: false });
        }
    });
    // -----------------------------

    // --- Final Status Update & Auto-Open --- 
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('server-status', { server: serverType, isRunning: true });
        logToRenderer(serverType, `${config.name} started successfully.`);
    }

    if (serverType === 'frontend' && isDev) {
        setTimeout(() => {
            logToRenderer('frontend', 'Attempting to automatically open frontend dev server in browser...');
            openBrowser('frontend');
        }, 1500);
    }
    // --------------------------------------
}

async function stopServer(serverType, triggeredByBackendStop = false) {
    const isDev = !app.isPackaged;
    let processToStop = null;

    if (serverType === 'backend') {
        processToStop = backendProcess;
    } else if (serverType === 'frontend' && isDev) {
        // Only manage frontend process in dev mode
        processToStop = frontendProcess;
    } else if (serverType === 'frontend' && !isDev) {
        // In packaged mode, stopping frontend just updates UI
        logToRenderer('frontend', 'Stopping frontend (UI state only).');
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('server-status', { server: 'frontend', isRunning: false });
            // Optionally clear the window or load a blank page
            // mainWindow.loadURL('about:blank'); 
        }
        return; // No process to kill
    }

    if (processToStop) {
        logToRenderer(serverType, `Stopping server process (PID: ${processToStop.pid})...`);
        try {
            await killProcessTree(processToStop.pid);

            if (serverType === 'backend') {
                backendProcess = null;
                // Stop frontend dev server if backend is stopped
                if (frontendProcess && !triggeredByBackendStop && isDev) {
                    logToRenderer('frontend', 'Backend stopped. Stopping frontend dev server.');
                    await stopServer('frontend', true);
                } else if (!isDev) {
                    // If backend stops in packaged mode, update frontend UI to stopped
                    logToRenderer('frontend', 'Backend stopped. Updating frontend status.');
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('server-status', { server: 'frontend', isRunning: false });
                    }
                }
            } else if (serverType === 'frontend') {
                frontendProcess = null;
            }

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('server-status', { server: serverType, isRunning: false });
                logToRenderer(serverType, 'Server process stopped completely.');
            }

        } catch (error) {
            logToRenderer(serverType, `Error stopping server process: ${error.message}`);
        }
    } else {
        logToRenderer(serverType, 'Server process is not running.');
    }
}

async function restartServer(serverType) {
    const isDev = !app.isPackaged;
    const isBackendRestart = serverType === 'backend';
    // In dev mode, check if frontend process exists. In prod, just check if backend exists (as FE depends on it)
    const wasFrontendEffectivelyRunning = isDev ? !!frontendProcess : !!backendProcess;

    logToRenderer(serverType, 'Attempting server restart...');

    await stopServer(serverType);

    await new Promise(resolve => setTimeout(resolve, 500));

    await startServer(serverType);

    // If backend restarted AND frontend was effectively running before, restart/reload frontend
    if (isBackendRestart && wasFrontendEffectivelyRunning) {
        logToRenderer('frontend', 'Backend restarted. Ensuring frontend is updated/restarted...');
        if (isDev) {
            await restartServer('frontend'); // Restart dev server process
        } else {
            // Reload the window to pick up changes if needed (or just rely on internal fetch)
            if (mainWindow && !mainWindow.isDestroyed()) {
                // mainWindow.webContents.reload(); // Optional: force reload frontend UI
                // Ensure UI status reflects frontend is "running" (loaded)
                mainWindow.webContents.send('server-status', { server: 'frontend', isRunning: true });
            }
        }
    }
}

// --- Utility Functions --- 
function openBrowser(serverType) {
    const isDev = !app.isPackaged;
    if (serverType === 'frontend') {
        if (isDev && frontendProcess) { // Dev mode, check process
            const url = configManager.getServerUrl(serverType);
            shell.openExternal(url);
        } else if (!isDev && backendProcess) { // Packaged mode, check backend allows frontend
            const url = configManager.getServerUrl(serverType);
            logToRenderer('frontend', `Cannot automatically open packaged frontend. Please navigate to the main window.`);
            // In packaged mode, the content is IN the main window, so opening externally doesn't make sense.
            // Maybe just focus the window?
            createOrShowMainWindow();
        } else {
            logToRenderer(serverType, 'Cannot open browser: Required server is not running.');
        }
    }
}

// function openConfigFile(serverType) {
//     const configPath = configManager.getConfigPath(serverType);
//     shell.openPath(configPath).catch(err => {
//         console.error(`Failed to open config file ${configPath}:`, err);
//         logToRenderer('system', `Failed to open config file: ${configPath}`);
//     });
// }
function openConfigFile(serverType) {
    const configPath = configManager.getConfigPath(serverType);
    
    exec(`notepad "${configPath}"`, (err) => {
        if (err) {
            console.error(`Failed to open config file ${configPath} in Notepad:`, err);
            logToRenderer('system', `Failed to open config file in Notepad: ${configPath}`);
        }
    });
}

// --- Application Lifecycle --- 
async function quitApplication() {
    console.log('Initiating application quit...');
    logToRenderer('system', 'Quitting application...');
    app.isQuitting = true; // Ensure flag is set
    configManager.cleanup();

    // Stop frontend first (if dependent)
    if (frontendProcess) await stopServer('frontend', true);
    // Then stop backend
    if (backendProcess) await stopServer('backend');

    console.log('Servers stopped.');
    if (tray) {
        tray.destroy();
    }
    app.quit();
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            createOrShowMainWindow();
        }
    });

app.whenReady().then(async() => {
    try {
        await ensureNodeExists(mainWindow);
    
    configManager.initialize();
    
    configManager.on('configChanged', async (serverType) => {
      const isBackendChange = serverType === 'backend';
      const backendRunning = !!backendProcess;
      const frontendRunning = !!frontendProcess;
      
      let restartInitiated = false;
      
      // Restart the changed server if it was running
      if ((isBackendChange && backendRunning) || (!isBackendChange && frontendRunning)) {
          logToRenderer(serverType, 'Configuration changed detected. Restarting server...');
          await restartServer(serverType);
          restartInitiated = true;
      }
       // If backend config changed AND frontend was running, restart frontend (handled within restartServer)
       // No need for extra logic here now
      
      if(!restartInitiated) {
          logToRenderer(serverType, 'Configuration changed detected. Changes will apply on next start.');
      }
    });
    
    // --- Create Application Menu --- 
    const menuTemplate = [
      // { role: 'appMenu' } // macOS only
      ...(process.platform === 'darwin' ? [{ 
        label: app.name, 
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => { app.isQuitting = true; quitApplication(); } }
        ]
      }] : []),
      // { role: 'fileMenu' }
      {
        label: 'File',
        submenu: [
          process.platform === 'darwin' ? { role: 'close' } : { label: 'Close Window', accelerator: 'Alt+F4', click: () => mainWindow?.hide() }, // Custom close/hide
          { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => { app.isQuitting = true; quitApplication(); } } // Ensure quit is available
        ]
      },
      // { role: 'editMenu' }
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          ...(process.platform === 'darwin' ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
              label: 'Speech',
              submenu: [
                { role: 'startSpeaking' },
                { role: 'stopSpeaking' }
              ]
            }
          ] : [
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' }
          ])
        ]
      },
      // { role: 'viewMenu' }
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      // { role: 'windowMenu' }
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' }, // Maximize/Restore
          ...(process.platform === 'darwin' ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ] : [
            { label: 'Hide', click: () => mainWindow?.hide() } // Custom Hide for non-mac
          ])
        ]
      },
      {
        role: 'help',
        submenu: [
          // Add relevant help links here if desired
          {
            label: 'Learn More (Placeholder)'
            // click: async () => { await shell.openExternal('https://electronjs.org') }
          }
        ]
      }
    ];

        const menu = Menu.buildFromTemplate(menuTemplate);
        Menu.setApplicationMenu(menu);
        // -------------------------------

        createTray();
        createOrShowMainWindow();

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createOrShowMainWindow();
      else if (mainWindow) mainWindow.show(); 
    });
    } catch (error) {
        console.error('Failed during startup:', error);
        app.quit();
    }
  });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            // Don't quit
        }
    });

    app.on('before-quit', async (event) => { // Make async
        if (!app.isQuitting) {
            event.preventDefault();
            // Initiate graceful quit when triggered externally (like Cmd+Q)
            await quitApplication();
        } else {
            console.log('Quit allowed via tray or explicit call.');
        }
    });
}

// --- Add IPC Handlers for Window Controls --- 
ipcMain.on('minimize-window', () => {
    mainWindow?.minimize();
});

ipcMain.on('maximize-restore-window', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});

ipcMain.on('close-window', () => {
    // Use the same logic as the window 'close' event
    if (!app.isQuitting) {
        mainWindow?.hide(); // Hide instead of closing
    } else {
        mainWindow?.close(); // Allow close if app is quitting
    }
});

// --- Existing IPC Handlers --- 
ipcMain.on('start-server', (event, serverType) => startServer(serverType));
ipcMain.on('stop-server', (event, serverType) => stopServer(serverType));
ipcMain.on('open-browser', (event, serverType) => openBrowser(serverType));
ipcMain.on('open-config-file', (event, serverType) => openConfigFile(serverType));
