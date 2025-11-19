const { expect } = require('chai');

describe('PropertiesManager - Environment Switching', function() {
    
    // Clean require cache before each test
    beforeEach(function() {
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
    });

    // Restore original NODE_ENV after tests
    after(function() {
        delete process.env.NODE_ENV;
    });

    it('should load production properties when NODE_ENV=production', function() {
        process.env.NODE_ENV = 'production';
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.appName).to.equal('propertiesmanager');
        expect(propertiesmanager.server.port).to.equal(3000);
        expect(propertiesmanager.database.name).to.equal('prod_db');
        expect(propertiesmanager.features.enableCache).to.be.true;
    });

    it('should load dev properties when NODE_ENV=dev', function() {
        process.env.NODE_ENV = 'dev';
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.appName).to.equal('propertiesmanager-dev');
        expect(propertiesmanager.server.port).to.equal(3001);
        expect(propertiesmanager.database.name).to.equal('dev_db');
        expect(propertiesmanager.features.enableCache).to.be.false;
        expect(propertiesmanager.features.debugMode).to.be.true;
    });

    it('should load test properties when NODE_ENV=test', function() {
        process.env.NODE_ENV = 'test';
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.appName).to.equal('propertiesmanager-test');
        expect(propertiesmanager.server.port).to.equal(3002);
        expect(propertiesmanager.database.name).to.equal('test_db');
        expect(propertiesmanager.features.maxConnections).to.equal(5);
    });

    it('should fallback to production when NODE_ENV is invalid', function() {
        process.env.NODE_ENV = 'invalid-environment';
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.appName).to.equal('propertiesmanager');
        expect(propertiesmanager.server.port).to.equal(3000);
        expect(propertiesmanager.database.name).to.equal('prod_db');
    });

    it('should have different database hosts per environment', function() {
        // Test production
        process.env.NODE_ENV = 'production';
        delete require.cache[require.resolve('../index.js')];
        let propertiesmanager = require('../index.js').conf;
        expect(propertiesmanager.database.host).to.equal('db.production.com');
        
        // Test dev
        process.env.NODE_ENV = 'dev';
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        propertiesmanager = require('../index.js').conf;
        expect(propertiesmanager.database.host).to.equal('localhost');
        
        // Test test
        process.env.NODE_ENV = 'test';
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        propertiesmanager = require('../index.js').conf;
        expect(propertiesmanager.database.host).to.equal('localhost');
    });
});
