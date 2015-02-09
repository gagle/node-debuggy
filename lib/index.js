'use strict';

var util = require('util');

var s = 1000;
var m = s * 60;
var h = m * 60;

var short = function (ms) {
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
};

var format = {
  isoDate: function (date) {
    var tzo = -date.getTimezoneOffset();
    var diff = tzo >= 0 ? '+' : '-';
    var pad = function (n) {
      return (n < 10 ? '0' : '') + n;
    };
    var padMilliseconds = function (n) {
      var str = n + '';
      while (str.length !== 3) {
        str = '0' + str;
      }
      return str;
    };

    return date.getFullYear() + '-' +
        pad(date.getMonth() + 1) + '-' +
        pad(date.getDate()) + 'T' +
        pad(date.getHours()) + ':' +
        pad(date.getMinutes()) + ':' +
        pad(date.getSeconds()) + '.' +
        padMilliseconds(date.getMilliseconds()) +
        diff +
        pad(Math.abs(Math.floor(tzo / 60))) + ':' +
        pad(Math.abs(Math.floor(tzo % 60)));
  },
  delay: function (ms) {
    return '+' + short(ms);
  }
};

exports.createLogger = function (options) {
  options = options || {};
  var env = options.env || 'DEBUG';
  var logger;

  var makeLogger = function (name) {
    var fn = function (subname) {
      return makeLogger((name ? name + ':' : '') + (subname || ''));
    };

    fn.debug = process.env[env]
        ? function () {
          if (!logger) logger = new Logger(options);
          logger.debug(name, Array.prototype.slice.call(arguments));
        }
        : function () {};

    return fn;
  };

  return makeLogger();
};

var Logger = function (options) {
  this._format = options.format || this._defaultFormatter;
  this._data = {};
  this._lastTime = 0;
};

Logger.prototype._defaultFormatter = function (data) {
  console.log(this.isoDate(data.date) + ' ' +
      this.delay(data.delay) + ' ' +
      (data.namespace ? data.namespace + ' ' : '') +
      util.format.apply(null, data.arguments));
};

Logger.prototype.debug = function (namespace, args) {
  var date = new Date();
  var now = date.getTime();

  this._data.namespace = namespace;
  this._data.arguments = args;
  this._data.date = date;
  this._data.delay = now - (this._lastTime || now);

  this._lastTime = now;

  this._format.call(format, this._data);
};