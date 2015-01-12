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

    return date.getFullYear() + '-' +
        pad(date.getMonth() + 1) + '-' +
        pad(date.getDate()) + 'T' +
        pad(date.getHours()) + ':' +
        pad(date.getMinutes()) + ':' +
        pad(date.getSeconds()) +
        diff +
        pad(Math.abs(Math.floor(tzo / 60))) + ':' +
        pad(Math.abs(Math.floor(tzo % 60)));
  },
  delay: function (ms) {
    return '+' + short(ms);
  }
};

module.exports.createLogger = function (options) {
  options = options || {};
  options.env = options.env || 'DEBUG';
  var logger;

  var makeLogger = function (name) {
    return function (subname) {
      var namespace = (name ? name + ':' : '') + (subname || '');
      var fn = makeLogger(namespace);
      fn.debug = process.env[options.env]
        ? function () {
          if (!logger) logger = new Logger(options);
          logger.debug(namespace, Array.prototype.slice.call(arguments));
        }
        : function () {};
      return fn;
    };
  };

  return makeLogger();
};

var Logger = function (options) {
  this._format = options.format || this._defaultFormatter;
  this._stats = {};
  this._lastTime = 0;
};

Logger.prototype._defaultFormatter = function (stats) {
  console.log(this.isoDate(stats.date) + ' ' +
      this.delay(stats.delay) + ' ' +
      (stats.namespace ? stats.namespace + ' ' : '') +
      stats.message);
};

Logger.prototype.debug = function (namespace, args) {
  var date = new Date();
  var now = date.getTime();

  this._stats.namespace = namespace;
  this._stats.message = util.format.apply(null, args);
  this._stats.date = date;
  this._stats.delay = now - (this._lastTime || now);

  this._lastTime = now;

  this._format.call(format, this._stats);
};