const { expect } = require('chai');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('PropertiesManager - Null and Undefined Handling', function() {
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

    it('should set property to null when --key=null is passed', async function() {
        const config = {
            "production": {
                "database": {
                    "host": "localhost",
                    "port": 5432
                },
                "cache": "redis"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(['--cache=null']);
        
        expect(result.cache).to.be.null;
        expect(result.database.host).to.equal('localhost');
    });

    it('should set property to undefined when --key=undefined is passed', async function() {
        const config = {
            "production": {
                "optionalFeature": "enabled",
                "required": "value"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(['--optionalFeature=undefined']);
        
        expect(result.optionalFeature).to.be.undefined;
        expect(result.required).to.equal('value');
    });

    it('should set nested property to null', async function() {
        const config = {
            "production": {
                "server": {
                    "host": "localhost",
                    "port": 3000,
                    "ssl": {
                        "cert": "/path/to/cert",
                        "key": "/path/to/key"
                    }
                }
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(['--server.ssl.cert=null']);
        
        expect(result.server.ssl.cert).to.be.null;
        expect(result.server.ssl.key).to.equal('/path/to/key');
        expect(result.server.host).to.equal('localhost');
    });

    it('should set nested property to undefined', async function() {
        const config = {
            "production": {
                "features": {
                    "feature1": true,
                    "feature2": false,
                    "feature3": "enabled"
                }
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(['--features.feature2=undefined']);
        
        expect(result.features.feature2).to.be.undefined;
        expect(result.features.feature1).to.be.true;
        expect(result.features.feature3).to.equal('enabled');
    });

    it('should NOT accept --key= syntax (boolean true is rejected)', async function() {
        const config = {
            "production": {
                "mustHaveValue": "original",
                "another": "prop"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(['--mustHaveValue=']);
        
        // --key= creates boolean true, which is filtered out
        expect(result.mustHaveValue).to.equal('original');
        expect(result.another).to.equal('prop');
    });

    it('should handle mix of null, undefined, and regular values', async function() {
        const config = {
            "production": {
                "a": "valueA",
                "b": "valueB",
                "c": "valueC",
                "d": "valueD"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--a=newValue',
            '--b=null',
            '--c=undefined',
            '--d=123'
        ]);
        
        expect(result.a).to.equal('newValue');
        expect(result.b).to.be.null;
        expect(result.c).to.be.undefined;
        expect(result.d).to.equal(123);
    });

    it('should handle null in deeply nested objects', async function() {
        const config = {
            "production": {
                "level1": {
                    "level2": {
                        "level3": {
                            "deepProp": "deep"
                        }
                    }
                }
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(['--level1.level2.level3.deepProp=null']);
        
        expect(result.level1.level2.level3.deepProp).to.be.null;
    });

    it('should preserve existing null values in config', async function() {
        const config = {
            "production": {
                "alreadyNull": null,
                "normalValue": "value"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(['--normalValue=updated']);
        
        expect(result.alreadyNull).to.be.null;
        expect(result.normalValue).to.equal('updated');
    });

    it('should allow changing null to another value', async function() {
        const config = {
            "production": {
                "wasNull": null,
                "other": "value"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(['--wasNull=nowHasValue']);
        
        expect(result.wasNull).to.equal('nowHasValue');
        expect(result.other).to.equal('value');
    });

    it('should allow changing value to null and back', async function() {
        const config = {
            "production": {
                "mutable": "original"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        // First change to null
        let result = await runNodeWithArgs(['--mutable=null']);
        expect(result.mutable).to.be.null;
        
        // Restore config and change to a value
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        
        result = await runNodeWithArgs(['--mutable=newValue']);
        expect(result.mutable).to.equal('newValue');
    });

    it('should differentiate between null, undefined, and string "null"/"undefined"', async function() {
        const config = {
            "production": {
                "prop1": "will be null",
                "prop2": "will be undefined", 
                "prop3": "will be string"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--prop1=null',
            '--prop2=undefined',
            '--prop3="null"'
        ]);
        
        expect(result.prop1).to.be.null;
        expect(result.prop2).to.be.undefined;
        expect(result.prop3).to.equal('"null"'); // Quoted string
    });
});
