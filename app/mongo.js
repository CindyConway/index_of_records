var mongodb = require('mongodb');

module.exports.init = function(callback) {


  var server = new mongodb.Server("ADD_IP_HERE", ADD_PORT_HERE, {});

  new mongodb.Db('ADD_DB_NAME_HERE', server, {
    w: 1
  }).open(function(error, client) {

    module.exports.client = client;

    module.exports.schedules = new mongodb.Collection(client, 'schedules');

    module.exports.toObjectId = function(hexString) {
      return mongodb.ObjectID.createFromHexString(hexString);
    };

    //TO DO
    //Need error handling
  });

};
