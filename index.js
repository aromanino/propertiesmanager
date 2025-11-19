/**
 * propertiesmanager - Configuration management module
 * 
 * Loads configuration from config/default.json with support for:
 * - Multiple environments (production/dev/test)
 * - Command-line parameter overrides via minimist
 * - Environment variable overrides (PM_* prefix)
 * - Multi-file configuration composition (default.json, local.json, secrets.json)
 * - Configuration hot reload with event notification
 * - Configurable logging levels (debug/info/warn/error)
 * - JSON5 format support (comments, trailing commas, etc.)
 * - Prototype pollution protection
 * - Type conversion for null/undefined values
 * 
 * @module propertiesmanager
 * @see {@link https://github.com/aromanino/propertiesmanager}
 */

var requireJSON5 = require('require-json5');
var debug = require('debug')('propertiesmanager');
var fs = require('fs');
var EventEmitter = require('events');
var configEvents = new EventEmitter();

// Utility to deep merge objects
function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

// Convert string literals 'null' or 'undefined' to actual null/undefined values
function convertNullUndefined(value) {
    if (value === 'null') return null;
    if (value === 'undefined') return undefined;
    return value;
}

// Load configuration file with error handling
try {
    var config = requireJSON5("config/default.json");
    // Merge config/local.json if present
    try {
        var localConfig = requireJSON5("config/local.json");
        config = deepMerge(config, localConfig);
    } catch(e) {}
    // Merge config/secrets.json if present
    try {
        var secretsConfig = requireJSON5("config/secrets.json");
        config = deepMerge(config, secretsConfig);
    } catch(e) {}
} catch(err) {
    console.error('ERROR: config/default.json not found or invalid.');
    console.error('Please create config/default.json in your application root directory.');
    console.error('See https://github.com/aromanino/propertiesmanager for documentation.');
    process.exit(1);
}

// Logging level support (debug/info/warn/error)
var LOG_LEVEL = process.env.LOG_LEVEL || (config.LOG_LEVEL) || 'info';
function log(level, ...args) {
    const levels = ['error', 'warn', 'info', 'debug'];
    if (levels.indexOf(level) <= levels.indexOf(LOG_LEVEL)) {
        if (level === 'error') console.error(...args);
        else if (level === 'warn') console.warn(...args);
        else if (level === 'info') console.info(...args);
        else debug(...args);
    }
}

var async=require('async');
var _=require('underscore');
var argv = require('minimist')(process.argv.slice(2));
// Environment variable prefix for overrides
var ENV_PREFIX = 'PM_';


// Configuration object and environment key
var conf;
var key;

// Select configuration based on NODE_ENV environment variable
// Fallback to production if requested environment is not defined
switch (process.env['NODE_ENV']) {
    case 'dev':
        conf = config.dev || config.production;
        key = config.dev ? 'dev' : 'production';
        break;
    case 'test':
        key = config.test ? 'test' : 'production';
        conf = config.test || config.production;
        break;
    default:
        conf = config.production;
        key = 'production';
        break;
}

// Remove minimist's internal '_' array (contains non-flag arguments)
delete argv["_"];

// Security: Remove dangerous prototype pollution keys
// Prevents attacks via --__proto__.polluted=true, --constructor.polluted=true, etc.
delete argv["__proto__"];
delete argv["constructor"];
delete argv["prototype"];

// Export configuration immediately with base config
// Changes from command-line processing will be reflected automatically (by reference)
exports.conf = conf;
// Expose event emitter for config reload
exports.configEvents = configEvents;

// Process each configuration property asynchronously
// Apply command-line overrides if provided via --key=value syntax
async.eachOf(conf, function(param, index, callback) {
    log('debug', 'Processing key:', index);

    // Security check: Block prototype pollution attempts
    if (index === '__proto__' || index === 'constructor' || index === 'prototype') {
        callback();
        return;
    }

    // 1. Check for environment variable override (PM_KEY)
    var envKey = ENV_PREFIX + index.toUpperCase();
    var envValue = process.env[envKey];
    if (envValue !== undefined && envValue !== '') {
        setValueAndKey(convertNullUndefined(envValue), conf, index, function (err) {
            callback();
        });
        return;
    }
    // 2. Check for command-line override
    if (argv[index] !== undefined && argv[index] !== '') {
        setValueAndKey(convertNullUndefined(argv[index]), conf, index, function (err) {
            callback();
        });
        return;
    }
    // 3. No override, continue to next property
    callback();

}, function(err) {
    // Error handling for async processing
    if (err) {
        log('error', 'ERROR processing configuration:', err);
        process.exit(1);
    }
    config[key] = conf;
    
    // Hot reload: watch config file and reload on change (disabled by default, enable via ENABLE_CONFIG_WATCH env var)
    var configPath = "config/default.json";
    var enableWatch = process.env.ENABLE_CONFIG_WATCH === 'true';
    
    if (enableWatch && fs.existsSync(configPath)) {
        fs.watch(configPath, { persistent: false }, function (eventType) {
            if (eventType === 'change') {
                try {
                    var newConfig = requireJSON5(configPath);
                    var newConf = newConfig[key] || newConfig.production;
                    Object.assign(conf, newConf);
                    configEvents.emit('reload', conf);
                    log('info', 'Configuration hot-reloaded for environment:', key);
                } catch (err) {
                    log('error', 'Error reloading config:', err);
                }
            }
        });
        log('debug', 'Config file watcher enabled for:', configPath);
    } else if (!enableWatch) {
        log('debug', 'Config file watcher disabled (set ENABLE_CONFIG_WATCH=true to enable)');
    }
    
    log('info', 'Configuration loaded successfully for environment:', key);
    // conf is already exported by reference, so changes are reflected automatically
});


/**
 * Recursively sets a value in the configuration object
 * 
 * Handles both simple values and nested objects using dot notation.
 * Only updates properties that already exist in the configuration (no property injection).
 * 
 * @param {*} argvTmp - Value to set (can be any type including object)
 * @param {Object} currentObj - Current object in the configuration tree
 * @param {string} currentKey - Key to set in the current object
 * @param {Function} callbackEnd - Callback function to call when done
 * 
 * @example
 * // Simple value: --port=8080
 * setValueAndKey(8080, config, 'port', callback);
 * 
 * // Nested object: --server.port=8080
 * setValueAndKey({port: 8080}, config, 'server', callback);
 */
function setValueAndKey(argvTmp, currentObj, currentKey, callbackEnd) {
    // Security check: Block prototype pollution attempts at any nesting level
    if (currentKey === '__proto__' || currentKey === 'constructor' || currentKey === 'prototype') {
        callbackEnd(null);
        return;
    }
    
    // Handle simple values (strings, numbers, booleans, null, undefined)
    if ((typeof argvTmp !== "object") || argvTmp === null) {
        // Only update if property already exists (no property injection)
        if (_.has(currentObj, currentKey)) {
            currentObj[currentKey] = argvTmp;
        }
        callbackEnd(null);
    } else {
        // Handle nested objects - recursively process each property
        var keys = _.keys(argvTmp);
        async.eachOf(keys, function(value, key, callback) {
            // Security check: Block prototype pollution in nested properties
            if (value === '__proto__' || value === 'constructor' || value === 'prototype') {
                callback();
                return;
            }
            
            // Only process if the parent object exists
            if (currentObj[currentKey]) {
                // Recursively process nested property with null/undefined conversion
                setValueAndKey(convertNullUndefined(argvTmp[value]), currentObj[currentKey], value, function (err) {
                    callback();
                });
            } else {
                // Parent doesn't exist, skip this property
                callback();
            }
        }, function (err) {
            callbackEnd(null);
        });
    }

}
