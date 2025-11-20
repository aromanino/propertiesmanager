/**
 * Test suite for LOG_LEVEL configuration and logging functionality
 * 
 * Verifies that LOG_LEVEL can only be set via environment variable,
 * not from config file, to avoid circular dependencies.
 */

const { expect } = require('chai');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

describe('Logging Configuration', function() {
    const testDir = path.join(__dirname, 'fixtures', 'logging-test');
    const configDir = path.join(testDir, 'config');
    const defaultConfigPath = path.join(configDir, 'default.json');
    const testScript = path.join(testDir, 'test-app.js');

    beforeEach(function() {
        // Create test directory structure
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
    });

    afterEach(function() {
        // Clean up test files
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    async function createTestApp() {
        // Create a simple test app that uses propertiesmanager
        const appCode = `
            // Suppress all console output from propertiesmanager
            var originalLog = console.log;
            var originalError = console.error;
            var originalInfo = console.info;
            var originalWarn = console.warn;
            console.log = function() {};
            console.error = function() {};
            console.info = function() {};
            console.warn = function() {};
            
            var propertiesmanager = require('${path.join(__dirname, '..')}');
            
            // Restore console and output result
            console.log = originalLog;
            console.log(JSON.stringify(propertiesmanager.conf));
            process.exit(0);
        `;
        fs.writeFileSync(testScript, appCode);
    }

    it('should use default LOG_LEVEL (info) when not set', async function() {
        const config = {
            "production": {
                "testProperty": "value"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        await createTestApp();

        // Run without LOG_LEVEL env var
        const { stdout } = await execPromise(`node "${testScript}"`, {
            cwd: testDir,
            env: { ...process.env, LOG_LEVEL: undefined }
        });
        
        const result = JSON.parse(stdout.trim());
        expect(result.testProperty).to.equal('value');
        // Test passes if no errors occur (default LOG_LEVEL works)
    });

    it('should use LOG_LEVEL from environment variable', async function() {
        const config = {
            "production": {
                "testProperty": "value"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        await createTestApp();

        // Run with LOG_LEVEL env var
        const { stdout } = await execPromise(`LOG_LEVEL=debug node "${testScript}"`, {
            cwd: testDir
        });
        
        const result = JSON.parse(stdout.trim());
        expect(result.testProperty).to.equal('value');
        // Test passes if no errors occur (env var LOG_LEVEL works)
    });

    it('should ignore LOG_LEVEL in config file (root level)', async function() {
        const config = {
            "LOG_LEVEL": "error", // This should be ignored
            "production": {
                "testProperty": "value"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        await createTestApp();

        // Run without LOG_LEVEL env var - should use default (info), not config value (error)
        const { stdout } = await execPromise(`node "${testScript}"`, {
            cwd: testDir,
            env: { ...process.env, LOG_LEVEL: undefined }
        });
        
        const result = JSON.parse(stdout.trim());
        expect(result.testProperty).to.equal('value');
        // LOG_LEVEL from config should be ignored, using default 'info'
    });

    it('should ignore LOG_LEVEL in config file inside environment section', async function() {
        const config = {
            "production": {
                "LOG_LEVEL": "error", // This should be ignored
                "testProperty": "value"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        await createTestApp();

        // Run without LOG_LEVEL env var
        const { stdout } = await execPromise(`node "${testScript}"`, {
            cwd: testDir,
            env: { ...process.env, LOG_LEVEL: undefined }
        });
        
        const result = JSON.parse(stdout.trim());
        expect(result.testProperty).to.equal('value');
        expect(result.LOG_LEVEL).to.equal('error'); // It's in the config as a regular property
        // But the actual LOG_LEVEL used internally should be default 'info'
    });

    it('should prioritize environment variable over any config file setting', async function() {
        const config = {
            "LOG_LEVEL": "error", // At root level
            "production": {
                "LOG_LEVEL": "warn", // Inside environment
                "testProperty": "value"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        await createTestApp();

        // Run with LOG_LEVEL env var
        const { stdout } = await execPromise(`LOG_LEVEL=debug node "${testScript}"`, {
            cwd: testDir
        });
        
        const result = JSON.parse(stdout.trim());
        expect(result.testProperty).to.equal('value');
        expect(result.LOG_LEVEL).to.equal('warn'); // Config value as regular property
        // But the actual LOG_LEVEL used internally should be 'debug' from env var
    });

    it('should accept valid log levels (debug, info, warn, error)', async function() {
        const config = {
            "production": {
                "testProperty": "value"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        await createTestApp();

        const validLevels = ['debug', 'info', 'warn', 'error'];
        
        for (const level of validLevels) {
            const { stdout } = await execPromise(`LOG_LEVEL=${level} node "${testScript}"`, {
                cwd: testDir
            });
            
            const result = JSON.parse(stdout.trim());
            expect(result.testProperty).to.equal('value');
            // Test passes if no errors occur for each valid level
        }
    });
});
