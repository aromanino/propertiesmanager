var config = require("../.././config/default.json");
var async=require('async');
var argv = require('minimist')(process.argv.slice(2));
var conf;
var key;
switch (process.env['NODE_ENV']) {
    case 'dev':
        conf = config.dev || config.production;
        key= config.dev ? 'dev' : 'production';
        break;
    case 'test':
        key= config.test ? 'test' : 'production';
        conf = config.test || config.production;
        break;
    default:
        conf = config.production;
        key='production';
        break;
}

async.eachOf(conf, function(param,index,callback) {
    console.log('Processing Key ' + index);
    if(argv[index])
        conf[index]=argv[index];
    callback();
},function(err){
    config[key]=conf;
});



exports.conf=conf;
exports.config=config;