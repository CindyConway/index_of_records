var mongodb = require('mongodb');

module.exports.init = function(callback) {


  var server = new mongodb.Server("127.0.0.1", 27017, {});

  new mongodb.Db('index_of_records', server, {
    w: 1
  }).open(function(error, client) {

    module.exports.client = client;

    module.exports.schedules = new mongodb.Collection(client, 'schedules');

    module.exports.toObjectId = function(hexString) {
      return mongodb.ObjectID.createFromHexString(hexString);
    };

    module.exports.newObjectId = function() {
      return mongodb.ObjectID();
    };

    //TO DO
    //Need error handling
  });

};
