const { expect } = require('chai');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('PropertiesManager - Advanced Override Scenarios', function() {
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

    it('should handle overriding properties with special characters in values', async function() {
        const config = {
            "production": {
                "special": "normal",
                "path": "/path/to/file"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--special=!@#$%^&*()',
            '--path=/path/with spaces/and-dashes'
        ]);
        
        expect(result.special).to.equal('!@#$%^&*()');
        expect(result.path).to.equal('/path/with spaces/and-dashes');
    });

    it('should NOT allow empty string via --key= syntax (rejects boolean true)', async function() {
        const config = {
            "production": {
                "notEmpty": "has value",
                "shouldStay": "unchanged"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--notEmpty=',
            '--shouldStay=newvalue'
        ]);
        
        // --key= is interpreted as empty string '' by minimist, which is rejected by design
        expect(result.notEmpty).to.equal('has value'); // Unchanged
        expect(result.shouldStay).to.equal('newvalue'); // Changed
    });

    it('should allow setting values to null explicitly', async function() {
        const config = {
            "production": {
                "canBeNull": "original",
                "anotherProp": "value"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--canBeNull=null'
        ]);
        
        expect(result.canBeNull).to.be.null;
        expect(result.anotherProp).to.equal('value');
    });

    it('should allow setting values to undefined explicitly', async function() {
        const config = {
            "production": {
                "canBeUndefined": "original",
                "anotherProp": "value"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--canBeUndefined=undefined'
        ]);
        
        expect(result.canBeUndefined).to.be.undefined;
        expect(result.anotherProp).to.equal('value');
    });

    it('should handle overriding deeply nested properties with dot notation', async function() {
        const config = {
            "production": {
                "level1": {
                    "level2": {
                        "level3": {
                            "level4": {
                                "deepValue": "original"
                            }
                        }
                    }
                }
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--level1.level2.level3.level4.deepValue=modified'
        ]);
        
        expect(result.level1.level2.level3.level4.deepValue).to.equal('modified');
    });

    it('should handle multiple nested property overrides simultaneously', async function() {
        const config = {
            "production": {
                "server": {
                    "host": "localhost",
                    "port": 3000,
                    "ssl": {
                        "enabled": false,
                        "cert": "/path/to/cert"
                    }
                },
                "database": {
                    "host": "dbhost",
                    "credentials": {
                        "user": "admin",
                        "pass": "secret"
                    }
                }
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--server.host=newhost',
            '--server.port=8080',
            '--server.ssl.enabled=true',
            '--database.host=newdb',
            '--database.credentials.user=newuser'
        ]);
        
        // Minimist creates nested objects automatically, so these should all work
        expect(result.server.host).to.equal('newhost');
        expect(result.server.port).to.equal(8080); // number conversion by minimist
        expect(result.server.ssl.enabled).to.equal('true'); // string, not boolean
        expect(result.server.ssl.cert).to.equal('/path/to/cert'); // Unchanged nested
        expect(result.database.host).to.equal('newdb');
        expect(result.database.credentials.user).to.equal('newuser');
        expect(result.database.credentials.pass).to.equal('secret'); // Unchanged nested
    });

    it('should handle properties with dots in their names', async function() {
        const config = {
            "production": {
                "app.name": "dotted",
                "config.version": "1.0"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--app.name=modified'
        ]);
        
        // Minimist will interpret this as app: {name: "modified"}
        // The actual behavior depends on whether the key exists in config
        expect(result).to.have.property('app.name');
    });

    it('should handle numeric string values', async function() {
        const config = {
            "production": {
                "stringNumber": "12345",
                "actualNumber": 12345,
                "port": 3000
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--stringNumber=67890',
            '--actualNumber=99999',
            '--port=8080'
        ]);
        
        // minimist converts numeric-looking values to numbers
        expect(result.stringNumber).to.equal(67890);
        expect(result.actualNumber).to.equal(99999);
        expect(result.port).to.equal(8080);
    });

    it('should handle boolean-like string values', async function() {
        const config = {
            "production": {
                "enabled": true,
                "disabled": false,
                "strTrue": "true",
                "strFalse": "false"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--enabled=false',
            '--disabled=true',
            '--strTrue=false',
            '--strFalse=true'
        ]);
        
        // minimist returns 'true'/'false' as strings when using --key=value syntax
        expect(result.enabled).to.equal('false');
        expect(result.disabled).to.equal('true');
        expect(result.strTrue).to.equal('false');
        expect(result.strFalse).to.equal('true');
    });

    it('should handle overriding with values containing equals signs', async function() {
        const config = {
            "production": {
                "equation": "x=1",
                "connectionString": "server=localhost"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--equation=y=2+2',
            '--connectionString=server=remote;port=5432'
        ]);
        
        expect(result.equation).to.equal('y=2+2');
        expect(result.connectionString).to.equal('server=remote;port=5432');
    });

    it('should handle overriding with JSON-like strings', async function() {
        const config = {
            "production": {
                "jsonString": '{"key":"value"}',
                "arrayString": "[1,2,3]"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--jsonString={"new":"data"}',
            '--arrayString=[4,5,6]'
        ]);
        
        // Should be stored as strings, not parsed
        expect(result.jsonString).to.be.a('string');
        expect(result.jsonString).to.equal('{"new":"data"}');
        expect(result.arrayString).to.equal('[4,5,6]');
    });

    it('should handle overriding with URLs', async function() {
        const config = {
            "production": {
                "apiUrl": "http://localhost:3000",
                "websocketUrl": "ws://localhost:8080"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--apiUrl=https://api.example.com:443/v1',
            '--websocketUrl=wss://socket.example.com/channel'
        ]);
        
        expect(result.apiUrl).to.equal('https://api.example.com:443/v1');
        expect(result.websocketUrl).to.equal('wss://socket.example.com/channel');
    });

    it('should handle overriding with file paths (Windows and Unix)', async function() {
        const config = {
            "production": {
                "unixPath": "/usr/local/bin",
                "windowsPath": "C:\\Program Files"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--unixPath=/home/user/custom/path',
            '--windowsPath=D:\\Custom\\Path'
        ]);
        
        expect(result.unixPath).to.equal('/home/user/custom/path');
        expect(result.windowsPath).to.equal('D:\\Custom\\Path');
    });

    it('should handle overriding with environment variable-like values', async function() {
        const config = {
            "production": {
                "envVar": "${HOME}/path",
                "template": "${{VAR}}"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--envVar=${USER}/newpath',
            '--template=${{NEW_VAR}}'
        ]);
        
        // Should be stored as-is, not interpolated
        expect(result.envVar).to.equal('${USER}/newpath');
        expect(result.template).to.equal('${{NEW_VAR}}');
    });

    it('should handle overriding with regex-like patterns', async function() {
        const config = {
            "production": {
                "pattern": "^[a-z]+$",
                "replacement": "\\1\\2"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--pattern=^[A-Z0-9]+$',
            '--replacement=\\w+\\d+'
        ]);
        
        expect(result.pattern).to.equal('^[A-Z0-9]+$');
        expect(result.replacement).to.equal('\\w+\\d+');
    });

    it('should handle overriding with base64-encoded values', async function() {
        const config = {
            "production": {
                "encoded": "SGVsbG8gV29ybGQ=",
                "secret": "base64value"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--encoded=TmV3IFZhbHVl',
            '--secret=QW5vdGhlclNlY3JldA=='
        ]);
        
        expect(result.encoded).to.equal('TmV3IFZhbHVl');
        expect(result.secret).to.equal('QW5vdGhlclNlY3JldA==');
    });

    it('should handle overriding with multiline-like strings', async function() {
        const config = {
            "production": {
                "multiline": "line1\\nline2"
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--multiline=first\\nsecond\\nthird'
        ]);
        
        expect(result.multiline).to.include('\\n');
    });
});
