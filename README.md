# propertiesmanager

A powerful and flexible Node.js configuration management module with support for multiple environments, command-line overrides, environment variables, multi-file composition, hot reload, and advanced security features.

## Features

- 🌍 **Multiple environments** - production, dev, test with automatic fallback
- 🔧 **Command-line overrides** - Override any property via CLI arguments
- 🌐 **Environment variable support** - Override via `PM_*` environment variables
- 📁 **Multi-file configuration** - Compose configs from default.json, local.json, secrets.json
- 🔄 **Hot reload** - Automatically reload configuration when files change
- 🔒 **Security hardened** - Protection against prototype pollution and property injection
- 📝 **JSON5 support** - Use comments, trailing commas in your config files
- 📊 **Configurable logging** - Control verbosity with log levels
- 🔍 **Debug support** - Built-in debug logging with the debug module
- 📘 **TypeScript support** - Full TypeScript definitions included

This module helps to easily manage all the configuration properties needed in a system, giving a simple and consistent configuration interface to your application. The properties must have a profile category: **production**, **dev**, or **test**. Configuration files are stored in the `config` folder in your application home directory (`config/default.json`).

[![NPM](https://nodei.co/npm/propertiesmanager.png?downloads=true&downloadRank=true&stars=true)![NPM](https://nodei.co/npm-dl/propertiesmanager.png?months=6&height=3)](https://nodei.co/npm/propertiesmanager/)

 * [Installation](#installation) 
 * [Property file creation](#property-file-creation)
 * [Property file population](#property-file-population)
 * [Using propertiesmanager](#usage)
 * [Loading a running profile](#loading-a-running-profile)
 * [Override parameters from command line](#override-loaded-parameters-from-command-line)
 * [Override parameters from environment variables](#override-parameters-from-environment-variables)
 * [Multi-file configuration](#multi-file-configuration)
 * [Configuration hot reload](#configuration-hot-reload)
 * [Debugging and Logging](#debugging-and-logging)
 * [TypeScript Support](#typescript-support)
 * [Security](#security)
 * [Examples](#examples)
    

## Installation
To install **propertiesmanager**, type:

```shell
$ npm install propertiesmanager
```

## Property file creation
Configuration files must be created in a folder named `config` in the home directory of your application.
The filename must be named `default.json`. Type:
```shell
$ mkdir config
$ vi config/default.json
```

## Property file population
The file containing your properties is a JSON file having a mandatory dictionary called "production".
It contains all the configuration parameters of your application running in production or default mode.
Other dictionaries can be used, "dev" for development properties and "test" for testing properties.  

An example of empty property file:
```javascript
{
    "production":{}
}
```

An example of populated property file:
```javascript
{
    "production":{
        "properties_One":"One",
        "properties_Two":"Two",
        "Objectproperties":{
            "Obj_One":1,
            "Obj_Two":2
        }    
    }
}
```


An example of property file with dev and test dictionaries defined:
```javascript
{
    "production":{
        "properties_One":"One",
        "properties_Two":"Two",
        "Objectproperties":{
            "Obj_One":1,
            "Obj_Two":2
        }    
    },
    "test":{
       "properties_One":"TestOne",
       "Objectproperties":{
           "Obj_One":1,
           "Obj_Two":2
       }  
    },
    "dev":{
       "properties_One":"Test Development",
       "DevLogs":{
           "path":"/logs/log.xml",
           "format":"xml"
       }  
    }
}
```

## Usage

### Including propertiesmanager

Just require it like a simple package:

```javascript
var propertiesmanager = require('propertiesmanager').conf;
```

### Using propertiesmanager
propertiesmanager returns a dictionary containing all the properties from a configuration file.
These properties can be overridden by command line parameters.
```javascript
// Print all the loaded properties
console.log(propertiesmanager);   

```

## Loading a running profile
The application using this package runs under one profile among three (production, dev, test), set by NODE_ENV environment variable.
If NODE_ENV is not defined the default profile is **production**

Running your app in default mode. **production** properties are loaded:
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ npm start   
```

Running your app in production mode. **production** properties are loaded:
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ NODE_ENV=production npm start
```

Running your app in dev mode. **dev** properties are loaded:
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ NODE_ENV=dev npm start
```

Running your app in test mode. **test** properties are loaded:
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ NODE_ENV=test npm start
```

## Override loaded parameters from command line
The package propertiesmanager uses **[minimist](https://www.npmjs.com/package/minimist)** for parsing command-line arguments, so your properties stored in `default.json` can be 
overridden by command line parameters.

### Basic syntax
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ NODE_ENV=dev npm start -- --properties_One="Override_TestOne"
```

The first `--` after `npm start` means that the following params must be passed to `node bin/www`,
so if you run your application directly calling `node bin/www` the first `--` must be not used:
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ NODE_ENV=dev node bin/www --properties_One="Override_TestOne"
``` 

### Minimist syntax rules
Since this package uses **minimist**, the following syntax rules apply:

- `--key=value` → Sets `key` to `"value"` (string)
- `--key=123` → Sets `key` to `123` (number - minimist auto-converts)
- `--key=true` → Sets `key` to `"true"` (string)
- `--key=false` → Sets `key` to `"false"` (string)
- `--key` → Sets `key` to `true` (boolean - flag syntax)
- `--key=null` → Sets `key` to `null` (actual null value, not string)
- `--key=undefined` → Sets `key` to `undefined` (actual undefined value, not string)
- `--key=` → **Rejected** (empty string not allowed by design)

### Overriding nested properties
To override parameters that are complex objects, use dotted (".") notation:
 ```javascript
// Example: We want to override Obj_One property
// This is the structure in default.json:
{
     "production":{
         "properties_One":"One",
         "properties_Two":"Two",
         "Objectproperties":{
             "Obj_One":1,
             "Obj_Two":2
         }    
     }     
}
```

```shell
// Command to override the Obj_One value
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ NODE_ENV=dev node bin/www --Objectproperties.Obj_One="Override_Obj_One"
``` 

For further information about minimist syntax, see the [minimist documentation](https://www.npmjs.com/package/minimist).

## Override parameters from environment variables

Properties can also be overridden using environment variables with the `PM_` prefix. This is especially useful in containerized environments or CI/CD pipelines.

**Precedence order** (highest to lowest):
1. Environment variables (`PM_*`)
2. Command-line parameters
3. Configuration files

### Examples

```shell
# Override port via environment variable
$ PM_PORT=8080 node app.js

# Override nested properties (use uppercase for nested keys)
$ PM_DATABASE.HOST=localhost PM_DATABASE.PORT=5432 node app.js

# Combine with command line (command line has lower priority)
$ PM_PORT=8080 node app.js --database.name=mydb

# Set to null or undefined
$ PM_DATABASE.HOST=null node app.js
$ PM_CACHE.ENABLED=undefined node app.js
```

Environment variables are converted the same way as command-line parameters:
- Numbers are kept as strings (use command line for automatic number conversion)
- `"null"` string becomes `null`
- `"undefined"` string becomes `undefined`
- Empty strings are rejected

## Multi-file configuration

The package supports loading and merging multiple configuration files for better organization and security:

- `config/default.json` - Base configuration (required)
- `config/local.json` - Local overrides (optional, not committed to git)
- `config/secrets.json` - Sensitive data like API keys (optional, not committed to git)

**Merge precedence** (highest to lowest):
1. `config/secrets.json`
2. `config/local.json`
3. `config/default.json`

### Example

```javascript
// config/default.json (base configuration)
{"production": {"appName": "MyApp", "port": 3000, "db": {"host": "localhost"}}}

// config/local.json (developer overrides)
{"production": {"port": 8080, "db": {"host": "192.168.1.100"}}}

// config/secrets.json (credentials)
{"production": {"db": {"password": "secret123"}}}

// Result: port=8080, db.host=192.168.1.100, db.password=secret123
```

**Best practices:**
- Add `config/local.json` and `config/secrets.json` to `.gitignore`
- Use `default.json` for safe default values
- Use `local.json` for developer-specific settings
- Use `secrets.json` for sensitive credentials

## Configuration hot reload

The package can watch `config/default.json` for changes and automatically reload the configuration when the file is modified. **Hot reload is disabled by default** and must be explicitly enabled.

### Enabling hot reload

Enable via environment variable:

```shell
$ ENABLE_CONFIG_WATCH=true node app.js
```

**Note:** This must be set as an environment variable (not in config file) to avoid circular dependency issues.

### Usage

```javascript
var propertiesmanager = require('propertiesmanager');

// Listen for configuration reload events
propertiesmanager.configEvents.on('reload', function(newConfig) {
    console.log('Configuration reloaded!');
    console.log('New config:', newConfig);
    
    // Update your application state with new config
    // For example, restart a service, reconnect to database, etc.
});

// Access current configuration
console.log(propertiesmanager.conf);
```

### How it works

- The file watcher monitors `config/default.json` for changes
- When a change is detected, the configuration is automatically reloaded
- The `reload` event is emitted with the new configuration
- Changes are reflected immediately in `propertiesmanager.conf` (by reference)

**Note:** Hot reload only watches `config/default.json`. Changes to `local.json` or `secrets.json` require an application restart.

**Production use:** Hot reload is disabled by default, making it safe for production. Only enable it in development environments where you need automatic configuration updates.

## Debugging and Logging

The package uses the [debug](https://www.npmjs.com/package/debug) module for internal logging with configurable verbosity levels.

### Log levels

Available levels (from most to least verbose): `debug`, `info`, `warn`, `error`

**Default:** `info`

### Configuration

Set via environment variable (recommended) or config file:

```shell
# Show internal debug messages
$ DEBUG=propertiesmanager LOG_LEVEL=debug node app.js

# Production: only errors and warnings
$ LOG_LEVEL=warn node app.js

# In config/default.json
{
    "production": {
        "LOG_LEVEL": "info",
        "appName": "MyApp"
    }
}
```

### Debug output example

When `DEBUG=propertiesmanager` is set, you'll see:

```
propertiesmanager Processing key: appName +0ms
propertiesmanager Processing key: server +2ms
propertiesmanager Configuration loaded successfully for environment: production +5ms
```

Useful for troubleshooting configuration loading or tracking which properties are being overridden.

## TypeScript Support

The package includes TypeScript type definitions. TypeScript projects can import and use it with full type support:

```typescript
import { conf } from 'propertiesmanager';

// conf is typed as Record<string, any>
const port: number = conf.server.port;
const appName: string = conf.appName;
```

For better type safety, you can define your own interface:

```typescript
interface MyConfig {
    appName: string;
    server: {
        host: string;
        port: number;
    };
    database: {
        host: string;
        name: string;
    };
}

import { conf } from 'propertiesmanager';
const config = conf as MyConfig;

// Now fully typed!
const port: number = config.server.port;
```

## Security

**propertiesmanager** implements multiple security protections to prevent common configuration-based attacks:

### Prototype Pollution Protection
The package actively blocks attempts to pollute JavaScript prototypes through command-line arguments:

- **`__proto__`** - Automatically filtered and rejected
- **`constructor`** - Blocked at all nesting levels
- **`prototype`** - Cannot be used as property name

These protections prevent attackers from injecting malicious properties into JavaScript's object prototype chain, which could lead to:
- Remote Code Execution (RCE)
- Denial of Service (DoS)
- Authentication bypass
- Property injection attacks

```shell
# These malicious attempts are automatically blocked:
$ node app.js --__proto__.polluted=true          # ❌ BLOCKED
$ node app.js --constructor.prototype.admin=true # ❌ BLOCKED
$ node app.js --prototype.isAdmin=true           # ❌ BLOCKED
```

### Property Injection Prevention
The package only allows overriding **existing** properties defined in `default.json`:

- ✅ Cannot add new properties via command line
- ✅ Cannot add new nested properties
- ✅ Only pre-defined configuration keys can be modified

```javascript
// If default.json contains:
{
    "production": {
        "port": 3000,
        "debug": false
    }
}

// This works (overrides existing property):
$ node app.js --port=8080           // ✅ OK

// This is silently ignored (property doesn't exist):
$ node app.js --malicious=payload   // ❌ IGNORED
```

### Empty String Rejection
Empty values via `--key=` syntax are rejected by design to prevent accidental configuration corruption:

```shell
$ node app.js --database.host=   # ❌ REJECTED (empty string)
$ node app.js --database.host=null  # ✅ OK (explicit null)
```

### Path Traversal Protection
The package safely handles path-like strings and prevents directory traversal attempts:

```shell
$ node app.js --configPath=../../etc/passwd  # ✅ Treated as safe string value
```

### Injection Attack Safety
SQL injection, XSS, and other injection patterns are safely handled as regular string values without special interpretation.

### Comprehensive Test Coverage
All security features are validated through 113 automated tests, including specific vulnerability tests in `test/security-integrity.test.js`.

### Error Handling
The package provides clear error messages when configuration files are missing or invalid:

```
ERROR: config/default.json not found or invalid.
Please create config/default.json in your application root directory.
See https://github.com/aromanino/propertiesmanager for documentation.
```

This prevents silent failures and helps developers quickly identify configuration issues.

## Examples

### File Properties creation
From your home project directory type:
```shell
$ mkdir config
$ vi config/default.json
```

Write `default.json` property file:
```javascript
{
    "production":{
        "properties_One":"One",
        "properties_Two":"Two",
        "Objectproperties":{
            "Obj_One":1,
            "Obj_Two":2
        }    
    },
    "test":{
       "properties_One":"TestOne",
       "Objectproperties":{
           "Obj_One":1,
           "Obj_Two":2
       }  
    },
    "dev":{
       "properties_One":"Test Development",
       "DevLogs":{
           "path":"/logs/log.xml",
           "format":"xml"
       }  
    }
}
``` 
Now you can print all your properties:
```javascript
var propertiesmanager = require('propertiesmanager').conf;

// Print the loaded properties to console
console.log("########### Read Properties ###########" );
console.log(propertiesmanager);   

```

Running your app in default mode, production properties are loaded:
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ npm start
########### Read Properties ###########
"production":{
          "properties_One":"One",
          "properties_Two":"Two",
          "Objectproperties":{
              "Obj_One":1,
              "Obj_Two":2
          }    
      }     
```

Running your app in production mode `(NODE_ENV=production)` is equivalent to run in default mode:
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ NODE_ENV=production npm start
########### Read Properties ###########
"production":{
          "properties_One":"One",
          "properties_Two":"Two",
          "Objectproperties":{
              "Obj_One":1,
              "Obj_Two":2
          }    
      }     
```

Running your app in dev mode `(NODE_ENV=dev)`, dev properties are loaded:
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ NODE_ENV=dev npm start
########### Read Properties ###########
"dev":{
       "properties_One":"Test Development",
       "DevLogs":{
           "path":"/logs/log.xml",
           "format":"xml"
       }  
    }
```

Running your app in test mode `(NODE_ENV=test)`, test properties are loaded:
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ NODE_ENV=test npm start
########### Read Properties ###########
 "test":{
       "properties_One":"TestOne",
       "Objectproperties":{
           "Obj_One":1,
           "Obj_Two":2
       }  
    }
```


Overriding some test mode `(NODE_ENV=test)` properties:
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ NODE_ENV=test npm start -- --properties_One="Override_TestOne"
########### Read Properties ###########
 "test":{
       "properties_One":"Override_TestOne",
       "Objectproperties":{
           "Obj_One":1,
           "Obj_Two":2
       }  
    }
```



License - "MIT License"
-----------------------

MIT License

Copyright (c) 2016 aromanino

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Author
------
CRS4 Microservice Core Team ([cmc.smartenv@crs4.it](mailto:cmc.smartenv@crs4.it))

Contributors
------
Alessandro Romanino ([a.romanino@gmail.com](mailto:a.romanino@gmail.com))<br>
Guido Porruvecchio ([guido.porruvecchio@gmail.com](mailto:guido.porruvecchio@gmail.com))
