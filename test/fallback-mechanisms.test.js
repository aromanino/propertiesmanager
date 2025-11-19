const { expect } = require('chai');
const path = require('path');
const fs = require('fs');

describe('PropertiesManager - Fallback Mechanisms', function() {
    const configDir = path.join(__dirname, '..', 'config');
    const defaultConfigPath = path.join(configDir, 'default.json');
    let originalConfig;

    before(function() {
        // Backup original config
        originalConfig = fs.readFileSync(defaultConfigPath, 'utf8');
    });

    afterEach(function() {
        // Restore original config
        fs.writeFileSync(defaultConfigPath, originalConfig);
        // Clear require cache
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        delete process.env.NODE_ENV;
    });

    it('should fallback to production when dev environment is requested but not defined', function() {
        const configWithoutDev = {
            "production": {
                "appName": "production-app",
                "feature": "production-feature"
            },
            "test": {
                "appName": "test-app"
            }
        };
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(configWithoutDev));
        process.env.NODE_ENV = 'dev';
        
        // Clear cache before requiring to ensure fresh load
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.appName).to.equal('production-app');
        expect(propertiesmanager.feature).to.equal('production-feature');
    });

    it('should fallback to production when test environment is requested but not defined', function() {
        const configWithoutTest = {
            "production": {
                "appName": "production-app",
                "setting": "production-setting"
            },
            "dev": {
                "appName": "dev-app"
            }
        };
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(configWithoutTest));
        process.env.NODE_ENV = 'test';
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.appName).to.equal('production-app');
        expect(propertiesmanager.setting).to.equal('production-setting');
    });

    it('should use production when only production is defined', function() {
        const productionOnlyConfig = {
            "production": {
                "appName": "only-production",
                "port": 8080,
                "database": {
                    "host": "localhost",
                    "name": "proddb"
                }
            }
        };
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(productionOnlyConfig));
        
        // Test with no NODE_ENV
        delete process.env.NODE_ENV;
        let propertiesmanager = require('../index.js').conf;
        expect(propertiesmanager.appName).to.equal('only-production');
        
        // Test with dev
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        process.env.NODE_ENV = 'dev';
        propertiesmanager = require('../index.js').conf;
        expect(propertiesmanager.appName).to.equal('only-production');
        
        // Test with test
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        process.env.NODE_ENV = 'test';
        propertiesmanager = require('../index.js').conf;
        expect(propertiesmanager.appName).to.equal('only-production');
    });

    it('should handle partial environment definitions with fallback', function() {
        const partialConfig = {
            "production": {
                "appName": "prod-app",
                "version": "1.0.0",
                "server": {
                    "host": "prod.example.com",
                    "port": 80
                },
                "features": {
                    "feature1": true,
                    "feature2": true
                }
            },
            "dev": {
                "appName": "dev-app",
                "server": {
                    "port": 3000
                }
            }
        };
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(partialConfig));
        process.env.NODE_ENV = 'dev';
        
        const propertiesmanager = require('../index.js').conf;
        
        // Should get dev values where defined
        expect(propertiesmanager.appName).to.equal('dev-app');
        expect(propertiesmanager.server.port).to.equal(3000);
        
        // Should NOT fallback for nested properties not in dev
        // (This tests actual behavior - dev environment gets only what's defined in dev)
        expect(propertiesmanager.version).to.be.undefined;
        expect(propertiesmanager.features).to.be.undefined;
    });

    it('should correctly identify which environment is loaded', function() {
        const multiEnvConfig = {
            "production": {
                "env": "production"
            },
            "dev": {
                "env": "development"
            },
            "test": {
                "env": "testing"
            }
        };
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(multiEnvConfig));
        
        // Test production
        delete process.env.NODE_ENV;
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        let props = require('../index.js').conf;
        expect(props.env).to.equal('production');
        
        // Test dev
        process.env.NODE_ENV = 'dev';
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        props = require('../index.js').conf;
        expect(props.env).to.equal('development');
        
        // Test test
        process.env.NODE_ENV = 'test';
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        props = require('../index.js').conf;
        expect(props.env).to.equal('testing');
    });

    it('should handle empty dev or test sections gracefully', function() {
        const emptyEnvConfig = {
            "production": {
                "appName": "prod-app",
                "config": "production"
            },
            "dev": {},
            "test": {}
        };
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(emptyEnvConfig));
        
        process.env.NODE_ENV = 'dev';
        const propertiesmanager = require('../index.js').conf;
        
        // Should load empty dev object, not fallback
        expect(Object.keys(propertiesmanager).length).to.equal(0);
    });
});
