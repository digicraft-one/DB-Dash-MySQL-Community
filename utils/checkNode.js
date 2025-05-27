const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const { dialog, BrowserWindow } = require('electron');
const https = require('https');
const fs = require('fs');
const { app } = require('electron');

// Custom styling for dialog boxes
const dialogStyles = {
  info: {
    type: 'info',
    icon: path.join(__dirname, 'assets', 'info-icon.png'),
    buttons: ['OK'],
    defaultId: 0,
    noLink: true
  },
  warning: {
    type: 'warning',
    icon: path.join(__dirname, 'assets', 'warning-icon.png'),
    buttons: ['Install Node.js', 'Cancel'],
    defaultId: 0,
    cancelId: 1,
    noLink: true
  },
  error: {
    type: 'error',
    icon: path.join(__dirname, 'assets', 'error-icon.png'),
    buttons: ['OK'],
    defaultId: 0,
    noLink: true
  }
};

// Progress window for installation
let progressWindow;

function createProgressWindow() {
  progressWindow = new BrowserWindow({
    width: 400,
    height: 200,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true
    },
    frame: false,
    transparent: true,
    show: false
  });

  progressWindow.loadFile(path.join(__dirname, 'progress-window.html'));
  progressWindow.on('ready-to-show', () => progressWindow.show());
  return progressWindow;
}

function isNodeInstalled() {
  try {
    const version = execSync('node -v', { stdio: 'pipe' })
      .toString()
      .trim();
    // console.log(`Node.js detected: ${version}`);
    return true;
  } catch (err) {
    // console.log('Node.js not detected');
    return false;
  }
}

async function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloaded = 0;
      
      response.on('data', (chunk) => {
        downloaded += chunk.length;
        const progress = Math.round((downloaded / totalSize) * 100);
        if (progressWindow) {
          progressWindow.webContents.send('download-progress', progress);
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlinkSync(destination);
      reject(err);
    });
  });
}

async function installNodeSilently(mainWindow) {
  const platform = os.platform();

  if (platform !== 'win32') {
    throw new Error('Automatic installation currently only supported for Windows.');
  }

  const installerUrl = 'https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi';
  const downloadPath = path.join(os.tmpdir(), 'node-installer.msi');
  const progressWindow = createProgressWindow();

  try {
    // Show download progress
    progressWindow.webContents.send('update-message', 'Downloading Node.js installer...');
    
    // Download the installer
    await downloadFile(installerUrl, downloadPath);
    
    // Show installation progress
    progressWindow.webContents.send('update-message', 'Installing Node.js...');
    progressWindow.webContents.send('download-progress', 100);

    // Execute installation
    execSync(`msiexec /i "${downloadPath}" /quiet /norestart`, { stdio: 'ignore' });
    
    // Clean up
    fs.unlinkSync(downloadPath);
    progressWindow.close();
    
    return true;
  } catch (err) {
    progressWindow.close();
    throw err;
  }
}

async function ensureNodeExists(mainWindow) {
  if (isNodeInstalled()) return true;

  const response = dialog.showMessageBoxSync(mainWindow, {
    ...dialogStyles.warning,
    title: 'Node.js Required',
    message: 'Node.js Installation Required',
    detail: 'This application requires Node.js to function properly.\n\n' +
      'Node.js was not detected on your system. Would you like to install it automatically?',
    checkboxLabel: 'Set Node.js in system PATH',
    checkboxChecked: true
  });

  if (response === 0) {
    try {
      await installNodeSilently(mainWindow);
      
      dialog.showMessageBoxSync(mainWindow, {
        ...dialogStyles.info,
        title: 'Installation Complete',
        message: 'Node.js Installed Successfully',
        detail: 'Node.js has been installed successfully.\n\n' +
          'Please restart the application to complete the setup.'
      });
      
      app.quit();
    } catch (err) {
      dialog.showMessageBoxSync(mainWindow, {
        ...dialogStyles.error,
        title: 'Installation Failed',
        message: 'Node.js Installation Failed',
        detail: `Failed to install Node.js: ${err.message}\n\n` +
          'Please try installing Node.js manually from nodejs.org'
      });
      
      require('electron').shell.openExternal('https://nodejs.org');
      app.quit();
    }
  } else {
    app.quit();
  }
}

module.exports = { ensureNodeExists };