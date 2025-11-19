const fs = require('fs');
const path = require('path');

// Setup config/default.json before tests run
const fixturesDir = path.join(__dirname, 'fixtures');
const fixtureConfig = path.join(fixturesDir, 'default.json');
const configDir = path.join(__dirname, '..', 'config');
const targetConfig = path.join(configDir, 'default.json');

// Create config directory
if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
}

// Copy fixture to config directory before tests
if (fs.existsSync(fixtureConfig)) {
    fs.copyFileSync(fixtureConfig, targetConfig);
}

exports.mochaHooks = {
    beforeAll() {
        // Ensure config is in place
        if (fs.existsSync(fixtureConfig) && !fs.existsSync(targetConfig)) {
            fs.copyFileSync(fixtureConfig, targetConfig);
        }
    }
};
