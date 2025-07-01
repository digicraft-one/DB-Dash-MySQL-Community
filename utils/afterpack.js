const fs = require("fs-extra");
const path = require("path");

module.exports = async function afterPack(context) {
    const appPath = context.appOutDir;

    const pathsToRemove = [
        // Frontend junk
        "resources/app/frontend/logs",
        "resources/app/frontend/.gitignore",
        "resources/app/frontend/package-lock.json",
        "resources/app/frontend/eslint.config.js",
        "resources/app/frontend/README.md",
        "resources/app/frontend/.prettierrc",

        // Backend junk
        "resources/app/backend/logs",
        "resources/app/backend/.gitignore",
        "resources/app/backend/package-lock.json",

        // Root junk
        "resources/app/.gitignore",
        "resources/app/.prettierrc",
        "resources/app/package-lock.json",

        // Any loose logs
        "resources/app/*.log",
        "resources/app/utils/afterpack.js",
    ];

    for (const relativePath of pathsToRemove) {
        const fullPath = path.join(appPath, relativePath);
        try {
            await fs.remove(fullPath);
            console.log(`Removed: ${relativePath}`);
        } catch (err) {
            console.warn(`Failed to remove ${relativePath}: ${err.message}`);
        }
    }
};
