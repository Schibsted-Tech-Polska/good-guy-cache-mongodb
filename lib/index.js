var _ = require('lodash');
var urls = require('url');
var Promise = require('bluebird');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
Promise.promisifyAll(MongoClient);

module.exports = createCache;

var DEFAULT_OPTIONS = {
  timeout: 1000,

  client: MongoClient // overridable mostly for testing purposes
};

function createCache(urlOrDB, collectionName, options) {
  options = _.defaults(options || {}, DEFAULT_OPTIONS);
  var client = options.client;
  var connection, collection;

  return {
    store: store,
    retrieve: retrieve,

    db: function() { return grabDB(urlOrDB); }
  };

  function store(key, object) {
    return grabCollection(collectionName).then(function(coll) {
      return coll.updateAsync({_id: key}, {_id: key, obj: object}, {upsert: true});
    }).then(function() {
      return undefined; // consistent return value, GGHTTP is not interested in Mongo specifics
    });
  }

  function retrieve(key) {
    return grabCollection(collectionName).then(function(coll) {
      return coll.findOneAsync({_id: key});
    }).then(function(found) {
      if (!found) return undefined;
      return found.obj;
    });
  }

  function grabCollection(name) {
    if (collection) return Promise.resolve(collection);

    return grabDB(urlOrDB).then(function(db) {
      collection = Promise.promisifyAll(db.collection(name));
      return collection;
    });
  }

  function grabDB(descriptor) {
    if (connection) return connection;
    if (typeof descriptor == 'string') {
      var url = augmentConnectionURL(descriptor, options);
      return client.connectAsync(url).then(function(db) {
        connection = db;
        return db;
      });
    } else if (typeof descriptor == 'object') {
      connection = descriptor;
      return Promise.resolve(connection);
    } else {
      throw new Error("The DB parameter for good-guy-cache-mongodb has to be an existing MongoClient or a Mongo URL.");
    }
  }
}

/**
 * Adds timeout information from options to the connection URL.
 */
function augmentConnectionURL(url, options) {
  var u = urls.parse(url, true);
  _.extend(u.query, {
    connectTimeoutMS: options.timeout,
    socketTimeoutMS: options.timeout
  });
  return urls.format(u);
}
