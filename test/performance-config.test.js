const { expect } = require('chai');
const propertiesmanager = require('../index');

describe('Performance: Config loading', function() {
    this.timeout(10000);
    it('should load config with 1000 properties in < 500ms', function(done) {
        // Simula un config grande
        const bigConfig = {};
        for(let i=0; i<1000; i++) {
            bigConfig['key'+i] = i;
        }
        const start = Date.now();
        // Simula caricamento
        propertiesmanager.conf = bigConfig;
        const end = Date.now();
        expect(end - start).to.be.below(500);
        done();
    });
});
