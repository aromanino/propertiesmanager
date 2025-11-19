const { expect } = require('chai');
const path = require('path');

describe('PropertiesManager - Basic Loading', function() {
    
    // Clean require cache before each test
    beforeEach(function() {
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
    });

    it('should load production properties by default', function() {
        delete process.env.NODE_ENV;
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager).to.be.an('object');
        expect(propertiesmanager.appName).to.equal('propertiesmanager');
        expect(propertiesmanager.server.host).to.equal('localhost');
        expect(propertiesmanager.server.port).to.equal(3000);
        expect(propertiesmanager.database.host).to.equal('db.production.com');
    });

    it('should load all expected production properties', function() {
        delete process.env.NODE_ENV;
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager).to.have.property('appName');
        expect(propertiesmanager).to.have.property('version');
        expect(propertiesmanager).to.have.property('server');
        expect(propertiesmanager).to.have.property('database');
        expect(propertiesmanager).to.have.property('features');
    });

    it('should have correct structure for nested objects', function() {
        delete process.env.NODE_ENV;
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.server).to.be.an('object');
        expect(propertiesmanager.database).to.be.an('object');
        expect(propertiesmanager.features).to.be.an('object');
        
        expect(propertiesmanager.features.enableCache).to.be.a('boolean');
        expect(propertiesmanager.features.maxConnections).to.be.a('number');
    });
});
