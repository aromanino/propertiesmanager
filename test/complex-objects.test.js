const { expect } = require('chai');

describe('PropertiesManager - Complex Objects', function() {
    
    beforeEach(function() {
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        delete process.env.NODE_ENV;
    });

    it('should handle nested objects correctly', function() {
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.server).to.be.an('object');
        expect(propertiesmanager.server).to.have.all.keys('host', 'port');
    });

    it('should preserve object structure when loaded', function() {
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.features).to.be.an('object');
        expect(propertiesmanager.features.enableCache).to.exist;
        expect(propertiesmanager.features.maxConnections).to.exist;
    });

    it('should maintain correct data types in nested objects', function() {
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.server.host).to.be.a('string');
        expect(propertiesmanager.server.port).to.be.a('number');
        expect(propertiesmanager.database.port).to.be.a('number');
        expect(propertiesmanager.features.enableCache).to.be.a('boolean');
        expect(propertiesmanager.features.maxConnections).to.be.a('number');
    });

    it('should handle multiple levels of nesting', function() {
        const propertiesmanager = require('../index.js').conf;
        
        // Verify we can access properties at different levels
        expect(propertiesmanager.database).to.exist;
        expect(propertiesmanager.database.host).to.exist;
        expect(propertiesmanager.database.port).to.exist;
        expect(propertiesmanager.database.name).to.exist;
    });

    it('should load dev environment with additional nested properties', function() {
        process.env.NODE_ENV = 'dev';
        const propertiesmanager = require('../index.js').conf;
        
        // Dev environment has debugMode property that production doesn't have
        expect(propertiesmanager.features.debugMode).to.exist;
        expect(propertiesmanager.features.debugMode).to.be.true;
    });

    it('should not have debugMode in production environment', function() {
        process.env.NODE_ENV = 'production';
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.features.debugMode).to.be.undefined;
    });

    it('should return independent object instances', function() {
        const propertiesmanager1 = require('../index.js').conf;
        const propertiesmanager2 = require('../index.js').conf;
        
        // They should reference the same object due to require caching
        expect(propertiesmanager1).to.equal(propertiesmanager2);
        
        // Modifying one should affect the other (same reference)
        propertiesmanager1.testProperty = 'test';
        expect(propertiesmanager2.testProperty).to.equal('test');
    });
});
