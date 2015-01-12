'use strict';

var sinon  = require('sinon');
var code = require('code');
var lab = module.exports.lab = require('lab').script();

var expect = code.expect;
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;

var debuggy = require('../lib');

var formatISODate = function (date) {
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
};

describe('debuggy', function () {
  var logger;
  var clock;

  before(function (done) {
    process.env.DEBUG = true;
    sinon.stub(console, 'log');
    done();
  });

  beforeEach(function (done) {
    logger = debuggy.createLogger();
    clock = sinon.useFakeTimers('Date');
    done();
  });

  afterEach(function (done) {
    console.log.reset();
    clock.restore();
    done();
  });

  it('createLogger() returns a new instance', function (done) {
    var instance1 = debuggy.createLogger();
    var instance2 = debuggy.createLogger();
    expect(instance1).to.be.a.function().and.not.to.be.equal(instance2);

    done();
  });

  it('formats the message with a default formatter', function (done) {
    var debug1 = logger('foo');
    debug1('bar');
    debug1('baz');

    expect(console.log.callCount).to.be.equal(2);
    expect(console.log.getCall(0).args[0]).to.be.equal(
        formatISODate(new Date()) + ' +0ms foo bar');
    expect(console.log.getCall(1).args[0]).to.be.equal(
        formatISODate(new Date()) + ' +0ms foo baz');

    var debug2 = logger('qux');
    debug2('bar');
    debug2('baz');

    expect(console.log.callCount).to.be.equal(4);
    expect(console.log.getCall(2).args[0]).to.be.equal(
        formatISODate(new Date()) + ' +0ms qux bar');
    expect(console.log.getCall(3).args[0]).to.be.equal(
        formatISODate(new Date()) + ' +0ms qux baz');

    done();
  });

  it('formats the message with a custom formatter', function (done) {
    var options = {
      format: sinon.stub()
    };
    logger = debuggy.createLogger(options);

    logger('foo')('bar');

    expect(console.log.callCount).to.be.equal(0);
    expect(options.format.getCall(0).args[0]).to.only.deep.include({
      namespace: 'foo',
      message: 'bar',
      date: new Date(),
      delay: 0
    });

    done();
  });

  it('does not print anything when the DEBUG flag is not enabled',
      function (done) {
    process.env.DEBUG = '';
    logger('foo')('bar');
    process.env.DEBUG = true;

    expect(console.log.callCount).to.be.equal(0);

    done();
  });

  it('allows a custom debug flag name', function (done) {
    logger = debuggy.createLogger({
      env: 'TEST'
    });

    logger('foo')('bar');
    process.env.TEST = true;
    logger('foo')('bar');
    process.env.TEST = '';

    expect(console.log.callCount).to.be.equal(1);
    expect(console.log.getCall(0).args[0]).to.be.equal(
        formatISODate(new Date()) + ' +0ms foo bar');

    done();
  });

  it('allows no namespaces', function (done) {
    logger()('bar');

    expect(console.log.callCount).to.be.equal(1);
    expect(console.log.getCall(0).args[0]).to.be.equal(
        formatISODate(new Date()) + ' +0ms bar');

    done();
  });

  it('displays delay times up to hours', function (done) {
    // Initialize the epoch to 1000 in order to avoid subtle issues when the it
    // is 0 (Date.now()  will never be 0)
    clock.tick(1000);

    logger('foo')('1');
    expect(console.log.getCall(0).args[0]).to.be.equal(
        formatISODate(new Date()) + ' +0ms foo 1');

    clock.tick(1000);
    logger('foo')('2');
    expect(console.log.getCall(1).args[0]).to.be.equal(
        formatISODate(new Date()) + ' +1s foo 2');

    clock.tick(1000 * 60);
    logger('foo')('3');
    expect(console.log.getCall(2).args[0]).to.be.equal(
        formatISODate(new Date()) + ' +1m foo 3');

    clock.tick(1000 * 60 * 60);
    logger('foo')('4');
    expect(console.log.getCall(3).args[0]).to.be.equal(
        formatISODate(new Date()) + ' +1h foo 4');

    clock.tick(1000 * 60 * 60 * 24);
    logger('foo')('5');
    expect(console.log.getCall(4).args[0]).to.be.equal(
        formatISODate(new Date()) + ' +24h foo 5');

    expect(console.log.callCount).to.be.equal(5);

    done();
  });

  it('displays the timezone offset correctly (coverage)', function (done) {
    var offset = new Date().getTimezoneOffset();
    sinon.stub(Date.prototype, 'getTimezoneOffset').returns(-offset);

    logger('foo')('bar');

    expect(console.log.callCount).to.be.equal(1);
    expect(console.log.getCall(0).args[0]).to.be.equal(
        formatISODate(new Date()) + ' +0ms foo bar');

    Date.prototype.getTimezoneOffset.restore();

    done();
  });

  it('date numbers with zero-padding (coverage)', function (done) {
    clock.tick(1000 * 10);
    logger('foo')('bar');

    expect(console.log.callCount).to.be.equal(1);
    expect(console.log.getCall(0).args[0]).to.be.equal(
        formatISODate(new Date()) + ' +0ms foo bar');

    done();
  });
});