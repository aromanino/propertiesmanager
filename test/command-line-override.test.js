const { expect } = require('chai');
const { spawn } = require('child_process');
const path = require('path');

describe('PropertiesManager - Command Line Override', function() {
    this.timeout(5000); // Increase timeout for spawned processes

    function runNodeWithArgs(args) {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(__dirname, 'helpers', 'load-config.js');
            const nodeProcess = spawn('node', [scriptPath, ...args], {
                cwd: path.join(__dirname, '..')
            });

            let output = '';
            let errorOutput = '';

            nodeProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            nodeProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            nodeProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Process exited with code ${code}: ${errorOutput}`));
                } else {
                    try {
                        // Extract JSON from output (last line should be the JSON)
                        const lines = output.trim().split('\n');
                        const jsonLine = lines[lines.length - 1];
                        resolve(JSON.parse(jsonLine));
                    } catch (e) {
                        reject(new Error(`Failed to parse output: ${output}`));
                    }
                }
            });
        });
    }

    before(function() {
        // Create helper script
        const fs = require('fs');
        const helpersDir = path.join(__dirname, 'helpers');
        if (!fs.existsSync(helpersDir)) {
            fs.mkdirSync(helpersDir);
        }
        
        const helperScript = `
const propertiesmanager = require('../../index.js').conf;
console.log(JSON.stringify(propertiesmanager));
`;
        fs.writeFileSync(path.join(helpersDir, 'load-config.js'), helperScript);
    });

    it('should override simple string property from command line', async function() {
        const config = await runNodeWithArgs(['--appName=OverriddenApp']);
        expect(config.appName).to.equal('OverriddenApp');
    });

    it('should override numeric property from command line', async function() {
        const config = await runNodeWithArgs(['--version=4.0.0']);
        expect(config.version).to.equal('4.0.0');
    });

    it('should override nested object property with dot notation', async function() {
        const config = await runNodeWithArgs(['--server.port=8080']);
        expect(config.server.port).to.equal(8080);
    });

    it('should override deeply nested property', async function() {
        const config = await runNodeWithArgs(['--database.host=newhost.com']);
        expect(config.database.host).to.equal('newhost.com');
    });

    it('should override multiple properties at once', async function() {
        const config = await runNodeWithArgs([
            '--appName=MultiOverride',
            '--server.port=9000',
            '--features.maxConnections=200'
        ]);
        
        expect(config.appName).to.equal('MultiOverride');
        expect(config.server.port).to.equal(9000);
        expect(config.features.maxConnections).to.equal(200);
    });

    it('should override boolean property', async function() {
        const config = await runNodeWithArgs(['--features.enableCache=false']);
        expect(config.features.enableCache).to.equal('false');
    });

    it('should not add properties that do not exist in config', async function() {
        const config = await runNodeWithArgs(['--nonExistentProperty=value']);
        expect(config).to.not.have.property('nonExistentProperty');
    });
});
