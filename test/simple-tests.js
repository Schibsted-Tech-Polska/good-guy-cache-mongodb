var TingoDB = require('tingodb')({memStore: true}).Db;
var assert = require('chai').assert;

describe("GoodGuy MongoDB cache", function() {
  it("should retrieve previously stored entries", function(done) {
    var cache = require('../')(mockDB(), 'test');
    cache.store("abc", {test: 123}).then(function() {
      return cache.retrieve("abc");
    }).then(function(obj) {
      assert.deepEqual(obj, {test: 123});
    }).then(done).catch(done);

  });

  it("should be able to update existing entries", function(done) {
    var cache = require('../')(mockDB(), 'test');
    cache.store("abc", {test: 123}).then(function() {
      return cache.retrieve("abc");
    }).then(function(obj) {
      assert.deepEqual(obj, {test: 123});
      return cache.store("abc", {test: 456});
    }).then(function() {
      return cache.retrieve("abc");
    }).then(function(obj) {
      assert.deepEqual(obj, {test: 456});
    }).then(done).catch(done);
  });

  it("should return 'undefined' for missing entries", function(done) {
    var cache = require('../')(mockDB(), 'test');
    cache.retrieve('bogus', function(obj) {
      assert.strictEqual(obj, undefined);
    }).then(done).catch(done);
  });

  it("should add reasonable timeouts to Mongo URLs by default", function(done) {
    var cache = require('../')('mongodb://localhost:27017', 'test', {
      client: mockMongoClient()
    });
    cache.db().then(function(db) {
      assert.ok(db.url.match(/socketTimeoutMS=1000/));
      assert.ok(db.url.match(/connectTimeoutMS=1000/));
    }).then(done).catch(done);
  });

  it("should let you override the timeouts", function(done) {
    var cache = require('../')('mongodb://localhost:27017', 'test', {
      client: mockMongoClient(), timeout: 200
    });
    cache.db().then(function(db) {
      assert.ok(db.url.match(/socketTimeoutMS=200/));
      assert.ok(db.url.match(/connectTimeoutMS=200/));
    }).then(done).catch(done);
  });
});

function mockDB(url) {
  var db = new TingoDB(url || ('/mock/db/' + Math.random()), {});
  db.url = url;
  return db;
}

function mockMongoClient() {
  return {
    connectAsync: function(url) {
      return Promise.resolve(mockDB(url));
    }
  };
}
