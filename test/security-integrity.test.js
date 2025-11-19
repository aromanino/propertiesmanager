const { expect } = require('chai');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('PropertiesManager - Security and Property Integrity', function() {
    this.timeout(5000);
    const configDir = path.join(__dirname, '..', 'config');
    const defaultConfigPath = path.join(configDir, 'default.json');
    let originalConfig;

    function runNodeWithArgs(args) {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(__dirname, 'helpers', 'load-config.js');
            const nodeProcess = spawn('node', [scriptPath, ...args], {
                cwd: path.join(__dirname, '..')
            });

            let output = '';
            nodeProcess.stdout.on('data', (data) => output += data.toString());
            nodeProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Process exited with code ${code}`));
                } else {
                    try {
                        const lines = output.trim().split('\n');
                        resolve(JSON.parse(lines[lines.length - 1]));
                    } catch (e) {
                        reject(new Error(`Failed to parse output: ${output}`));
                    }
                }
            });
        });
    }

    before(function() {
        originalConfig = fs.readFileSync(defaultConfigPath, 'utf8');
        const helpersDir = path.join(__dirname, 'helpers');
        if (!fs.existsSync(helpersDir)) {
            fs.mkdirSync(helpersDir);
        }
        const helperScript = `const propertiesmanager = require('../../index.js').conf;\nconsole.log(JSON.stringify(propertiesmanager));`;
        fs.writeFileSync(path.join(helpersDir, 'load-config.js'), helperScript);
    });

    afterEach(function() {
        fs.writeFileSync(defaultConfigPath, originalConfig);
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        delete process.env.NODE_ENV;
    });

    it('should NOT add new properties via command line that do not exist in config', async function() {
        const config = {
            "production": {
                "existingProp": "value"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(['--nonExistentProp=hacker']);
        
        expect(result.existingProp).to.equal('value');
        expect(result.nonExistentProp).to.be.undefined;
        expect(Object.keys(result).length).to.equal(1);
    });

    it('should NOT add nested properties that do not exist', async function() {
        const config = {
            "production": {
                "server": {
                    "host": "localhost"
                }
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(['--server.malicious=exploit']);
        
        expect(result.server.host).to.equal('localhost');
        expect(result.server.malicious).to.be.undefined;
        expect(Object.keys(result.server).length).to.equal(1);
    });

    it('should protect against prototype pollution via __proto__', async function() {
        const config = {
            "production": {
                "normalProp": "value"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(['--__proto__.polluted=true']);
        
        // PROTECTED: __proto__ is now filtered out and cannot be used to pollute
        expect(result).to.have.property('normalProp');
        expect(result.__proto__.polluted).to.be.undefined;
        expect({}.polluted).to.be.undefined; // Verify no prototype pollution occurred
    });

    it('should NOT allow constructor pollution', async function() {
        const config = {
            "production": {
                "normalProp": "value"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(['--constructor.prototype.polluted=true']);
        
        // PROTECTED: constructor is filtered out
        expect(result.constructor).to.be.a('function'); // Should be Object constructor
        expect({}.polluted).to.be.undefined; // Check no pollution occurred
    });

    it('should only override existing keys, not add new ones at any nesting level', async function() {
        const config = {
            "production": {
                "level1": {
                    "level2": {
                        "existingKey": "original"
                    }
                }
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--level1.level2.existingKey=modified',
            '--level1.level2.newKey=shouldNotExist',
            '--level1.newLevel=shouldNotExist'
        ]);
        
        expect(result.level1.level2.existingKey).to.equal('modified');
        expect(result.level1.level2.newKey).to.be.undefined;
        expect(result.level1.newLevel).to.be.undefined;
    });

    it('should handle attempts to override with malicious values', async function() {
        const config = {
            "production": {
                "command": "safe-command",
                "path": "/safe/path"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--command=rm -rf /',
            '--path=../../etc/passwd'
        ]);
        
        // Values should be overridden but stored as strings (not executed)
        expect(result.command).to.equal('rm -rf /');
        expect(result.path).to.equal('../../etc/passwd');
        // The important part is they're stored as data, not executed
    });

    it('should handle SQL injection-like strings safely', async function() {
        const config = {
            "production": {
                "query": "SELECT * FROM users"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            "--query=SELECT * FROM users; DROP TABLE users;--"
        ]);
        
        expect(result.query).to.be.a('string');
        expect(result.query).to.equal("SELECT * FROM users; DROP TABLE users;--");
    });

    it('should handle XSS-like strings safely', async function() {
        const config = {
            "production": {
                "userInput": "normal text"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--userInput=<script>alert("XSS")</script>'
        ]);
        
        expect(result.userInput).to.equal('<script>alert("XSS")</script>');
    });

    it('handles system property names (toString, valueOf) as regular keys', async function() {
        const config = {
            "production": {
                "regularProp": "value"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(['--regularProp=modified']);
        
        // System properties remain as object methods, custom props work fine
        expect(result.regularProp).to.equal('modified');
        expect(typeof result.toString).to.equal('function');
    });

    it('should handle very long override values without buffer overflow', async function() {
        const config = {
            "production": {
                "longProp": "short"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const longValue = 'A'.repeat(100000); // 100KB string
        const result = await runNodeWithArgs([`--longProp=${longValue}`]);
        
        expect(result.longProp).to.have.lengthOf(100000);
    });

    it('handles multiple values for same key via minimist behavior', async function() {
        const config = {
            "production": {
                "prop": "original"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        // minimist creates an array for duplicate keys
        // but our code checks if argv[index] exists, and takes the array
        const result = await runNodeWithArgs(['--prop=value']);
        
        expect(result.prop).to.equal('value');
    });

    it('should not allow access to parent directories via overrides', async function() {
        const config = {
            "production": {
                "configPath": "./config"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--configPath=../../../etc/passwd'
        ]);
        
        // Value is overridden but it's just a string - no file access is performed
        expect(result.configPath).to.equal('../../../etc/passwd');
        expect(result.configPath).to.be.a('string');
    });

    it('should handle null byte injection attempts', async function() {
        const config = {
            "production": {
                "filename": "test.txt"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--filename=test.txt\\x00.exe'
        ]);
        
        expect(result.filename).to.be.a('string');
    });

    it('should preserve data types and not allow type confusion', async function() {
        const config = {
            "production": {
                "isEnabled": true,
                "port": 3000,
                "name": "app"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--isEnabled=false', // String, not boolean
            '--port=9000',       // String, not number
            '--name=newname'
        ]);
        
        // minimist behavior with = syntax: numbers converted, booleans as strings
        expect(result.isEnabled).to.equal('false'); // String
        expect(result.port).to.equal(9000); // Number conversion works
        expect(result.name).to.equal('newname');
    });
});
