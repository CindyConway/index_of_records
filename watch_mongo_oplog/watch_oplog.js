var MongoOplog = require('mongo-oplog');
var MongoClient = require('mongodb').MongoClient;
var MongoServer = require('mongodb').Server;
var ObjectId = require('mongodb').ObjectID;
var index_of_records;
var elasticsearch_fmt;
var schedules;

// --------------- Create the connections and get collections ---------
var oplog = MongoOplog('mongodb://127.0.0.1:27017/local', 'index_of_records.schedules').tail();
var mongo_conx = new MongoClient(new MongoServer('localhost', 27017));

mongo_conx.open(function(err, mongo) {
   index_of_records = mongo_conx.db("index_of_records");
   elasticsearch_fmt = index_of_records.collection('elasticsearch_fmt');
   schedules = index_of_records.collection('schedules');
});

//-------- Captured updates in the oplog -----------------------------
oplog.on('update', function (doc) {

  // this will return undefined if doc.o.adopted.status does not exist
  var opObj = ((doc || {}).o || {});
  var idObj = ((doc || {}).o2 || {});

  var status = getVal(opObj,'adopted.status');
  var id = getVal(idObj,'_id');

  // exit if status is not 'SEND_TO_SEARCHABLE'
  if( status != 'SEND_TO_SEARCHABLE') return;


    // ------------ 1. Retrieve the record from the DB --------
    var idObj = ObjectId.createFromHexString(id.toString());
    schedules.findOne({_id:idObj}, function(err, item) {
           var adopted = item.adopted;
           var records = item.adopted.record;

          var dept = adopted.department;
          var contact = adopted.contact;
          var website = adopted.website;
          var revision = adopted.revision;
          var email = adopted.email;
          var phone = adopted.phone;
          var schedule_id = id;


          // if there are no records for the repartment  it makes not sense to flatten the
          // the data structure. This also means it is not searchable
          if(typeof records == 'undefined') return;


            // ------------2. flaten document architecture for better searching
          records.forEach(function(record){
            record.department = dept;
            record.contact = contact;
            record.website = website;
            record.revision = revision;
            record.email = email;
            record.phone = phone;
            record.schedule_id = schedule_id
          });


          // ------------- 3.  Add the data to the elasticsearch_fmt collection
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
                      //------------- 4 . Remove any old record classes that are in the elasticsearch_fmt collection
                      last_revision = revision - 1;
                      elasticsearch_fmt.remove({"schedule_id": idObj, "revision":last_revision}, {w:1}, function(err, NoRemoved){
                        console.log("removed: " + NoRemoved )
                      //  mongo_conx.close();
                      });


                      // ------------ 5. Put the status of the adopted schedule back to clean
                      schedules.update({_id: idObj},{$set:{"adopted.status":"CLEAN"}}, function(err, result){
                        if(err){console.log(err)};
                        //mongo_conx.close();
                      });
                    }

                  })

        })
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

function getVal(theObject, theProp) {
  var result = null;

  for(var prop in theObject) {
    if(prop == theProp) {
      return theObject[prop];
    }

    if(theObject[prop] instanceof Object)
      result = getVal(theObject[prop], theProp);
    }

    return result;
  }

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
