debuggy
=======

#### Debugging utility tool for development ####

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![coveralls][coveralls-image]][coveralls-url]

This utility is similar to the [debug][debug-module] module but without being a singleton, that is, it doesn't enable the debug mode of other third-party modules, which is undesirable. By default, the `DEBUG` environment variable is checked and it can contain any value, e.g. `DEBUG=true`.

The default formatter prints the messages to the stdout but you're free to log them anywhere by configuring a custom formatter. It also allows subnamespaces similar to the [bole][bole-module] module.

```javascript
// app.js
var debuggy = require('debuggy');
var logger = debuggy.createLogger();
var debug = logger('boot')('http').debug;

debug('Booting up HTTPS server');
```

```
$ node app.js
$ DEBUG=true node app.js
2015-01-12T14:17:00.302+01:00 +0ms boot:http Booting up HTTPS server
```

#### Custom formatter and environment variable ####

```javascript
var util = require('util');
var debuggy = require('./lib');

var logger = debuggy.createLogger({
  env: 'TEST',
  // This is the default formatter function, adapt it to your needs
  format: function (data) {
    console.log(this.isoDate(data.date) + ', ' +
        this.delay(data.delay) +
        (data.namespace ? ', ' + data.namespace : '') + ', ' +
        util.format.apply(null, data.arguments));
  }
});
var debug = logger('boot')('http').debug;

// If process.env.TEST is truthy is will print the message
debug('Booting up HTTPS server');
```

```
$ node app.js
$ DEBUG=true node app.js
$ TEST=true node app.js
2015-01-12T14:17:50.207+01:00, +0ms, boot:http, Booting up HTTPS server
```

___module_.createLogger([options]) : Function__  
Returns a new logger instance. This instance is a function that creates a namespace when called (the namespace is optional). This new namespace can also create new subnamespaces, and so on. Each "namespace-maker" function has a `debug` function to log the messages.

```javascript
var logger = require('debuggy').createLogger();
var debug;

debug = logger.debug;
// debug('foo') <timestamp> <delay> 'foo'

debug = logger('a').debug;
// debug('foo') -> <timestamp> <delay> a 'foo'

debug = logger('a')('b').debug;
// debug('foo') -> <timestamp> <delay> a:b 'foo'
```

Options:

- __env__ - _String_  
  Name of the environment variable that's checked to print the messages or not. Default is `DEBUG`.
- __format__ - _Function_  
  Function that formats the messages. By default, it prints to the stdout. It receives one argument, `data`, an object with the raw data. It contains the following properties:

  - __arguments__ - _Array_  
    Array of arguments passed to `logger.debug()`.
  - __date__ - _Date_  
    `Date` instance of the current timestamp.
  - __delay__ - _Number_  
    Milliseconds between logging calls.
  - __namespace__ - _String_ | _undefined_  
    Name of the namespace.

  `this` points to an object with some formatting functions:

  - __this.isoDate(date) : String__  
    Returns de ISO date as string including the timezone offset.
  - __this.delay(ms) : String__  
    Returns a more readable string representation of the delay between logging calls.

__logger.debug(...arguments) : undefined__  
Logs a message. The parameters are untouched and are available in the custom formatter function in the `data.arguments` property.

[npm-image]: https://img.shields.io/npm/v/debuggy.svg?style=flat
[npm-url]: https://npmjs.org/package/debuggy
[travis-image]: https://img.shields.io/travis/gagle/node-debuggy.svg?style=flat
[travis-url]: https://travis-ci.org/gagle/node-debuggy
[coveralls-image]: https://img.shields.io/coveralls/gagle/node-debuggy.svg?style=flat
[coveralls-url]: https://coveralls.io/r/gagle/node-debuggy
[debug-module]: https://github.com/visionmedia/debug
[bole-module]: https://github.com/rvagg/bole
[util-format]: http://nodejs.org/api/util.html#util_util_format_format
