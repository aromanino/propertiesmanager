# propertiesmanager
This module deals with the management of  configuration file of properties used for give a simple and consistent configuration
interface to your application. The package lets you to define a set of parameters of three macro types **production**,**dev**,**test** 
File properties are stored in folder config in a file named properties.json within your application home directory(.../config/properties.json).
The package use **npm minimist** so your properties can be overridden and extended command line parameters.



 * [Installation](#installation) 
 * [File properties creation](#creation)
 * [File properties population](#populate)
 * [Using propertiesmanager](#using)
 * [Loading production or dev or test parameters](#load)
 * [Ovverride parameters from command line](#override)
 * [Examples](#examples)
    

## <a name="installation"></a>Installation
To use **propertiesmanager** install it in your project by typing:

```shell
$ npm install propertiesmanager
```

## <a name="creation"></a>File properties creation
Configuration file of properties must be created in a folder named config in the home directory of your application.
The filename must be: default.json. 
To create it type:
```shell
$ mkdir config
$ vi config/default.json
```

## <a name="populate"></a>File properties population
File properties is a JSON file and it must have a mandatory dictionary called "production".
It contains all properties e configuration parameter of your application running in production or default mode.
Other not mandatory dictionary should be called "dev" for development properties and "test" for testing properties.  

Next an example of empty  mandatory file properties
```javascript
{
    "production":{  
            "content":"...."   
    }
}
```

Next an example of not empty  mandatory file properties
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


Next an example of properties file with env and test properties defined
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



## <a name="using"></a>Using propertiesmanager

### Include propertiesmanager

Just require it like a simple package:

```javascript
var propertiesmanager = require('propertiesmanager');
```

### Using propertiesmanager
propertiesmanager return a dictionary containing the properties from file of properties.
This properties can be overridden and extended by command line parameters.
seeing that the file properties can have three different running configuration (production, dev, test),
to load a particular configuration you can get it setting  NODE_ENV environment variable.
```javascript

   var propertiesmanager = require('propertiesmanager');
   
   // print the loaded properties dictionary
   console.log(propertiesmanager);   

```



## <a name="load"></a>Loading production or dev or test parameters
File properties can have three different running configuration (production, dev, test),
to load a particular configuration you can get it setting  NODE_ENV environment variable.
If NODE_ENV is not defined or specified the default properties loaded are the **production**

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



## <a name="override"></a>Ovverride loaded parameters from command line
The package propertiesmanager use **npm minimist** so your properties stored in default.json can be 
overridden and extended by command line parameters. To extend it you must 
type in command line --ParamName=ParamValues like in the example bellow: 

Override "properties_One" in dev mode(NODE_ENV=dev) properties from default.json :
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ NODE_ENV=dev npm start -- --properties_One="Override_TestOne"
```

The first "--" after npm start must be used to indicate at npm that the next params must be passed to node bin/www,
so if you run your application with  `node bin/www` the fist "--" should be not used as bellow:
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ NODE_ENV=dev node bin/www --properties_One="Override_TestOne"
``` 

To override leaves parameters in tree structure to overrun branches, use doted(".") syntax like in this example:
 ```javascript
 
  // We Want Override Obj_One
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

To override "Obj_One" use doted syntax " --Objectproperties **.** Obj_One="Override_Obj_One" "like bellow:

```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ NODE_ENV=dev node bin/www --Objectproperties.Obj_One="Override_Obj_One"
``` 



For other information about passing parameter see `https://www.npmjs.com/package/minimist`

## <a name="examples"></a>`Examples`

### File Properties creation
From a shell go in your home project directory and type:
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ mkdir config
$ vi config/default.json
```

Populate file properties contents like this:
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

Code example that prints properties
```javascript

   var propertiesmanager = require('propertiesmanager');
   
   // print the loaded properties dictionary
   console.log("########### Readed Properties ###########" );
   console.log(propertiesmanager);   

```

Running your app in default mode load production properties from default.json :
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ npm start
########### Readed Properties ###########
"production":{
          "properties_One":"One",
          "properties_Two":"Two",
          "Objectproperties":{
              "Obj_One":1,
              "Obj_Two":2
          }    
      }     
```

running your app in production mode(NODE_ENV=productions) is equivalent to run in default mode:
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ NODE_ENV=production npm start
########### Readed Properties ###########
"production":{
          "properties_One":"One",
          "properties_Two":"Two",
          "Objectproperties":{
              "Obj_One":1,
              "Obj_Two":2
          }    
      }     
```


running your app in dev mode(NODE_ENV=dev) load dev properties from default.json :
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ NODE_ENV=dev npm start
########### Readed Properties ###########
"dev":{
       "properties_One":"Test Development",
       "DevLogs":{
           "path":"/logs/log.xml",
           "format":"xml
       }  
    }
```

running your app in test mode(NODE_ENV=test) load test properties from default.json :
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ NODE_ENV=test npm start
########### Readed Properties ###########
 "test":{
       "properties_One":"TestOne",
       "Objectproperties":{
           "Obj_One":1,
           "Obj_Two":2
       }  
    }
```


Override some test mode(NODE_ENV=test) properties from default.json :
```shell
$ cd "YOUR_APPLICATION_HOME_DIRECTORY"
$ NODE_ENV=dev npm start -- --properties_One="Override_TestOne"
########### Readed Properties ###########
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
Alessandro Romanino ([a.romanino@gmail.com](mailto:a.romanino@gmail.com))
