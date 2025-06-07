const { ipcRenderer } = require("electron");

// DOM Elements & State
const backendStatusEl = document.getElementById("backend-status");
const frontendStatusEl = document.getElementById("frontend-status");
const backendStartBtn = document.getElementById("backend-start");
const backendStopBtn = document.getElementById("backend-stop");
const backendEditConfigBtn = document.getElementById("backend-edit-config");
const frontendStartBtn = document.getElementById("frontend-start");
const frontendStopBtn = document.getElementById("frontend-stop");
const frontendOpenBrowserBtn = document.getElementById("frontend-open-browser");
const frontendEditConfigBtn = document.getElementById("frontend-edit-config");
const frontendOpenLogBtn = document.getElementById("frontend-open-logs");
const backendOpenLogBtn = document.getElementById("backend-open-logs");
const backendClearLogBtn = document.getElementById("backend-clear-log");
const frontendClearLogBtn = document.getElementById("frontend-clear-log");

// Title Bar Controls
const minimizeBtn = document.getElementById("minimize-btn");
const maximizeBtn = document.getElementById("maximize-btn");
const closeBtn = document.getElementById("close-btn");

let isBackendRunning = false;
let isFrontendRunning = false;

// --- UI Update Logic ---

// Main UI update function based on running states
function updateUI() {
    updateServerUI("backend", isBackendRunning);
    updateServerUI("frontend", isFrontendRunning);

    // Special constraint: Disable frontend start if backend is not running
    frontendStartBtn.disabled = isFrontendRunning || !isBackendRunning;
    frontendStartBtn.title = !isBackendRunning
        ? "Backend must be running first"
        : isFrontendRunning
        ? "Frontend is already running"
        : "Start Frontend Server";
}

// Update UI for a specific server with consistent titles
function updateServerUI(server, isRunning) {
    const elements = {
        statusEl: server === "backend" ? backendStatusEl : frontendStatusEl,
        startBtn: server === "backend" ? backendStartBtn : frontendStartBtn,
        stopBtn: server === "backend" ? backendStopBtn : frontendStopBtn,
        editBtn:
            server === "backend" ? backendEditConfigBtn : frontendEditConfigBtn,
        openBrowserBtn: server === "frontend" ? frontendOpenBrowserBtn : null,
        openLogBtn:
            server === "backend" ? backendOpenLogBtn : frontendOpenLogBtn,
    };

    const serverName = server.charAt(0).toUpperCase() + server.slice(1);

    // Update status
    elements.statusEl.textContent = isRunning ? "Running" : "Stopped";
    elements.statusEl.className = `status status-${
        isRunning ? "running" : "stopped"
    }`;

    // Update buttons with consistent titles
    elements.startBtn.disabled = isRunning;
    elements.startBtn.title = isRunning
        ? `${serverName} is already running`
        : `Start ${serverName} Server`;

    elements.stopBtn.disabled = !isRunning;
    elements.stopBtn.title = !isRunning
        ? `${serverName} is not running`
        : `Stop ${serverName} Server`;

    elements.editBtn.disabled = isRunning;
    elements.editBtn.title = isRunning
        ? `Cannot edit config while ${server} is running`
        : `Edit ${serverName} Configuration`;

    // Log button is always enabled
    elements.openLogBtn.title = `Open ${serverName} Log File`;
    elements.openLogBtn.disabled = false;

    // Browser button for frontend only
    if (elements.openBrowserBtn) {
        elements.openBrowserBtn.disabled = !isRunning;
        elements.openBrowserBtn.title = !isRunning
            ? "Frontend must be running to open browser"
            : "Open Frontend in Browser";
    }
}

// --- Optimized Logging ---

// Simplified ANSI to HTML converter
function ansiToHtml(str) {
    const colorMap = {
        30: "#586e75",
        31: "#ff6b6b",
        32: "#859900",
        33: "#feca57",
        34: "#54a0ff",
        35: "#d33682",
        36: "#2aa198",
        37: "#eee8d5",
        90: "#839496",
    };

    return str.replace(/\x1b\[(\d+)m/g, (match, code) => {
        if (code === "0") return "</span>";
        return colorMap[code] ? `<span style="color: ${colorMap[code]}">` : "";
    });
}

// Streamlined log entry creation
function addLog(server, message, level = "info") {
    const logElement = document.getElementById(`${server}-logs`);
    if (!logElement) return;

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement("div");
    logEntry.className = "log-entry";

    const levelBadge =
        level !== "info"
            ? `<span class="log-level level-${level}">${level.toUpperCase()}</span>`
            : "";

    logEntry.innerHTML = `
        <span class="timestamp">[${timestamp}]</span>
        ${levelBadge}
        <span class="log-content level-${level}">${ansiToHtml(
        String(message).trim(),
    )}</span>
    `;

    // Auto-scroll if near bottom
    const shouldScroll =
        logElement.scrollTop + logElement.clientHeight >=
        logElement.scrollHeight - 20;

    logElement.appendChild(logEntry);

    if (shouldScroll) logElement.scrollTop = logElement.scrollHeight;
}

function clearLog(server) {
    const logElement = document.getElementById(`${server}-logs`);
    if (logElement) logElement.innerHTML = "";
}

// --- Event Listeners ---

// Server Control
backendStartBtn.addEventListener("click", () =>
    ipcRenderer.send("start-server", "backend"),
);
backendStopBtn.addEventListener("click", () =>
    ipcRenderer.send("stop-server", "backend"),
);
frontendStartBtn.addEventListener("click", () =>
    ipcRenderer.send("start-server", "frontend"),
);
frontendStopBtn.addEventListener("click", () =>
    ipcRenderer.send("stop-server", "frontend"),
);
frontendOpenBrowserBtn.addEventListener("click", () =>
    ipcRenderer.send("open-browser", "frontend"),
);

// Config and Log Management
backendEditConfigBtn.addEventListener("click", () =>
    ipcRenderer.send("open-config-file", "backend"),
);
frontendEditConfigBtn.addEventListener("click", () =>
    ipcRenderer.send("open-config-file", "frontend"),
);
frontendOpenLogBtn.addEventListener("click", () =>
    ipcRenderer.send("open-log-file", "frontend"),
);
backendOpenLogBtn.addEventListener("click", () =>
    ipcRenderer.send("open-log-file", "backend"),
);

// Log Clear Buttons
backendClearLogBtn.addEventListener("click", () => clearLog("backend"));
frontendClearLogBtn.addEventListener("click", () => clearLog("frontend"));

// Add titles to clear buttons
backendClearLogBtn.title = "Clear Backend Logs";
frontendClearLogBtn.title = "Clear Frontend Logs";

// Title Bar Window Controls
minimizeBtn.addEventListener("click", () =>
    ipcRenderer.send("minimize-window"),
);
maximizeBtn.addEventListener("click", () =>
    ipcRenderer.send("maximize-restore-window"),
);
closeBtn.addEventListener("click", () => ipcRenderer.send("close-window"));

// Add titles to window controls
minimizeBtn.title = "Minimize Window";
maximizeBtn.title = "Maximize/Restore Window";
closeBtn.title = "Close Application";

// --- IPC Handlers from Main ---

ipcRenderer.on("server-status", (event, { server, isRunning }) => {
    console.log(`Received status update: ${server} isRunning=${isRunning}`);
    if (server === "backend") isBackendRunning = isRunning;
    else if (server === "frontend") isFrontendRunning = isRunning;
    updateUI();
});

ipcRenderer.on("server-log", (event, { server, message }) => {
    addLog(server, message);
});

// --- Initial Setup ---
console.log(
    "Dashboard JS loaded. UI will be updated upon receiving initial status.",
);
updateUI();
