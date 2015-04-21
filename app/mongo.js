var mongodb = require('mongodb');

module.exports.init = function(callback) {

  var server = new mongodb.Server("10.250.60.109", 27017, {});

  new mongodb.Db('index_of_records', server, {
    w: 1
  })
  .open(function(error, client) {

    module.exports.client = client;

    module.exports.schedules = new mongodb.Collection(client, 'schedules');
    module.exports.template = new mongodb.Collection(client, 'template');
    module.exports.users = new mongodb.Collection(client, 'users');

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

module.exports.sorter = function (field){
    var sort = function(a,b){
         var nameA=a[field], nameB=b[field]
        if(nameA === null || nameB === null || nameB == "" || nameA == "")
        return 0
        nameA.toLowerCase()
        nameB.toLowerCase()
        if (nameA < nameB) //sort string ascending
         return -1
        if (nameA > nameB)
         return 1
        return 0 //default return value (no sorting)
     }

     return sort;
   }

   /*** Copyright 2013 Teun Duynstee Licensed under the Apache License, Version 2.0 ***/
   firstBy=(function(){function e(f){f.thenBy=t;return f}function t(y,x){x=this;return e(function(a,b){return x(a,b)||y(a,b)})}return e})();
