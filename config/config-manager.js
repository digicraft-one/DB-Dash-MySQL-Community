const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class ConfigManager extends EventEmitter {
    constructor() {
        super();
        this.configDir = path.join(__dirname, '..', 'config');
        this.defaultConfigs = {
            backend: {
                port: 3001,
                host: 'localhost',
                logFile: 'backend/logs/server.log',
                name: 'Backend Server',
                description: 'Express.js Backend Server',
                env: 'development'
            },
            frontend: {
                port: 3000,
                host: 'localhost',
                logFile: 'frontend/logs/server.log',
                name: 'Frontend Server',
                description: 'Vite React Frontend Server',
                env: 'development',
                backendUrl: 'http://localhost:3001'
            }
        };
        this.watchers = {};
    }

    // Initialize configuration system
    initialize() {
        // Create config directory if it doesn't exist
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }

        // Create log directories
        const backendLogDir = path.join(__dirname, '..', 'backend', 'logs');
        const frontendLogDir = path.join(__dirname, '..', 'frontend', 'logs');
        
        if (!fs.existsSync(backendLogDir)) {
            fs.mkdirSync(backendLogDir, { recursive: true });
        }
        if (!fs.existsSync(frontendLogDir)) {
            fs.mkdirSync(frontendLogDir, { recursive: true });
        }

        // Initialize config files if they don't exist
        this.initializeConfig('backend');
        this.initializeConfig('frontend');

        // Start watching config files
        this.startWatching('backend');
        this.startWatching('frontend');
    }

    // Start watching a config file
    startWatching(serverType) {
        const configPath = this.getConfigPath(serverType);
        
        // Stop any existing watcher
        if (this.watchers[serverType]) {
            this.watchers[serverType].close();
        }

        // Start new watcher
        this.watchers[serverType] = fs.watch(configPath, (eventType) => {
            if (eventType === 'change') {
                // Emit config change event
                this.emit('configChanged', serverType);
            }
        });
    }

    // Initialize a specific config file
    initializeConfig(serverType) {
        const configPath = this.getConfigPath(serverType);
        if (!fs.existsSync(configPath)) {
            this.saveConfig(serverType, this.defaultConfigs[serverType]);
        }
    }

    // Get config file path
    getConfigPath(serverType) {
        return path.join(this.configDir, `${serverType}-config.json`);
    }

    // Load configuration
    loadConfig(serverType) {
        try {
            const configPath = this.getConfigPath(serverType);
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            return this.validateConfig(serverType, config);
        } catch (error) {
            console.error(`Error loading ${serverType} config:`, error);
            return this.defaultConfigs[serverType];
        }
    }

    // Save configuration
    saveConfig(serverType, config) {
        try {
            const configPath = this.getConfigPath(serverType);
            const validatedConfig = this.validateConfig(serverType, config);
            fs.writeFileSync(configPath, JSON.stringify(validatedConfig, null, 2));
            return true;
        } catch (error) {
            console.error(`Error saving ${serverType} config:`, error);
            return false;
        }
    }

    // Validate configuration
    validateConfig(serverType, config) {
        const defaultConfig = this.defaultConfigs[serverType];
        const validatedConfig = { ...defaultConfig };

        // Validate and merge provided config with defaults
        for (const key in config) {
            if (key in defaultConfig) {
                // Type validation
                if (typeof config[key] === typeof defaultConfig[key]) {
                    validatedConfig[key] = config[key];
                } else {
                    console.warn(`Invalid type for ${key} in ${serverType} config. Using default value.`);
                }
            }
        }

        return validatedConfig;
    }

    // Get server URL
    getServerUrl(serverType) {
        const config = this.loadConfig(serverType);
        return `http://${config.host}:${config.port}`;
    }

    // Get log file path
    getLogFilePath(serverType) {
        const config = this.loadConfig(serverType);
        return path.join(__dirname, '..', config.logFile);
    }

    // Cleanup watchers
    cleanup() {
        Object.values(this.watchers).forEach(watcher => watcher.close());
    }
}

module.exports = new ConfigManager(); 