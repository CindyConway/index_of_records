var MongoOplog = require('mongo-oplog');
var MongoClient = require('mongodb').MongoClient;
var MongoServer = require('mongodb').Server;
var ObjectId = require('mongodb').ObjectID;

var oplog = MongoOplog('mongodb://ADD_IP:ADD_PORT/local', 'ADD_DB.ADD_COL').tail();
var mongo_conx = new MongoClient(new MongoServer('localhost', 27017));

oplog.on('update', function (doc) {

  // this will return undefined if doc.o.adopted.status does not exist
  var status = (((doc || {}).o || {}).adopted || {}).status;

  // exit if status is not 'SEND_TO_SEARCHABLE'
  if( status != 'SEND_TO_SEARCHABLE') return;

  var adopted = doc.o.adopted;
  var records = doc.o.adopted.record;

  var dept = adopted.department;
  var contact = adopted.contact;
  var website = adopted.website;
  var revision = adopted.revision;
  var email = adopted.email;
  var phone = adopted.phone;
  var schedule_id = doc.o._id;

  //flaten document architecture for better searching
  records.forEach(function(record){
    record.department = dept;
    record.contact = contact;
    record.website = website;
    record.revision = revision;
    record.email = email;
    record.phone = phone;
    record.schedule_id = schedule_id

  });

  //if status is SEND_TO_SEARCHABLE, update the searchables collection
  mongo_conx.open(function(err, mongo) {
    var index_of_records = mongo_conx.db("index_of_records");
    var elasticsearch_fmt = index_of_records.collection('elasticsearch_fmt');
    var schedules = index_of_records.collection('schedules');

    var batch = elasticsearch_fmt.initializeOrderedBulkOp();
    records.forEach(function(record){
      batch.find({_id:record._id}).upsert().replaceOne(record);
    })

    batch.execute(function(err, result){

        if(err) {
          console.log(err)
          mongo_conx.close();
        };

        if(!err){

          var sched_id_obj = ObjectId.createFromHexString(schedule_id.toString());
          // remove any old records
          last_revision = revision - 1;
          elasticsearch_fmt.remove({"schedule_id": sched_id_obj, "revision":last_revision}, {w:1}, function(err, NoRemoved){
            console.log("removed: " + NoRemoved )
          });

          schedules.update({_id: sched_id_obj},{$set:{"adopted.status":""}}, function(err, result){
            if(err){console.log(err)};
            mongo_conx.close();
          });
        }


    })

  });
});


oplog.on('error', function (error) {
  console.log(error);
});

oplog.on('end', function () {
  console.log('Stream ended');
});

oplog.stop(function () {
  console.log('server stopped');
});

// The following are stubs to monitor other oplog events
// oplog.on('delete', function (doc) {
//   console.log(doc.op._id);
// });

// oplog.on('op', function (data) {
//   console.log(data);
// });
//
// oplog.on('insert', function (doc) {
//   console.log(doc.op);
// });
