const { expect } = require('chai');
const path = require('path');
const fs = require('fs');

describe('PropertiesManager - Module Lifecycle and Cache Behavior', function() {
    const configDir = path.join(__dirname, '..', 'config');
    const defaultConfigPath = path.join(configDir, 'default.json');
    let originalConfig;

    before(function() {
        originalConfig = fs.readFileSync(defaultConfigPath, 'utf8');
    });

    afterEach(function() {
        fs.writeFileSync(defaultConfigPath, originalConfig);
        // Clear all relevant caches
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        Object.keys(require.cache).forEach(key => {
            if (key.includes('config/default.json') || key.includes('index.js')) {
                delete require.cache[key];
            }
        });
        delete process.env.NODE_ENV;
    });

    it('should return same instance when required multiple times without cache clearing', function() {
        const config = {
            "production": {"app": "test"}
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const props1 = require('../index.js').conf;
        const props2 = require('../index.js').conf;
        
        expect(props1).to.equal(props2); // Same reference
        
        props1.testProperty = 'added';
        expect(props2.testProperty).to.equal('added');
    });

    it('should load fresh config when cache is cleared', function() {
        let config = {
            "production": {"value": "first"}
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const props1 = require('../index.js').conf;
        expect(props1.value).to.equal('first');
        
        // Clear cache
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        
        // Update config file
        config = {
            "production": {"value": "second"}
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const props2 = require('../index.js').conf;
        expect(props2.value).to.equal('second');
    });

    it('should not be affected by config file changes after initial load', function() {
        const config = {
            "production": {"original": "value"}
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const props = require('../index.js').conf;
        expect(props.original).to.equal('value');
        
        // Change file without clearing cache
        const newConfig = {
            "production": {"modified": "newvalue"}
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(newConfig));
        
        // Should still have old value
        expect(props.original).to.equal('value');
        expect(props.modified).to.be.undefined;
    });

    it('should handle concurrent requires in the same process', function() {
        const config = {
            "production": {"concurrent": "test"}
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const results = [];
        for (let i = 0; i < 10; i++) {
            results.push(require('../index.js').conf);
        }
        
        // All should reference the same object
        const first = results[0];
        results.forEach(result => {
            expect(result).to.equal(first);
        });
    });

    it('should maintain environment setting across multiple requires', function() {
        const config = {
            "production": {"env": "prod"},
            "dev": {"env": "development"}
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        process.env.NODE_ENV = 'dev';
        
        const props1 = require('../index.js').conf;
        const props2 = require('../index.js').conf;
        
        expect(props1.env).to.equal('development');
        expect(props2.env).to.equal('development');
    });

    it('should not leak changes across cache clears and environment changes', function() {
        const config = {
            "production": {"env": "prod"},
            "dev": {"env": "dev"}
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        // Load production
        delete process.env.NODE_ENV;
        const prod = require('../index.js').conf;
        expect(prod.env).to.equal('prod');
        
        // Clear and load dev
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        process.env.NODE_ENV = 'dev';
        const dev = require('../index.js').conf;
        expect(dev.env).to.equal('dev');
        
        // Original prod reference should still have prod value
        expect(prod.env).to.equal('prod');
    });

    it('should handle module being required from different paths', function() {
        const config = {
            "production": {"path": "test"}
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const props1 = require('../index.js').conf;
        const props2 = require(path.resolve(__dirname, '..', 'index.js')).conf;
        
        // Should be the same due to Node.js module resolution
        expect(props1).to.equal(props2);
    });

    it('should properly initialize on first require regardless of timing', function() {
        const config = {
            "production": {
                "init": "value",
                "nested": {
                    "deep": "data"
                }
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        // Simulate first-time require
        const props = require('../index.js').conf;
        
        expect(props).to.be.an('object');
        expect(props.init).to.equal('value');
        expect(props.nested).to.be.an('object');
        expect(props.nested.deep).to.equal('data');
    });

    it('should not mutate original config object from file', function() {
        const config = {
            "production": {"immutable": "original"}
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const props = require('../index.js').conf;
        props.immutable = "modified";
        props.newProp = "added";
        
        // Clear cache and reload
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        
        const freshProps = require('../index.js').conf;
        expect(freshProps.immutable).to.equal('original');
        expect(freshProps.newProp).to.be.undefined;
    });

    it('should handle module.exports.conf as a reference', function() {
        const config = {
            "production": {"exported": "value"}
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const module1 = require('../index.js');
        const module2 = require('../index.js');
        
        expect(module1.conf).to.equal(module2.conf);
        expect(module1).to.equal(module2);
    });

    it('should maintain state when accessed via different destructuring patterns', function() {
        const config = {
            "production": {"pattern": "test"}
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const { conf: conf1 } = require('../index.js');
        const conf2 = require('../index.js').conf;
        const module = require('../index.js');
        const conf3 = module.conf;
        
        expect(conf1).to.equal(conf2);
        expect(conf2).to.equal(conf3);
    });

    it('should handle process environment changes after module load', function() {
        const config = {
            "production": {"env": "prod"},
            "dev": {"env": "dev"}
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        process.env.NODE_ENV = 'production';
        const props = require('../index.js').conf;
        expect(props.env).to.equal('prod');
        
        // Change NODE_ENV after loading
        process.env.NODE_ENV = 'dev';
        
        // Should still have production config (loaded at require time)
        expect(props.env).to.equal('prod');
    });

    it('should handle rapid successive requires', function() {
        const config = {
            "production": {"rapid": "test"}
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const start = Date.now();
        const instances = [];
        
        for (let i = 0; i < 100; i++) {
            instances.push(require('../index.js').conf);
        }
        
        const duration = Date.now() - start;
        
        // All should be the same instance (cached)
        const first = instances[0];
        instances.forEach(inst => {
            expect(inst).to.equal(first);
        });
        
        // Should be very fast due to caching
        expect(duration).to.be.lessThan(100);
    });
});
