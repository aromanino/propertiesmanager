const { expect } = require('chai');
const path = require('path');
const fs = require('fs');

describe('PropertiesManager - Edge Cases and Error Scenarios', function() {
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

    it('should handle empty production object', function() {
        const emptyConfig = {
            "production": {}
        };
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(emptyConfig));
        
        // Clear cache before requiring to ensure fresh load
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager).to.be.an('object');
        expect(Object.keys(propertiesmanager).length).to.equal(0);
    });

    it('should handle deeply nested empty objects', function() {
        const deepEmptyConfig = {
            "production": {
                "level1": {
                    "level2": {
                        "level3": {}
                    }
                }
            }
        };
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(deepEmptyConfig));
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.level1).to.be.an('object');
        expect(propertiesmanager.level1.level2).to.be.an('object');
        expect(propertiesmanager.level1.level2.level3).to.be.an('object');
        expect(Object.keys(propertiesmanager.level1.level2.level3).length).to.equal(0);
    });

    it('should handle null values in configuration', function() {
        const nullConfig = {
            "production": {
                "nullValue": null,
                "normalValue": "test",
                "nested": {
                    "alsoNull": null,
                    "notNull": "value"
                }
            }
        };
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(nullConfig));
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.nullValue).to.be.null;
        expect(propertiesmanager.normalValue).to.equal('test');
        expect(propertiesmanager.nested.alsoNull).to.be.null;
        expect(propertiesmanager.nested.notNull).to.equal('value');
    });

    it('should handle boolean values correctly', function() {
        const boolConfig = {
            "production": {
                "trueValue": true,
                "falseValue": false,
                "nested": {
                    "enabled": true,
                    "disabled": false
                }
            }
        };
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(boolConfig));
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.trueValue).to.be.true;
        expect(propertiesmanager.falseValue).to.be.false;
        expect(propertiesmanager.nested.enabled).to.be.true;
        expect(propertiesmanager.nested.disabled).to.be.false;
    });

    it('should handle numeric values including zero and negative numbers', function() {
        const numConfig = {
            "production": {
                "zero": 0,
                "negative": -100,
                "float": 3.14,
                "exponential": 1.23e-4,
                "nested": {
                    "port": 0,
                    "timeout": -1
                }
            }
        };
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(numConfig));
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.zero).to.equal(0);
        expect(propertiesmanager.negative).to.equal(-100);
        expect(propertiesmanager.float).to.equal(3.14);
        expect(propertiesmanager.exponential).to.equal(1.23e-4);
        expect(propertiesmanager.nested.port).to.equal(0);
        expect(propertiesmanager.nested.timeout).to.equal(-1);
    });

    it('should handle empty strings', function() {
        const emptyStringConfig = {
            "production": {
                "emptyString": "",
                "whitespace": "   ",
                "nested": {
                    "empty": "",
                    "filled": "not empty"
                }
            }
        };
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(emptyStringConfig));
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.emptyString).to.equal('');
        expect(propertiesmanager.whitespace).to.equal('   ');
        expect(propertiesmanager.nested.empty).to.equal('');
        expect(propertiesmanager.nested.filled).to.equal('not empty');
    });

    it('should handle arrays in configuration', function() {
        const arrayConfig = {
            "production": {
                "emptyArray": [],
                "stringArray": ["one", "two", "three"],
                "mixedArray": [1, "two", true, null],
                "nestedArray": [[1, 2], [3, 4]],
                "objectArray": [
                    {"name": "first", "value": 1},
                    {"name": "second", "value": 2}
                ]
            }
        };
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(arrayConfig));
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.emptyArray).to.be.an('array').that.is.empty;
        expect(propertiesmanager.stringArray).to.deep.equal(["one", "two", "three"]);
        expect(propertiesmanager.mixedArray).to.deep.equal([1, "two", true, null]);
        expect(propertiesmanager.nestedArray).to.deep.equal([[1, 2], [3, 4]]);
        expect(propertiesmanager.objectArray[0].name).to.equal('first');
    });

    it('should handle very long property names', function() {
        const longKey = 'a'.repeat(1000);
        const longConfig = {
            "production": {}
        };
        longConfig.production[longKey] = "longValue";
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(longConfig));
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager[longKey]).to.equal('longValue');
    });

    it('should handle very long property values', function() {
        const longValue = 'x'.repeat(10000);
        const longConfig = {
            "production": {
                "longProperty": longValue
            }
        };
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(longConfig));
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.longProperty).to.equal(longValue);
        expect(propertiesmanager.longProperty.length).to.equal(10000);
    });

    it('should handle deeply nested objects (10+ levels)', function() {
        const deepConfig = {
            "production": {
                "l1": { "l2": { "l3": { "l4": { "l5": { 
                    "l6": { "l7": { "l8": { "l9": { "l10": { 
                        "value": "deep"
                    }}}}}}
                }}}}
            }
        };
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(deepConfig));
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.l1.l2.l3.l4.l5.l6.l7.l8.l9.l10.value).to.equal('deep');
    });

    it('should handle configuration with special JSON escaped characters', function() {
        const specialConfig = {
            "production": {
                "quote": "He said \"Hello\"",
                "backslash": "C:\\\\Users\\\\Test",
                "newline": "Line1\\nLine2",
                "tab": "Col1\\tCol2",
                "unicode": "\\u0048\\u0065\\u006c\\u006c\\u006f"
            }
        };
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(specialConfig));
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.quote).to.include('"');
        expect(propertiesmanager.backslash).to.include('\\\\');
    });

    it('should handle large number of properties (stress test)', function() {
        const largeConfig = {
            "production": {}
        };
        
        // Create 1000 properties
        for (let i = 0; i < 1000; i++) {
            largeConfig.production[`property_${i}`] = `value_${i}`;
        }
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(largeConfig));
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(Object.keys(propertiesmanager).length).to.equal(1000);
        expect(propertiesmanager.property_0).to.equal('value_0');
        expect(propertiesmanager.property_999).to.equal('value_999');
    });

    it('should handle mixed data types at same level', function() {
        const mixedConfig = {
            "production": {
                "string": "text",
                "number": 42,
                "boolean": true,
                "null": null,
                "array": [1, 2, 3],
                "object": {"key": "value"},
                "emptyString": "",
                "zero": 0,
                "false": false
            }
        };
        
        fs.writeFileSync(defaultConfigPath, JSON.stringify(mixedConfig));
        
        const propertiesmanager = require('../index.js').conf;
        
        expect(propertiesmanager.string).to.be.a('string');
        expect(propertiesmanager.number).to.be.a('number');
        expect(propertiesmanager.boolean).to.be.a('boolean');
        expect(propertiesmanager.null).to.be.null;
        expect(propertiesmanager.array).to.be.an('array');
        expect(propertiesmanager.object).to.be.an('object');
    });
});
