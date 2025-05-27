const { ipcRenderer } = require('electron');
const Convert = require('ansi-to-html'); // Import the library

// DOM Elements & State
const backendStatusEl = document.getElementById('backend-status');
const frontendStatusEl = document.getElementById('frontend-status');
const backendStartBtn = document.getElementById('backend-start');
const backendStopBtn = document.getElementById('backend-stop');
const backendEditConfigBtn = document.getElementById('backend-edit-config');
const frontendStartBtn = document.getElementById('frontend-start');
const frontendStopBtn = document.getElementById('frontend-stop');
const frontendOpenBrowserBtn = document.getElementById('frontend-open-browser');
const frontendEditConfigBtn = document.getElementById('frontend-edit-config');
const backendLogs = document.getElementById('backend-logs');
const frontendLogs = document.getElementById('frontend-logs');
const backendClearLogBtn = document.getElementById('backend-clear-log');
const frontendClearLogBtn = document.getElementById('frontend-clear-log');

// Title Bar Controls
const minimizeBtn = document.getElementById('minimize-btn');
const maximizeBtn = document.getElementById('maximize-btn');
const closeBtn = document.getElementById('close-btn');

let isBackendRunning = false;
let isFrontendRunning = false;

// --- UI Update Logic --- 

// Main UI update function based on running states
function updateUI() {
    // Backend
    updateServerUI('backend', isBackendRunning);
    // Frontend
    updateServerUI('frontend', isFrontendRunning);
    // Special constraint: Disable frontend start if backend is not running
    frontendStartBtn.disabled = isFrontendRunning || !isBackendRunning;
    frontendStartBtn.title = !isBackendRunning ? 'Backend must be running first' : (isFrontendRunning ? 'Frontend is already running' : 'Start Frontend Server');
}

// Update UI for a specific server
function updateServerUI(server, isRunning) {
    const statusEl = server === 'backend' ? backendStatusEl : frontendStatusEl;
    const startBtn = server === 'backend' ? backendStartBtn : frontendStartBtn;
    const stopBtn = server === 'backend' ? backendStopBtn : frontendStopBtn;
    const editBtn = server === 'backend' ? backendEditConfigBtn : frontendEditConfigBtn;
    const openBrowserBtn = server === 'frontend' ? frontendOpenBrowserBtn : null;

    statusEl.textContent = isRunning ? 'Running' : 'Stopped';
    statusEl.className = `status status-${isRunning ? 'running' : 'stopped'}`;
    
    startBtn.disabled = isRunning;
    stopBtn.disabled = !isRunning;
    editBtn.disabled = isRunning; // Can't edit config while running

    // Enable/disable browser button for frontend
    if (server === 'frontend' && openBrowserBtn) {
        openBrowserBtn.disabled = !isRunning;
    }
}

// --- Logging --- 

// Create an instance of the converter
const convert = new Convert({
    fg: 'var(--log-text, #d4d4d4)', // Use CSS var with fallback
    bg: 'var(--log-bg, #2b2b2b)',
    newline: false,
    escapeXML: true,
    stream: true,
});

function addLog(server, message) {
    const logElement = server === 'backend' ? backendLogs : frontendLogs;
    if (!logElement) return; // Safety check

    const timestamp = new Date().toLocaleTimeString();
    const logEntryDiv = document.createElement('div'); // Renamed for clarity

    // Convert ANSI message content to HTML
    const rawMessage = String(message).trim();
    const htmlMessageContent = convert.toHtml(rawMessage);

    // Construct innerHTML with separate timestamp span
    logEntryDiv.innerHTML = `<span class="timestamp">[${timestamp}]</span><span class="log-content">${htmlMessageContent}</span>`;
    
    // Append and scroll
    const shouldScroll = logElement.scrollTop + logElement.clientHeight >= logElement.scrollHeight - 10; // Check if near bottom
    logElement.appendChild(logEntryDiv);
    if (shouldScroll) {
        logElement.scrollTop = logElement.scrollHeight;
    }
}

function clearLog(server) {
    const logElement = server === 'backend' ? backendLogs : frontendLogs;
    if(logElement) {
        logElement.innerHTML = ''; // Clear the content
    }
}

// --- Event Listeners --- 

// Server Control
backendStartBtn.addEventListener('click', () => ipcRenderer.send('start-server', 'backend'));
backendStopBtn.addEventListener('click', () => ipcRenderer.send('stop-server', 'backend'));
frontendStartBtn.addEventListener('click', () => ipcRenderer.send('start-server', 'frontend'));
frontendStopBtn.addEventListener('click', () => ipcRenderer.send('stop-server', 'frontend'));
frontendOpenBrowserBtn.addEventListener('click', () => ipcRenderer.send('open-browser', 'frontend'));

// Config Editing
backendEditConfigBtn.addEventListener('click', () => ipcRenderer.send('open-config-file', 'backend'));
frontendEditConfigBtn.addEventListener('click', () => ipcRenderer.send('open-config-file', 'frontend'));

// Log Clear Buttons
backendClearLogBtn.addEventListener('click', () => clearLog('backend'));
frontendClearLogBtn.addEventListener('click', () => clearLog('frontend'));

// Title Bar Window Controls
minimizeBtn.addEventListener('click', () => ipcRenderer.send('minimize-window'));
maximizeBtn.addEventListener('click', () => ipcRenderer.send('maximize-restore-window'));
closeBtn.addEventListener('click', () => ipcRenderer.send('close-window'));

// --- IPC Handlers from Main --- 

ipcRenderer.on('server-status', (event, { server, isRunning }) => {
    console.log(`Received status update: ${server} isRunning=${isRunning}`);
    if (server === 'backend') {
        isBackendRunning = isRunning;
    } else if (server === 'frontend') {
        isFrontendRunning = isRunning;
    }
    updateUI(); // Update the entire UI based on new state
});

ipcRenderer.on('server-log', (event, { server, message }) => {
    addLog(server, message);
});

// --- Initial Setup --- 

// Request initial statuses when the window loads
// The main process will send the current status upon window load
console.log('Dashboard JS loaded. UI will be updated upon receiving initial status.');
// Initial UI state (all stopped)
updateUI(); 