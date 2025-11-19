const { expect } = require('chai');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('PropertiesManager - Real-World Integration Tests', function() {
    this.timeout(5000);
    const configDir = path.join(__dirname, '..', 'config');
    const defaultConfigPath = path.join(configDir, 'default.json');
    let originalConfig;

    function runNodeWithArgs(args, env = {}) {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(__dirname, 'helpers', 'load-config.js');
            const nodeProcess = spawn('node', [scriptPath, ...args], {
                cwd: path.join(__dirname, '..'),
                env: { ...process.env, ...env }
            });

            let output = '';
            nodeProcess.stdout.on('data', (data) => output += data.toString());
            nodeProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Process exited with code ${code}`));
                } else {
                    try {
                        const lines = output.trim().split('\n');
                        resolve(JSON.parse(lines[lines.length - 1]));
                    } catch (e) {
                        reject(new Error(`Failed to parse output: ${output}`));
                    }
                }
            });
        });
    }

    before(function() {
        originalConfig = fs.readFileSync(defaultConfigPath, 'utf8');
        const helpersDir = path.join(__dirname, 'helpers');
        if (!fs.existsSync(helpersDir)) {
            fs.mkdirSync(helpersDir);
        }
        const helperScript = `const propertiesmanager = require('../../index.js').conf;\nconsole.log(JSON.stringify(propertiesmanager));`;
        fs.writeFileSync(path.join(helpersDir, 'load-config.js'), helperScript);
    });

    afterEach(function() {
        fs.writeFileSync(defaultConfigPath, originalConfig);
        delete require.cache[require.resolve('../index.js')];
        delete require.cache[require.resolve('../config/default.json')];
        delete process.env.NODE_ENV;
    });

    it('should support typical microservice configuration', async function() {
        const config = {
            "production": {
                "service": {
                    "name": "user-service",
                    "version": "1.0.0",
                    "port": 3000
                },
                "database": {
                    "host": "prod-db.example.com",
                    "port": 5432,
                    "name": "users",
                    "pool": {
                        "min": 2,
                        "max": 10
                    }
                },
                "redis": {
                    "host": "redis.example.com",
                    "port": 6379
                },
                "logging": {
                    "level": "info",
                    "format": "json"
                }
            },
            "dev": {
                "service": {
                    "name": "user-service-dev",
                    "port": 3001
                },
                "database": {
                    "host": "localhost",
                    "name": "users_dev"
                },
                "logging": {
                    "level": "debug"
                }
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(
            ['--service.port=8080', '--database.host=override.db'],
            { NODE_ENV: 'production' }
        );
        
        expect(result.service.name).to.equal('user-service');
        expect(result.service.port).to.equal(8080); // minimist converts to number
        expect(result.database.host).to.equal('override.db');
        expect(result.database.port).to.equal(5432);
    });

    it('should support web application configuration pattern', async function() {
        const config = {
            "production": {
                "server": {
                    "host": "0.0.0.0",
                    "port": 80,
                    "ssl": {
                        "enabled": true,
                        "cert": "/etc/ssl/cert.pem",
                        "key": "/etc/ssl/key.pem"
                    }
                },
                "session": {
                    "secret": "prod-secret",
                    "maxAge": 86400000,
                    "secure": true
                },
                "cors": {
                    "origin": "https://example.com",
                    "credentials": true
                }
            },
            "dev": {
                "server": {
                    "port": 3000,
                    "ssl": {
                        "enabled": false
                    }
                },
                "session": {
                    "secret": "dev-secret",
                    "secure": false
                },
                "cors": {
                    "origin": "*"
                }
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(
            ['--server.port=4000'],
            { NODE_ENV: 'dev' }
        );
        
        expect(result.server.port).to.equal(4000); // minimist converts to number
        expect(result.session.secret).to.equal('dev-secret');
        expect(result.cors.origin).to.equal('*');
    });

    it('should support API gateway configuration pattern', async function() {
        const config = {
            "production": {
                "gateway": {
                    "port": 8080,
                    "timeout": 30000
                },
                "services": {
                    "users": "http://users-service:3000",
                    "orders": "http://orders-service:3000",
                    "payments": "http://payments-service:3000"
                },
                "rateLimit": {
                    "windowMs": 900000,
                    "max": 100
                },
                "authentication": {
                    "jwt": {
                        "secret": "production-secret",
                        "expiresIn": "1h"
                    }
                }
            },
            "dev": {
                "gateway": {
                    "port": 8000
                },
                "services": {
                    "users": "http://localhost:3001",
                    "orders": "http://localhost:3002",
                    "payments": "http://localhost:3003"
                },
                "rateLimit": {
                    "max": 1000
                }
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(
            ['--gateway.port=9000', '--services.users=http://custom-users:3000'],
            { NODE_ENV: 'dev' }
        );
        
        expect(result.gateway.port).to.equal(9000); // minimist converts to number
        expect(result.services.users).to.equal('http://custom-users:3000');
        expect(result.services.orders).to.equal('http://localhost:3002');
    });

    it('should support scheduled job/worker configuration pattern', async function() {
        const config = {
            "production": {
                "worker": {
                    "type": "scheduled-job",
                    "schedule": "0 */6 * * *",
                    "concurrency": 5
                },
                "job": {
                    "dataSync": {
                        "enabled": true,
                        "source": "https://api.example.com/data",
                        "destination": "s3://bucket/path"
                    },
                    "cleanup": {
                        "enabled": true,
                        "retentionDays": 30
                    }
                },
                "notifications": {
                    "slack": {
                        "webhook": "https://hooks.slack.com/xxx",
                        "channel": "#alerts"
                    },
                    "email": {
                        "from": "jobs@example.com",
                        "to": ["admin@example.com"]
                    }
                }
            },
            "dev": {
                "worker": {
                    "schedule": "*/5 * * * *",
                    "concurrency": 1
                },
                "job": {
                    "dataSync": {
                        "source": "http://localhost:3000/data",
                        "destination": "file://./temp"
                    }
                },
                "notifications": {
                    "slack": {
                        "webhook": null
                    }
                }
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(
            ['--worker.schedule=*/10 * * * *'],
            { NODE_ENV: 'dev' }
        );
        
        expect(result.worker.schedule).to.equal('*/10 * * * *');
        expect(result.worker.concurrency).to.equal(1);
        expect(result.job.dataSync.source).to.equal('http://localhost:3000/data');
    });

    it('should support Docker/container deployment configuration', async function() {
        const config = {
            "production": {
                "container": {
                    "name": "app-prod",
                    "image": "myapp:latest",
                    "restart": "always"
                },
                "environment": {
                    "NODE_ENV": "production",
                    "LOG_LEVEL": "info",
                    "ENABLE_METRICS": "true"
                },
                "resources": {
                    "cpu": "1.0",
                    "memory": "2G"
                },
                "healthCheck": {
                    "endpoint": "/health",
                    "interval": 30,
                    "timeout": 10
                }
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs([
            '--environment.LOG_LEVEL=debug',
            '--resources.memory=4G',
            '--healthCheck.interval=60'
        ]);
        
        expect(result.environment.LOG_LEVEL).to.equal('debug');
        expect(result.resources.memory).to.equal('4G');
        expect(result.healthCheck.interval).to.equal(60); // minimist converts to number
    });

    it('should handle npm start scenario with double dash', async function() {
        const config = {
            "production": {
                "app": "myapp",
                "port": 3000,
                "debug": false
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        // Simulates: npm start -- --port=8080 --debug=true
        const result = await runNodeWithArgs(['--port=8080', '--debug=true']);
        
        expect(result.port).to.equal(8080); // minimist converts to number
        expect(result.debug).to.equal('true'); // minimist keeps as string with = syntax
    });

    it('should support multi-tenant SaaS configuration', async function() {
        const config = {
            "production": {
                "platform": {
                    "name": "SaaS Platform",
                    "multiTenant": true
                },
                "defaults": {
                    "storage": "100GB",
                    "users": 10,
                    "features": {
                        "api": true,
                        "webhooks": false,
                        "customDomain": false
                    }
                },
                "billing": {
                    "provider": "stripe",
                    "currency": "USD"
                }
            },
            "dev": {
                "defaults": {
                    "storage": "unlimited",
                    "users": 9999,
                    "features": {
                        "api": true,
                        "webhooks": true,
                        "customDomain": true
                    }
                }
            }
        };
        fs.writeFileSync(defaultConfigPath, JSON.stringify(config));
        
        const result = await runNodeWithArgs(
            ['--defaults.storage=500GB', '--defaults.users=50'],
            { NODE_ENV: 'production' }
        );
        
        expect(result.defaults.storage).to.equal('500GB');
        expect(result.defaults.users).to.equal(50); // minimist converts to number
        expect(result.billing.provider).to.equal('stripe');
    });
});
