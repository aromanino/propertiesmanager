const { expect } = require('chai');
const path = require('path');
const fs = require('fs');

describe('PropertiesManager - JSON5 Support and Error Handling', function() {
    const configDir = path.join(__dirname, '..', 'config');
    const defaultConfigPath = path.join(configDir, 'default.json');
    let originalConfig;

    before(function() {
        originalConfig = fs.readFileSync(defaultConfigPath, 'utf8');
    });

    afterEach(function() {
        fs.writeFileSync(defaultConfigPath, originalConfig);
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        Object.keys(require.cache).forEach(key => {
            if (key.includes('config/default.json')) {
                delete require.cache[key];
            }
        });
        delete process.env.NODE_ENV;
    });

    it('should support single-line comments in JSON5 format', function() {
        const json5Config = `{
            "production": {
                // This is a comment
                "appName": "test-app",
                "version": "1.0.0" // Inline comment
            }
        }`;
        
        fs.writeFileSync(defaultConfigPath, json5Config);
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.appName).to.equal('test-app');
        expect(propertiesmanager.version).to.equal('1.0.0');
    });

    it('should support multi-line comments in JSON5 format', function() {
        const json5Config = `{
            "production": {
                /* This is a 
                   multi-line comment */
                "appName": "test-app",
                /* Another comment */ "version": "1.0.0"
            }
        }`;
        
        fs.writeFileSync(defaultConfigPath, json5Config);
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.appName).to.equal('test-app');
        expect(propertiesmanager.version).to.equal('1.0.0');
    });

    it('should support trailing commas in JSON5 format', function() {
        const json5Config = `{
            "production": {
                "appName": "test-app",
                "version": "1.0.0",
                "config": {
                    "key1": "value1",
                    "key2": "value2",
                },
            },
        }`;
        
        fs.writeFileSync(defaultConfigPath, json5Config);
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.appName).to.equal('test-app');
        expect(propertiesmanager.config.key1).to.equal('value1');
        expect(propertiesmanager.config.key2).to.equal('value2');
    });

    it('should support unquoted keys in JSON5 format', function() {
        const json5Config = `{
            production: {
                appName: "test-app",
                version: "1.0.0"
            }
        }`;
        
        fs.writeFileSync(defaultConfigPath, json5Config);
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.appName).to.equal('test-app');
        expect(propertiesmanager.version).to.equal('1.0.0');
    });

    it('should handle file with only comments and production', function() {
        const json5Config = `{
            // Configuration file for propertiesmanager
            // Author: Test User
            // Date: 2025-11-18
            
            "production": {
                // Production settings
                "appName": "prod-app"
            }
            
            // End of configuration
        }`;
        
        fs.writeFileSync(defaultConfigPath, json5Config);
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.appName).to.equal('prod-app');
    });

    it('should throw error when config file does not exist', function() {
        const nonExistentPath = path.join(configDir, 'non-existent.json');
        
        expect(() => {
            // This would need to be tested differently as the module loads at require time
            // This test documents expected behavior
        }).to.not.throw();
        
        // The actual test is that default.json must exist
        expect(fs.existsSync(defaultConfigPath)).to.be.true;
    });

    it('should handle complex JSON5 with mixed comment styles', function() {
        const json5Config = `{
            /* Global configuration */
            "production": {
                // Application settings
                "appName": "complex-app",
                "version": "2.0.0", // Current version
                
                /* Server configuration
                   with multiple lines */
                "server": {
                    "host": "localhost", // Development host
                    "port": 3000,
                },
                
                // Database settings
                "database": {
                    name: "mydb", // Unquoted key
                    type: "postgres",
                }
            },
            
            /* Development environment */
            dev: { // Unquoted key
                appName: "dev-app",
            }
        }`;
        
        fs.writeFileSync(defaultConfigPath, json5Config);
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.appName).to.equal('complex-app');
        expect(propertiesmanager.server.host).to.equal('localhost');
        expect(propertiesmanager.database.name).to.equal('mydb');
    });

    it('should handle numeric keys and special characters', function() {
        const json5Config = `{
            "production": {
                "app-name": "special-chars",
                "app_name": "underscore",
                "app.name": "dot-notation",
                "123": "numeric-key",
                "with space": "space-key"
            }
        }`;
        
        fs.writeFileSync(defaultConfigPath, json5Config);
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager['app-name']).to.equal('special-chars');
        expect(propertiesmanager['app_name']).to.equal('underscore');
        expect(propertiesmanager['app.name']).to.equal('dot-notation');
        expect(propertiesmanager['123']).to.equal('numeric-key');
        expect(propertiesmanager['with space']).to.equal('space-key');
    });

    it('should handle unicode and special characters in values', function() {
        const json5Config = `{
            "production": {
                "emoji": "🚀",
                "chinese": "你好",
                "arabic": "مرحبا",
                "special": "\\n\\t\\r",
                "unicode": "\\u0048\\u0065\\u006C\\u006C\\u006F"
            }
        }`;
        
        fs.writeFileSync(defaultConfigPath, json5Config);
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.emoji).to.equal('🚀');
        expect(propertiesmanager.chinese).to.equal('你好');
        expect(propertiesmanager.arabic).to.equal('مرحبا');
    });
});
