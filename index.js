



exports.readProperties=function(path){
    var config = require(path);
    var async=require('async');
    var argv = require('minimist')(process.argv.slice(2));

    switch (process.env['NODE_ENV']) {
        case 'dev':
            conf = config.dev || config.production;
            break;
        case 'test':
            conf = config.test || config.production;
            break;
        default:
            conf = config.production;
            break;
    }



    async.each(conf, function(param, callback) {
        console.log('Processing Key ' + param);
        if(argv[param])
            conf[param]=argv[param];
        callback();
    });
 return(conf);
};
