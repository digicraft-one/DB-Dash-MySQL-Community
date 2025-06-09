const { app, BrowserWindow, ipcMain, shell, Tray, Menu } = require("electron");
const { exec, fork } = require("child_process");
const path = require("path");
const fs = require("fs");
const configManager = require("./config/config-manager");
const { ensureNodeExists } = require("./utils/checkNode");

let mainWindow = null;
let tray = null;
let backendProcess = null;
let frontendProcess = null;

// --- Enhanced Logging System ---
const LOG_LEVELS = {
    ERROR: "ERROR",
    WARN: "WARN",
    INFO: "INFO",
    DEBUG: "DEBUG",
};

function formatLogMessage(level, server, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${server.toUpperCase()}]: ${message}`;
}

async function logMessage(level, server, message) {
    const formattedMessage = formatLogMessage(level, server, message);

    // Console logging
    switch (level) {
        case LOG_LEVELS.ERROR:
            console.error(formattedMessage);
            break;
        case LOG_LEVELS.WARN:
            console.warn(formattedMessage);
            break;
        case LOG_LEVELS.DEBUG:
            console.debug(formattedMessage);
            break;
        default:
            console.log(formattedMessage);
    }

    await Promise.resolve(setTimeout(() => {}, 1));
    // Send to renderer if available
    if (mainWindow && mainWindow.webContents && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("server-log", {
            server,
            message: `[${level}] ${message}`,
            level,
            timestamp: new Date().toISOString(),
        });
    }
}

// Convenience logging functions
const logger = {
    error: (server, message) => logMessage(LOG_LEVELS.ERROR, server, message),
    warn: (server, message) => logMessage(LOG_LEVELS.WARN, server, message),
    info: (server, message) => logMessage(LOG_LEVELS.INFO, server, message),
    debug: (server, message) => logMessage(LOG_LEVELS.DEBUG, server, message),
};

// --- Process Management Functions ---
function killProcessOnPort(port) {
    return new Promise((resolve) => {
        logger.info("system", `Attempting to kill processes on port ${port}`);

        if (process.platform === "win32") {
            exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
                if (error) {
                    logger.debug(
                        "system",
                        `No processes found on port ${port}`,
                    );
                    resolve();
                    return;
                }

                if (stdout && stdout.trim()) {
                    const lines = stdout.trim().split("\n");
                    const killPromises = lines
                        .filter(
                            (line) =>
                                line.includes(`:${port} `) ||
                                line.includes(`:${port}\t`),
                        )
                        .map((line) => {
                            const parts = line.trim().split(/\s+/);
                            const pid = parts[parts.length - 1];
                            if (pid && pid !== "0" && !isNaN(pid)) {
                                return new Promise((res) => {
                                    exec(`taskkill /F /PID ${pid}`, (err) => {
                                        if (!err) {
                                            logger.info(
                                                "system",
                                                `Killed process ${pid} on port ${port}`,
                                            );
                                        } else {
                                            logger.debug(
                                                "system",
                                                `Process ${pid} already terminated`,
                                            );
                                        }
                                        res();
                                    });
                                });
                            }
                            return Promise.resolve();
                        });

                    if (killPromises.length > 0) {
                        Promise.all(killPromises).then(() => {
                            // Wait a moment for ports to be fully released
                            setTimeout(resolve, 1000);
                        });
                    } else {
                        resolve();
                    }
                } else {
                    logger.debug(
                        "system",
                        `No processes found using port ${port}`,
                    );
                    resolve();
                }
            });
        } else {
            exec(`lsof -ti tcp:${port}`, (error, stdout) => {
                if (error) {
                    logger.debug(
                        "system",
                        `No processes found on port ${port}`,
                    );
                    resolve();
                    return;
                }

                if (stdout && stdout.trim()) {
                    const pids = stdout
                        .trim()
                        .split("\n")
                        .filter((pid) => pid && !isNaN(pid));
                    if (pids.length > 0) {
                        const killPromises = pids.map((pid) => {
                            return new Promise((res) => {
                                exec(`kill -9 ${pid}`, (err) => {
                                    if (!err) {
                                        logger.info(
                                            "system",
                                            `Killed process ${pid} on port ${port}`,
                                        );
                                    } else {
                                        logger.debug(
                                            "system",
                                            `Process ${pid} already terminated`,
                                        );
                                    }
                                    res();
                                });
                            });
                        });
                        Promise.all(killPromises).then(() => {
                            // Wait a moment for ports to be fully released
                            setTimeout(resolve, 1000);
                        });
                    } else {
                        resolve();
                    }
                } else {
                    logger.debug(
                        "system",
                        `No processes found using port ${port}`,
                    );
                    resolve();
                }
            });
        }
    });
}

function killProcessTree(pid) {
    return new Promise((resolve) => {
        if (!pid) {
            resolve();
            return;
        }

        logger.info("system", `Terminating process tree for PID ${pid}`);

        if (process.platform === "win32") {
            exec(`taskkill /F /T /PID ${pid}`, (error) => {
                if (!error) {
                    logger.info(
                        "system",
                        `Successfully terminated process tree for PID ${pid}`,
                    );
                } else {
                    logger.debug(
                        "system",
                        `Process ${pid} was already terminated`,
                    );
                }
                // Wait for process cleanup
                setTimeout(resolve, 500);
            });
        } else {
            // First get all child processes
            exec(`pgrep -P ${pid}`, (error, stdout) => {
                const children = stdout
                    ? stdout
                          .trim()
                          .split("\n")
                          .filter((child) => child && !isNaN(child))
                    : [];

                // Kill children first
                const killPromises = children.map((childPid) => {
                    return new Promise((res) => {
                        exec(`kill -TERM ${childPid}`, (err) => {
                            // Give process time to terminate gracefully
                            setTimeout(() => {
                                exec(`kill -9 ${childPid}`, () => res());
                            }, 1000);
                        });
                    });
                });

                Promise.all(killPromises).then(() => {
                    // Now kill the parent process
                    exec(`kill -TERM ${pid}`, (err) => {
                        // Give process time to terminate gracefully
                        setTimeout(() => {
                            exec(`kill -9 ${pid}`, (finalErr) => {
                                if (!finalErr) {
                                    logger.info(
                                        "system",
                                        `Successfully terminated process ${pid}`,
                                    );
                                } else {
                                    logger.debug(
                                        "system",
                                        `Process ${pid} was already terminated`,
                                    );
                                }
                                resolve();
                            });
                        }, 1000);
                    });
                });
            });
        }
    });
}

// --- Helper Functions ---
function getAppIconPath() {
    const base = path.join(__dirname, "assets", "icons", "icon");
    if (process.platform === "win32") return `${base}.ico`;
    if (process.platform === "darwin") return `${base}.icns`;
    return `${base}.png`;
}

function getResourcePath(subPath) {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, "app", subPath);
    } else {
        return path.join(__dirname, subPath);
    }
}

// --- Window Management ---
function createOrShowMainWindow() {
    if (mainWindow && !mainWindow.isDestroyed()) {
        logger.debug(
            "system",
            "Main window already exists, showing and focusing",
        );
        mainWindow.show();
        mainWindow.focus();
        return;
    }

    logger.info("system", "Creating new main window");

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        frame: false,
        titleBarStyle: "hidden",
        icon: getAppIconPath(),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: true,
        },
        show: false,
    });

    const htmlPath = getResourcePath("dashboard.html");
    logger.debug("system", `Loading dashboard from: ${htmlPath}`);
    mainWindow.loadFile(htmlPath);

    mainWindow.once("ready-to-show", () => {
        logger.info("system", "Dashboard loaded successfully");
        mainWindow.show();

        // Send initial server statuses
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("server-status", {
                server: "backend",
                isRunning: !!backendProcess,
            });
            mainWindow.webContents.send("server-status", {
                server: "frontend",
                isRunning: !!frontendProcess,
            });
            logger.debug("system", "Sent initial server status to renderer");
        }
    });

    mainWindow.on("close", (event) => {
        if (!app.isQuitting) {
            logger.debug(
                "system",
                "Main window close prevented, hiding instead",
            );
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on("closed", () => {
        logger.info("system", "Main window closed");
        mainWindow = null;
    });
}

// --- Tray Management ---
function createTray() {
    const iconPath = getAppIconPath();
    logger.info("system", `Creating system tray with icon: ${iconPath}`);

    try {
        if (!fs.existsSync(iconPath)) {
            throw new Error(`Icon not found: ${iconPath}`);
        }
        tray = new Tray(iconPath);
        logger.info("system", "System tray created successfully");
    } catch (error) {
        logger.error("system", `Failed to create tray icon: ${error.message}`);
        return;
    }

    const contextMenu = Menu.buildFromTemplate([
        { label: "Show Dashboard", click: () => createOrShowMainWindow() },
        { type: "separator" },
        {
            label: "Quit",
            click: () => {
                app.isQuitting = true;
                quitApplication();
            },
        },
    ]);

    tray.setToolTip("DBDash Community");
    tray.setContextMenu(contextMenu);

    tray.on("click", () => {
        if (mainWindow?.isVisible?.() && !mainWindow.isDestroyed?.()) {
            mainWindow.hide();
        } else {
            createOrShowMainWindow();
        }
    });
}

// --- Server Management ---
async function startServer(serverType) {
    const isDev = !app.isPackaged;
    logger.info(
        "system",
        `Starting ${serverType} server in ${
            isDev ? "development" : "production"
        } mode`,
    );

    // Validation checks
    if (serverType === "backend" && backendProcess) {
        logger.warn("backend", "Backend server is already running");
        return;
    }

    if (serverType === "frontend") {
        if (!backendProcess) {
            logger.error(
                "frontend",
                "Cannot start frontend: Backend server must be running first",
            );
            return;
        }
        if (frontendProcess) {
            logger.warn("frontend", "Frontend server is already running");
            return;
        }
    }

    try {
        const config = configManager.loadConfig(serverType);
        if (!config) {
            logger.error(serverType, "Failed to load configuration");
            return;
        }

        const serverSourcePath = getResourcePath(serverType);
        const logDir = app.isPackaged
            ? path.join(process.resourcesPath, "app", serverType, "logs")
            : path.join(__dirname, serverType, "logs");
        const logFilePath = path.join(logDir, "server.log");

        logger.info(
            serverType,
            `Starting ${config.name} server on port ${config.port}...`,
        );

        // Ensure port is available
        await killProcessOnPort(config.port);
        logger.info(serverType, `Port ${config.port} is now available`);

        // Setup logging
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
            logger.debug(serverType, `Created log directory: ${logDir}`);
        }

        // Ensure log file exists
        if (!fs.existsSync(logFilePath)) {
            fs.writeFileSync(logFilePath, "");
        }
        const logStream = fs.createWriteStream(logFilePath, { flags: "a" });

        let newProcess = null;

        if (serverType === "backend") {
            const backendScriptPath = getResourcePath(
                path.join("backend", "index.js"),
            );
            const backendCwd = getResourcePath("backend");

            if (!fs.existsSync(backendScriptPath)) {
                logger.error(
                    "backend",
                    `Backend script not found at ${backendScriptPath}`,
                );
                logStream.end();
                return;
            }

            const env = {
                ...process.env,
                PORT: config.port.toString(),
                NODE_ENV: isDev ? "development" : "production",
            };

            logger.debug(
                "backend",
                `Forking backend process: ${backendScriptPath}`,
            );
            newProcess = fork(backendScriptPath, [], {
                cwd: backendCwd,
                silent: true,
                env: env,
            });

            backendProcess = newProcess;
        } else if (serverType === "frontend") {
            const backendConfig = configManager.loadConfig("backend");
            const actualBackendUrl = `http://${backendConfig.host}:${backendConfig.port}`;

            if (!fs.existsSync(path.join(serverSourcePath, "package.json"))) {
                logger.error(
                    "frontend",
                    `Frontend package.json not found in ${serverSourcePath}`,
                );
                logStream.end();
                return;
            }

            const env = {
                ...process.env,
                PORT: config.port.toString(),
                ACTUAL_BACKEND_URL: actualBackendUrl,
                NODE_ENV: isDev ? "development" : "production",
            };

            logger.debug(
                "frontend",
                `Starting frontend in: ${serverSourcePath}`,
            );
            logger.debug("frontend", `Backend URL: ${actualBackendUrl}`);

            newProcess = exec("npm run dev", {
                cwd: serverSourcePath,
                env: env,
            });

            frontendProcess = newProcess;
        }

        if (!newProcess) {
            logger.error(serverType, "Failed to create server process");
            logStream.end();
            return;
        }

        logger.info(
            serverType,
            `Server process started with PID: ${newProcess.pid}`,
        );

        // Setup process logging with better error handling
        const streamLogs = (stream, prefix) => {
            if (!stream) return;

            stream.on("data", (data) => {
                const message = data.toString().trim();
                if (message) {
                    const timestamp = new Date().toISOString();
                    const logEntry = `[${timestamp}] ${prefix}${message}\n`;

                    // Safely write to log
                    try {
                        logStream.write(logEntry);
                    } catch (err) {
                        console.error(
                            `Log write error for ${serverType}:`,
                            err.message,
                        );
                    }

                    // Send to renderer with error level detection
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        const isError =
                            message.toLowerCase().includes("error") ||
                            message.toLowerCase().includes("failed") ||
                            prefix.includes("STDERR");

                        mainWindow.webContents.send("server-log", {
                            server: serverType,
                            message: message.trim(),
                            level: isError ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO,
                            timestamp: timestamp,
                        });
                    }
                }
            });
        };

        streamLogs(newProcess.stdout, "STDOUT: ");
        streamLogs(newProcess.stderr, "STDERR: ");

        // Enhanced error handling
        newProcess.on("error", (error) => {
            logger.error(
                serverType,
                `Process error (PID: ${newProcess?.pid}): ${error.message}`,
            );

            try {
                logStream.write(
                    `[${new Date().toISOString()}] PROCESS ERROR: ${
                        error.message
                    }\n`,
                );
            } catch (logErr) {
                console.error(`Log write error: ${logErr.message}`);
            }

            // Cleanup process references
            if (serverType === "backend") {
                backendProcess = null;
            } else if (serverType === "frontend") {
                frontendProcess = null;
            }

            // Update UI status
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send("server-status", {
                    server: serverType,
                    isRunning: false,
                    error: error.message,
                });
            }

            logStream.end();
        });

        // Enhanced exit handling
        newProcess.on("close", (code, signal) => {
            const pid = newProcess?.pid || "unknown";
            const exitReason = signal ? `signal ${signal}` : `code ${code}`;

            logger.info(serverType, `Process ${pid} exited with ${exitReason}`);

            try {
                logStream.write(
                    `[${new Date().toISOString()}] Process ${pid} exited with ${exitReason}\n`,
                );
            } catch (logErr) {
                console.error(`Log write error: ${logErr.message}`);
            }

            logStream.end();

            // Handle cascading shutdowns
            if (serverType === "backend") {
                backendProcess = null;
                if (frontendProcess) {
                    logger.info(
                        "frontend",
                        "Backend stopped, stopping dependent frontend server",
                    );
                    stopServer("frontend", true);
                }
            } else if (serverType === "frontend") {
                frontendProcess = null;
            }

            // Update UI status
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send("server-status", {
                    server: serverType,
                    isRunning: false,
                });
            }
        });

        // Send initial status update
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("server-status", {
                server: serverType,
                isRunning: true,
            });
        }

        logger.info(
            serverType,
            `${config.name} started successfully on port ${config.port}`,
        );

        // Auto-open frontend in browser after ensuring it's ready
        if (serverType === "frontend") {
            setTimeout(() => {
                logger.info("frontend", "Auto-opening frontend in browser");
                openBrowser("frontend");
            }, 3000); // Increased delay to ensure server is fully ready
        }
    } catch (error) {
        logger.error(serverType, `Failed to start server: ${error.message}`);

        // Cleanup on failure
        if (serverType === "backend") {
            backendProcess = null;
        } else if (serverType === "frontend") {
            frontendProcess = null;
        }

        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("server-status", {
                server: serverType,
                isRunning: false,
                error: error.message,
            });
        }
    }
}

async function stopServer(serverType, triggeredByBackendStop = false) {
    let processToStop = null;
    let processName = "";

    if (serverType === "backend") {
        processToStop = backendProcess;
        processName = "Backend";
    } else if (serverType === "frontend") {
        processToStop = frontendProcess;
        processName = "Frontend";
    }

    if (!processToStop) {
        logger.debug(serverType, `${processName} server is not running`);
        return;
    }

    const pid = processToStop.pid;
    logger.info(serverType, `Stopping ${processName} server (PID: ${pid})`);

    try {
        // Kill the process tree
        await killProcessTree(pid);

        // Also kill any processes on the server's port as backup
        const config = configManager.loadConfig(serverType);
        if (config && config.port) {
            await killProcessOnPort(config.port);
        }

        // Clear process references
        if (serverType === "backend") {
            backendProcess = null;
            // If backend stops and we're not already handling cascade, stop frontend
            if (frontendProcess && !triggeredByBackendStop) {
                logger.info(
                    "frontend",
                    "Backend stopped, stopping dependent frontend server",
                );
                await stopServer("frontend", true);
            }
        } else if (serverType === "frontend") {
            frontendProcess = null;
        }

        // Update UI status
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("server-status", {
                server: serverType,
                isRunning: false,
            });
        }

        logger.info(serverType, `${processName} server stopped successfully`);
    } catch (error) {
        logger.error(
            serverType,
            `Error stopping ${processName} server: ${error.message}`,
        );

        // Force cleanup even on error
        if (serverType === "backend") {
            backendProcess = null;
        } else if (serverType === "frontend") {
            frontendProcess = null;
        }
    }
}

async function restartServer(serverType) {
    const isDev = !app.isPackaged;
    const isBackendRestart = serverType === "backend";
    const wasFrontendRunning = !!frontendProcess;

    logger.info(serverType, "Initiating server restart");

    try {
        // Stop the server first
        await stopServer(serverType);

        // Wait for cleanup
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Start the server
        await startServer(serverType);

        // Handle frontend restart if backend was restarted
        if (isBackendRestart && wasFrontendRunning) {
            logger.info(
                "frontend",
                "Restarting frontend due to backend restart",
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));

            if (isDev) {
                await restartServer("frontend");
            } else {
                // In production, frontend is served by backend, so just update status
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send("server-status", {
                        server: "frontend",
                        isRunning: !!backendProcess,
                    });
                }
            }
        }

        logger.info(serverType, "Server restart completed successfully");
    } catch (error) {
        logger.error(serverType, `Server restart failed: ${error.message}`);
    }
}

// --- Utility Functions ---
function openBrowser(serverType) {
    if (serverType === "frontend") {
        const shouldOpen =
            frontendProcess || (!app.isPackaged && backendProcess);

        if (shouldOpen) {
            const config = configManager.loadConfig("frontend");
            if (!config) {
                logger.error(
                    "frontend",
                    "Cannot open browser: Frontend configuration not found",
                );
                return;
            }

            const url = `http://${config.host}:${config.port}`;
            logger.info("frontend", `Opening browser at: ${url}`);

            shell.openExternal(url).catch((err) => {
                logger.error(
                    "frontend",
                    `Failed to open browser: ${err.message}`,
                );
            });
        } else {
            logger.warn(
                "frontend",
                "Cannot open browser: Frontend server is not running",
            );
        }
    } else {
        logger.warn(
            serverType,
            `Browser opening not supported for ${serverType}`,
        );
    }
}

function openConfigFile(serverType) {
    const configPath = configManager.getConfigPath(serverType);
    logger.info("system", `Opening config file: ${configPath}`);

    if (process.platform === "win32") {
        // Windows - force open in Notepad
        exec(`notepad "${configPath}"`, (err) => {
            if (err) {
                logger.error(
                    "system",
                    `Failed to open config file in Notepad: ${err.message}`,
                );
                // Fallback to default handler if Notepad fails
                shell.openPath(configPath).catch((fallbackErr) => {
                    logger.error(
                        "system",
                        `Fallback open failed: ${fallbackErr.message}`,
                    );
                });
            } else {
                logger.info("system", "Config file opened in Notepad");
            }
        });
    } else if (process.platform === "darwin") {
        // macOS - open with default text editor
        exec(`open "${configPath}"`, (err) => {
            if (err) {
                logger.error(
                    "system",
                    `Failed to open config file: ${err.message}`,
                );
            }
        });
    } else {
        // Linux - use xdg-open
        exec(`xdg-open "${configPath}"`, (err) => {
            if (err) {
                logger.error(
                    "system",
                    `Failed to open config file: ${err.message}`,
                );
            }
        });
    }
}

function openLogFile(serverType) {
    const logDir = app.isPackaged
        ? path.join(process.resourcesPath, "app", serverType, "logs")
        : path.join(__dirname, serverType, "logs");
    const logPath = path.join(logDir, "server.log");
    logger.info("system", `Opening log file: ${logPath}`);

    if (process.platform === "win32") {
        // Windows - force open in Notepad
        exec(`notepad "${logPath}"`, (err) => {
            if (err) {
                logger.error(
                    "system",
                    `Failed to open log file in Notepad: ${err.message}`,
                );
                // Fallback to default handler if Notepad fails
                shell.openPath(logPath).catch((fallbackErr) => {
                    logger.error(
                        "system",
                        `Fallback open failed: ${fallbackErr.message}`,
                    );
                });
            } else {
                logger.info("system", "Log file opened in Notepad");
            }
        });
    } else if (process.platform === "darwin") {
        // macOS - open with default text editor
        exec(`open "${logPath}"`, (err) => {
            if (err) {
                logger.error(
                    "system",
                    `Failed to open log file: ${err.message}`,
                );
            }
        });
    } else {
        // Linux - use xdg-open
        exec(`xdg-open "${logPath}"`, (err) => {
            if (err) {
                logger.error(
                    "system",
                    `Failed to open log file: ${err.message}`,
                );
            }
        });
    }
}

// --- Enhanced Application Shutdown ---
async function quitApplication() {
    logger.info("system", "Initiating graceful application shutdown");
    app.isQuitting = true;

    try {
        // Stop servers in proper order
        const shutdownPromises = [];

        if (frontendProcess) {
            logger.info("system", "Stopping frontend server during shutdown");
            shutdownPromises.push(stopServer("frontend", true));
        }

        if (backendProcess) {
            logger.info("system", "Stopping backend server during shutdown");
            shutdownPromises.push(stopServer("backend"));
        }

        // Wait for all servers to stop
        await Promise.all(shutdownPromises);

        // Clean up config manager
        try {
            configManager.cleanup();
            logger.info("system", "Configuration manager cleaned up");
        } catch (configError) {
            logger.warn(
                "system",
                `Config cleanup warning: ${configError.message}`,
            );
        }

        // Destroy tray
        if (tray && !tray.isDestroyed()) {
            tray.destroy();
            logger.info("system", "System tray destroyed");
        }

        // Close main window
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.destroy();
            logger.info("system", "Main window destroyed");
        }

        logger.info("system", "Graceful shutdown completed");

        // Final quit
        setTimeout(() => {
            app.quit();
        }, 500);
    } catch (error) {
        logger.error(
            "system",
            `Error during graceful shutdown: ${error.message}`,
        );

        // Force quit on error
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }
}

// --- Application Setup ---
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    logger.info("system", "Another instance is already running, quitting");
    app.quit();
} else {
    app.on("second-instance", (event, commandLine, workingDirectory) => {
        logger.info("system", "Second instance detected, focusing main window");
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            createOrShowMainWindow();
        }
    });

    app.whenReady().then(async () => {
        try {
            logger.info("system", "Application ready, initializing components");

            await ensureNodeExists(mainWindow, logger);
            configManager.initialize();

            configManager.on("configChanged", async (serverType) => {
                const isBackendChange = serverType === "backend";
                const backendRunning = !!backendProcess;
                const frontendRunning = !!frontendProcess;

                let restartInitiated = false;

                if (
                    (isBackendChange && backendRunning) ||
                    (!isBackendChange && frontendRunning)
                ) {
                    logger.info(
                        serverType,
                        "Configuration changed, restarting server",
                    );
                    await restartServer(serverType);
                    restartInitiated = true;
                }

                if (!restartInitiated) {
                    logger.info(
                        serverType,
                        "Configuration changed, changes will apply on next start",
                    );
                }
            });

            // Create application menu
            const menuTemplate = [
                ...(process.platform === "darwin"
                    ? [
                          {
                              label: app.name,
                              submenu: [
                                  { role: "about" },
                                  { type: "separator" },
                                  { role: "services" },
                                  { type: "separator" },
                                  { role: "hide" },
                                  { role: "hideOthers" },
                                  { role: "unhide" },
                                  { type: "separator" },
                                  {
                                      label: "Quit",
                                      accelerator: "CmdOrCtrl+Q",
                                      click: () => {
                                          app.isQuitting = true;
                                          quitApplication();
                                      },
                                  },
                              ],
                          },
                      ]
                    : []),
                {
                    label: "File",
                    submenu: [
                        process.platform === "darwin"
                            ? { role: "close" }
                            : {
                                  label: "Close Window",
                                  accelerator: "Alt+F4",
                                  click: () => mainWindow?.hide(),
                              },
                        {
                            label: "Quit",
                            accelerator: "CmdOrCtrl+Q",
                            click: () => {
                                app.isQuitting = true;
                                quitApplication();
                            },
                        },
                    ],
                },
                {
                    label: "Edit",
                    submenu: [
                        { role: "undo" },
                        { role: "redo" },
                        { type: "separator" },
                        { role: "cut" },
                        { role: "copy" },
                        { role: "paste" },
                        ...(process.platform === "darwin"
                            ? [
                                  { role: "pasteAndMatchStyle" },
                                  { role: "delete" },
                                  { role: "selectAll" },
                                  { type: "separator" },
                                  {
                                      label: "Speech",
                                      submenu: [
                                          { role: "startSpeaking" },
                                          { role: "stopSpeaking" },
                                      ],
                                  },
                              ]
                            : [
                                  { role: "delete" },
                                  { type: "separator" },
                                  { role: "selectAll" },
                              ]),
                    ],
                },
                {
                    label: "View",
                    submenu: [
                        { role: "reload" },
                        { role: "forceReload" },
                        { role: "toggleDevTools" },
                        { type: "separator" },
                        { role: "resetZoom" },
                        { role: "zoomIn" },
                        { role: "zoomOut" },
                        { type: "separator" },
                        { role: "togglefullscreen" },
                    ],
                },
                {
                    label: "Window",
                    submenu: [
                        { role: "minimize" },
                        { role: "zoom" },
                        ...(process.platform === "darwin"
                            ? [
                                  { type: "separator" },
                                  { role: "front" },
                                  { type: "separator" },
                                  { role: "window" },
                              ]
                            : [
                                  {
                                      label: "Hide",
                                      click: () => mainWindow?.hide(),
                                  },
                              ]),
                    ],
                },
                {
                    role: "help",
                    submenu: [
                        {
                            label: "Learn More",
                            click: async () => {
                                logger.info("system", "Help menu clicked");
                            },
                        },
                    ],
                },
            ];

            const menu = Menu.buildFromTemplate(menuTemplate);
            Menu.setApplicationMenu(menu);

            createTray();
            createOrShowMainWindow();

            app.on("activate", function () {
                if (BrowserWindow.getAllWindows().length === 0) {
                    createOrShowMainWindow();
                } else if (mainWindow) {
                    mainWindow.show();
                }
            });

            logger.info("system", "Application initialization complete");
        } catch (error) {
            logger.error("system", `Failed during startup: ${error.message}`);
            app.quit();
        }
    });

    app.on("window-all-closed", () => {
        // Don't quit on window close for any platform - let tray handle it
        logger.debug(
            "system",
            "All windows closed, keeping app running in tray",
        );
    });

    app.on("before-quit", async (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            logger.info(
                "system",
                "Quit requested, initiating graceful shutdown",
            );
            await quitApplication();
        }
    });
}

// --- IPC Handlers ---
ipcMain.on("minimize-window", () => {
    logger.debug("system", "Window minimize requested");
    mainWindow?.minimize();
});

ipcMain.on("maximize-restore-window", () => {
    if (mainWindow?.isMaximized()) {
        logger.debug("system", "Window restore requested");
        mainWindow.unmaximize();
    } else {
        logger.debug("system", "Window maximize requested");
        mainWindow?.maximize();
    }
});

ipcMain.on("close-window", async () => {
    logger.info("system", "Window close requested.");
    if (!app.isQuitting) mainWindow?.hide();
    else {
        await quitApplication();
    }
});

ipcMain.on("start-server", (event, serverType) => {
    logger.info("system", `Start server requested: ${serverType}`);
    startServer(serverType);
});

ipcMain.on("stop-server", (event, serverType) => {
    logger.info("system", `Stop server requested: ${serverType}`);
    stopServer(serverType);
});

ipcMain.on("open-browser", (event, serverType) => {
    logger.info("system", `Open browser requested: ${serverType}`);
    openBrowser(serverType);
});

ipcMain.on("open-config-file", (event, serverType) => {
    logger.info("system", `Open config file requested: ${serverType}`);
    openConfigFile(serverType);
});
ipcMain.on("open-log-file", (event, serverType) => {
    logger.info("system", `Open config file requested: ${serverType}`);
    openLogFile(serverType);
});
