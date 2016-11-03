var express = require('express');
var conf=require('./config').conf;
var request = require('request');
var _=require("underscore");


exports.configure =  function(config) {
    conf.decodedTokenFieldName= config.decodedTokenFieldName || conf.decodedTokenFieldName;
    conf.authoritationMicroservice.url=config.authoritationMicroserviceUrl || conf.authoritationMicroservice.url;
    conf.authoritationMicroservice.access_token=config.access_token || conf.authoritationMicroservice.access_token;
    conf.exampleUrl = config.exampleUrl || conf.exampleUrl;
    conf.tokenFieldName= config.tokenFieldName || conf.tokenFieldName;
};

