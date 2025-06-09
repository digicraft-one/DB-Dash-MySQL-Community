const { execSync } = require("child_process");
const path = require("path");
const os = require("os");
const { dialog, BrowserWindow, shell } = require("electron");
const https = require("https");
const fs = require("fs");
const { app } = require("electron");

function getResourcePath(subPath) {
    if (app.isPackaged) return path.join(process.resourcesPath, "app", subPath);
    else return path.join(__dirname, subPath);
}

// Custom styling for dialog boxes
const dialogStyles = {
    info: {
        type: "info",
        icon: getResourcePath(path.join("..", "assets", "info-icon.png")),
        buttons: ["OK"],
        defaultId: 0,
        noLink: true,
    },
    warning: {
        type: "warning",
        icon: getResourcePath(path.join("..", "assets", "warning-icon.png")),
        buttons: ["Install Node.js", "Cancel"],
        defaultId: 0,
        cancelId: 1,
        noLink: true,
    },
    error: {
        type: "error",
        icon: getResourcePath(path.join("..", "assets", "error-icon.png")),
        buttons: ["OK"],
        defaultId: 0,
        noLink: true,
    },
};

// Progress window for installation
let progressWindow;

function createProgressWindow() {
    progressWindow = new BrowserWindow({
        width: 450,
        height: 250,
        resizable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        frame: false,
        transparent: true,
        show: false,
        alwaysOnTop: true,
        parent: BrowserWindow.getFocusedWindow(),
        modal: true,
    });

    progressWindow.loadFile(getResourcePath(path.join("progress-window.html")));
    progressWindow.on("ready-to-show", () => progressWindow.show());
    return progressWindow;
}

function isNodeInstalled(logger) {
    try {
        const version = execSync("node -v", { stdio: "pipe" })
            .toString()
            .trim();

        logger.info("system", `Nodejs detected: ${version}`);
        return true;
    } catch (err) {
        logger.info("system", `Nodejs not detected.`);
        return false;
    }
}

function getNodeDownloadInfo() {
    const platform = os.platform();
    const arch = os.arch();
    const version = "v22.16.0";

    let downloadUrl, filename, installCommand;

    switch (platform) {
        case "win32":
            const windowsArch = arch === "x64" ? "x64" : "x86";
            filename = `node-${version}-${windowsArch}.msi`;
            downloadUrl = `https://nodejs.org/dist/${version}/${filename}`;
            installCommand = (filePath) =>
                `msiexec /i "${filePath}" /quiet /norestart`;
            break;

        case "darwin":
            filename = `node-${version}.pkg`;
            downloadUrl = `https://nodejs.org/dist/${version}/${filename}`;
            installCommand = (filePath) =>
                `sudo installer -pkg "${filePath}" -target /`;
            break;

        case "linux":
            // For Linux, we'll download the tar.xz and extract to /usr/local
            const linuxArch = arch === "arm64" ? "arm64" : "x64";
            filename = `node-${version}-linux-${linuxArch}.tar.xz`;
            downloadUrl = `https://nodejs.org/dist/${version}/${filename}`;
            installCommand = (filePath) => {
                const extractPath = "/tmp/nodejs-install";
                return [
                    `mkdir -p ${extractPath}`,
                    `tar -xJf "${filePath}" -C ${extractPath} --strip-components=1`,
                    `sudo cp -r ${extractPath}/* /usr/local/`,
                    `sudo chown -R root:root /usr/local/bin/node /usr/local/bin/npm`,
                    `sudo chmod +x /usr/local/bin/node /usr/local/bin/npm`,
                    `rm -rf ${extractPath}`,
                ].join(" && ");
            };
            break;

        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }

    return { downloadUrl, filename, installCommand };
}

async function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);

        https
            .get(url, (response) => {
                // Handle redirects
                if (
                    response.statusCode >= 300 &&
                    response.statusCode < 400 &&
                    response.headers.location
                ) {
                    file.close();
                    fs.unlinkSync(destination);
                    return downloadFile(response.headers.location, destination)
                        .then(resolve)
                        .catch(reject);
                }

                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlinkSync(destination);
                    return reject(
                        new Error(
                            `HTTP ${response.statusCode}: ${response.statusMessage}`,
                        ),
                    );
                }

                const totalSize = parseInt(
                    response.headers["content-length"],
                    10,
                );
                let downloaded = 0;

                response.on("data", (chunk) => {
                    downloaded += chunk.length;
                    if (totalSize > 0) {
                        const progress = Math.round(
                            (downloaded / totalSize) * 100,
                        );
                        if (progressWindow && !progressWindow.isDestroyed()) {
                            progressWindow.webContents.send(
                                "download-progress",
                                progress,
                            );
                        }
                    }
                });

                response.pipe(file);

                file.on("finish", () => file.close(resolve));

                file.on("error", (err) => {
                    fs.unlinkSync(destination);
                    reject(err);
                });
            })
            .on("error", (err) => {
                if (fs.existsSync(destination)) fs.unlinkSync(destination);
                reject(err);
            });
    });
}

async function installNodeSilently(mainWindow) {
    const platform = os.platform();
    const { downloadUrl, filename, installCommand } = getNodeDownloadInfo();

    const downloadPath = path.join(os.tmpdir(), filename);
    const progressWindow = createProgressWindow();

    try {
        // Show download progress
        progressWindow.webContents.send(
            "update-message",
            "Downloading Node.js installer...",
        );

        // Download the installer
        await downloadFile(downloadUrl, downloadPath);

        // Show installation progress
        progressWindow.webContents.send(
            "update-message",
            "Installing Node.js...",
        );
        progressWindow.webContents.send("download-progress", 100);

        // Execute installation based on platform
        if (platform === "darwin") {
            // macOS requires user permission for sudo
            progressWindow.webContents.send(
                "update-message",
                "Please enter your password when prompted...",
            );

            // Use osascript to show a proper password dialog
            const script = `do shell script "${installCommand(
                downloadPath,
            )}" with administrator privileges`;
            execSync(`osascript -e '${script}'`, { stdio: "ignore" });
        } else if (platform === "linux") {
            // Linux installation
            progressWindow.webContents.send(
                "update-message",
                "Installing Node.js (may require sudo password)...",
            );

            // Check if we can use sudo without password, otherwise ask user
            try {
                execSync("sudo -n true", { stdio: "ignore" });
                execSync(installCommand(downloadPath), { stdio: "ignore" });
            } catch (err) {
                // If sudo requires password, we need to handle it differently
                const command = installCommand(downloadPath);
                execSync(command, { stdio: "inherit" });
            }
        } else {
            // Windows installation
            execSync(installCommand(downloadPath), { stdio: "ignore" });
        }

        // Clean up
        if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);

        if (progressWindow && !progressWindow.isDestroyed())
            progressWindow.close();

        return true;
    } catch (err) {
        if (progressWindow && !progressWindow.isDestroyed())
            progressWindow.close();

        // Clean up downloaded file on error
        if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);

        throw err;
    }
}

function getPlatformSpecificMessage() {
    const platform = os.platform();

    switch (platform) {
        case "darwin":
            return "You may be prompted to enter your administrator password during installation.";
        case "linux":
            return "You may be prompted to enter your sudo password during installation.";
        case "win32":
            return "The installation will proceed automatically.";
        default:
            return "Please follow the installation prompts.";
    }
}

async function ensureNodeExists(mainWindow, logger) {
    if (isNodeInstalled(logger)) return true;

    const platformMessage = getPlatformSpecificMessage();

    const response = dialog.showMessageBoxSync(mainWindow, {
        ...dialogStyles.warning,
        title: "Node.js Required",
        message: "Node.js Installation Required",
        detail:
            "This application requires Node.js to function properly.\n\n" +
            "Node.js was not detected on your system. Would you like to install it automatically?\n\n" +
            platformMessage,
        checkboxLabel: "Add Node.js to system PATH",
        checkboxChecked: true,
    });

    if (response === 0) {
        try {
            await installNodeSilently(mainWindow);

            // Verify installation
            if (isNodeInstalled()) {
                dialog.showMessageBoxSync(mainWindow, {
                    ...dialogStyles.info,
                    title: "Installation Complete",
                    message: "Node.js Installed Successfully",
                    detail:
                        "Node.js has been installed successfully!\n\n" +
                        "The application will now restart to complete the setup.",
                });

                // Restart the application
                app.relaunch();
                app.quit();
            } else {
                throw new Error(
                    "Installation completed but Node.js is still not detected",
                );
            }
        } catch (err) {
            logger.error(serverType, `Installation error : ${err}`);

            const errorMessage =
                err.message.includes("Permission denied") ||
                err.message.includes("EACCES")
                    ? "Installation failed due to insufficient permissions. Please try running as administrator or install Node.js manually."
                    : `Failed to install Node.js: ${err.message}`;

            dialog.showMessageBoxSync(mainWindow, {
                ...dialogStyles.error,
                title: "Installation Failed",
                message: "Node.js Installation Failed",
                detail:
                    `${errorMessage}\n\n` +
                    "Please try installing Node.js manually from nodejs.org",
            });

            shell.openExternal("https://nodejs.org");
            app.quit();
        }
    } else app.quit();
}

module.exports = { ensureNodeExists, isNodeInstalled };
