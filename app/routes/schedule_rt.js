// if I call find().Array( callback(err, result)) as a chain, I cannot operate on each document that
// matched the find query because the callback is initiated after the entier cursor ( in the form
//of an array) is retutned. HOWEVER, if I creat the cursor in a separate step, I can execure a callback
// on each document eg var cursor = db.collecttion.find({query}); cursor.each(function(err, doc){})
// review week2 NodeJS Driver: find, findOne and cursor


var mongo = require('../mongo.js');
var extend = require('util')._extend;

function setup(app) {
  app.get('/schedule/:schedule_id', getAdoptedScheduleById);
  app.put('/draft/record', updateRecord); // used put instead of post because it is idempotent
  app.post('/publish/:schedule_id', publishSchedule);
  app.get('/draft/schedule/:schedule_id', getDraftScheduleById);
  app.delete('/draft/record/:record_id/:department_id', deleteRecord);
}

function deleteRecord(req,res){

  var objectId = mongo.toObjectId(req.params.record_id);
  var deptObjectId = mongo.toObjectId(req.params.department_id);

  mongo.schedules.update(
    {
        "_id": deptObjectId
    },
    {
        $pull:{
          "draft.record":{
              _id : objectId
            }
        }
    },
    function(err, result) {
      if (err) res.send("err " + err);
      res.send({
        "status": "deleted"
      });
    });
}

function publishSchedule(req, res) {
  var objectId = mongo.toObjectId(req.params.schedule_id);

  // get the draft to be published
  mongo.schedules.findOne({
    _id: objectId
  }, function(err, document) {
    if (err) {
      return res.send({
        "error": err
      });
    }

    //Make clone of adopted schedule for history collection
    jsonHistory = extend({}, document.adopted);

    //change the status of all the draft records to clean
    document.draft.record.forEach(function(record) {
      record.status = "CLEAN";
    });

    //change the status of the department information to clean
    document.draft.status = "CLEAN";

    //clone draft. This will become the published (aka adopted) schedule
    jsonAdopted = extend({}, document.draft);
    jsonAdopted.published_by = "Geoff Pavey"; //TODO
    jsonAdopted.published_on = new Date();
    jsonAdopted.status = "SEND_TO_SEARCHABLE";

    //remove the exiting adopted schedule
    delete document.adopted;

    //add the current draft as the new version of the adopted schedule
    document.adopted = jsonAdopted;

    //update the draft's revision
    ++document.draft.revision;

    //add to history array
    if (!document.hasOwnProperty('history')) {
      document.history = [];
    }
    document.history.push(jsonHistory);

    // save the updated schedule (draft and adopted) to the mongodb
    // use findAndModify because it is Atomic
    mongo.schedules.findAndModify({
      _id: objectId
    }, [], document, {
      w: 1
    }, function(err, result) {
      if (err) {
        return res.send({
          "error": err
        });
      }

      return res.send({
        "happy day": "document published"
      });
    });
  });

  //Create history archive... ie move history items to archive collection if there are more that 5
  // documents in history
}

function updateRecord(req, res){

  var whereClause = {};
  var updateObject = {};

  //[=================== PREP OBJECT FOR UPDATE ==========================]
  if(req.body._id != null){
    var objectId = mongo.toObjectId(req.body._id);

    whereClause = {
        "draft.record._id": objectId
      };

    updateObject = {
                    "$set": {
                      "draft.record.$.title": req.body.title,
                      "draft.record.$.link": req.body.link,
                      "draft.record.$.category": req.body.category,
                      "draft.record.$.retention": req.body.retention,
                      "draft.record.$.on_site": req.body.on_site,
                      "draft.record.$.off_site": req.body.off_site,
                      "draft.record.$.total": req.body.total,
                      "draft.record.$.division": req.body.division,
                      "draft.record.$.business_unit": req.body.business_unit,
                      "draft.record.$.remarks": req.body.remarks,
                      "draft.record.$.status": "DIRTY"
                    }
                  };
  }


  //[================== PREP OBJECTS FOR INSERT ======================]
  if(req.body._id == null){
    var deptObjectId = mongo.toObjectId(req.body.dept_id);
    var objectId = mongo.newObjectId();

    whereClause = {
        "_id": deptObjectId
      };

      updateObject = {
                      $push: {
                          "draft.record":{
                              _id: objectId,
                              title: req.body.title,
                              link: req.body.link,
                              category: req.body.category,
                              retention: req.body.retention,
                              on_site: req.body.on_site,
                              off_site: req.body.off_site,
                              total: req.body.total,
                              division: req.body.division,
                              business_unit: req.body.business_unit,
                              remarks: req.body.remarks,
                              status: "DIRTY"
                            }

                      }

                    };
  }


  //[============= MAKE MONGODB CALL =================================]

  mongo.schedules.update(
    whereClause
    ,
    updateObject
    , {},
    function(err, result) {
      if (err) res.send("err " + err);
      res.send({
        "record_id": objectId
      });
    });

  }

function getAdoptedScheduleById(req, res) {
  var objectId = mongo.toObjectId(req.params.schedule_id);

  mongo.schedules
    .find({
      _id: objectId
    }, {
      adopted: 1
    }, {
      sort: "adopted.record.category"
    })
    .toArray(function(err, doc) {
      if (err)
        console.log(err);

      res.send(doc);
    });
}

function getDraftScheduleById(req, res) {

  var objectId = mongo.toObjectId(req.params.schedule_id);

  mongo.schedules
    .find({
      _id: objectId
    }, {
      draft: 1
    }, {
      sort: "draft.record.category"
    })
    .toArray(function(err, doc) {
      if (err)
        console.log(err);

      if (doc.length > 0) {
        res.send(doc[0]);
      } else {
        res.send({});
      }

    });
}

module.exports = setup;
