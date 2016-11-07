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


var args={};

async.eachOf(argv,function(value,keyP,callb){
    var Keys=keyP.split(".");
    var mainKey;

    mainKey=Keys[0];
    args[mainKey]={"value":value, "subKey":[]};

    for(var index=1;index < Keys.length; ++ index){
        args[mainKey].subKey=args[mainKey].subKey.push(Keys[index]);
    }

    callb();

},function(err){

    console.dir(args);
    async.eachOf(conf, function(param,index,callback) {
        console.log('Processing Key ' + index);

        var tmpKey;
        var tmpObj;

        if(args[index]) {
            tmpObj=conf;
            tmpKey=index;
            for(var counter=0;counter< args[index].subKey.length;++counter){
                tmpObj=tmpObj[tmpKey];
                tmpKey=args[index].subKey[counter];
            }
            tmpObj[tmpKey] = args[index].value;
        }
        callback();
    },function(err){
        config[key]=conf;
    });
});




exports.conf=conf;
exports.config=config;