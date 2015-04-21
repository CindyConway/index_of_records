var mongo = require('../mongo.js');
var extend = require('util')._extend;
var dept_auth = require('../private/auth.js').dept_auth;
var validateUser = require('../private/auth.js').validateUser;


function setup(app) {
  app.get('/v1/schedule/:dept_id', getAdoptedScheduleById);

  app.put('/v1/edit/record', updateRecord);
  app.get('/v1/temp/schedule/:dept_id', getDraftScheduleById);
  app.delete('/v1/edit/record/:record_id/:dept_id', deleteRecord);
  app.post('/v1/edit/lock/:dept_id', lockSchedule);
  app.put('/v1/edit/add_template', addTemplateRecord);

  app.post('/v1/pub/publish/:dept_id', publishSchedule);
  app.post('/v1/pub/unlock/:dept_id', unlockSchedule);

}

function addTemplateRecord(req, res){

  var record = req.body.draft.record;
  var doc = req.body;
  var deptObjectId = mongo.toObjectId(doc._id);
  var objectId = mongo.toObjectId(record._id);

  var email = req.headers["x-key"];

  //Does user have permission to change this deparmtent?
  dept_auth(doc, email, function(secure_data){

    if(secure_data === null){
      res.status(403);
      res.json({
        "status": 403,
        "message": "Not Authorized"
      });
      return;
    }
  });

  mongo.schedules.update(
    {
      _id : deptObjectId
    }
    ,{
      $push: {
          "draft.record":{
              "_id": objectId,
              "title": record.title,
              "link": record.link,
              "category": record.category,
              "retention": record.retention,
              "on_site": record.on_site,
              "off_site": record.off_site,
              "total": record.total,
              "division": record.division,
              "business_unit": record.business_unit,
              "remarks": record.remarks,
              "is_template": record.is_template,
              "status": "DIRTY"
            }

      }
    }
    , {},
    function(err, result) {
      if (err) res.send("err " + err);
      res.send({
        "record_id": objectId
      });
    });

}

function lockSchedule(req, res){
  var objectId = mongo.toObjectId(req.params.dept_id);
  var email = req.headers["x-key"];

  var dept = {};
  dept._id = req.params.dept_id;

  //Does user have permission to change this deparmtent?
  dept_auth(dept, email, function(secure_data){

    if(secure_data === null){
      res.status(403);
      res.json({
        "status": 403,
        "message": "Not Authorized"
      });
      return;
    }
  });

  mongo.schedules.update(
  {
    _id: objectId
  }
  ,{
    $set:{
      "draft.status": "LOCKED"
    }
  }
  , {},
  function(err, result) {
    if (err) res.send("err " + err);
    res.send({

    });
  });

}

function unlockSchedule(req, res){
  var objectId = mongo.toObjectId(req.params.dept_id);

  mongo.schedules.update(
    {
      _id: objectId
    }
    ,{
      $set:{
        "draft.status": "DIRTY"
      }
    }
    , {},
    function(err, result) {
      if (err) res.send("err " + err);
      res.send({

      });
    });

}

function deleteRecord(req,res){
  var email = req.headers["x-key"];
  var objectId = mongo.toObjectId(req.params.record_id);
  var deptObjectId = mongo.toObjectId(req.params.dept_id);

  var dept = {};
  dept._id = req.params.dept_id;

  //Does user have permission to change this deparmtent?
  dept_auth(dept, email, function(secure_data){

    if(secure_data === null){
      res.status(403);
      res.json({
        "status": 403,
        "message": "Not Authorized"
      });
      return;
    }
  });

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
  var objectId = mongo.toObjectId(req.params.dept_id);

  // get the draft to be published
  mongo.schedules.findOne({
    _id: objectId
  }, function(err, document) {
    if (err) {
      return res.send({
        "error": err
      });
    }

    //Make clone of adopted schedule for history array
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

    //remove the existing adopted schedule
    delete document.adopted;

    //add the current draft as the new version of the adopted schedule
    document.adopted = jsonAdopted;

    //update the draft's revision
    ++document.draft.revision;

    //add history array if needed
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
  var record = req.body.draft.record;
  var doc = req.body;
  var email = req.headers["x-key"];

  //Does user have permission to change this deparmtent?
  dept_auth(doc, email, function(secure_data){

    if(secure_data == null){
      res.status(403);
      res.json({
        "status": 403,
        "message": "Not Authorized"
      });
      return;
    }
  });

  //[=================== PREP OBJECT FOR UPDATE ==========================]
  if(record._id != null){

    var objectId = mongo.toObjectId(record._id);

    whereClause = {
        "draft.record._id": objectId
      };

    updateObject = {
                    "$set": {
                      "draft.record.$.title": record.title,
                      "draft.record.$.link": record.link,
                      "draft.record.$.category": record.category,
                      "draft.record.$.retention": record.retention,
                      "draft.record.$.on_site": record.on_site,
                      "draft.record.$.off_site": record.off_site,
                      "draft.record.$.total": record.total,
                      "draft.record.$.division": record.division,
                      "draft.record.$.division_contact": record.division_contact,
                      "draft.record.$.business_unit": record.business_unit,
                      "draft.record.$.remarks": record.remarks,
                      "draft.record.$.is_template": record.is_template,
                      "draft.record.$.status": "DIRTY"
                    }
                  };
  }


  //[================== PREP OBJECTS FOR INSERT ======================]
  if(record._id === null){

    var deptObjectId = mongo.toObjectId(doc._id);
    var objectId = mongo.newObjectId(record._id);

    whereClause = {
        "_id": deptObjectId
      };

      updateObject = {
                      $push: {
                          "draft.record":{
                              "_id": objectId,
                              "title": record.title,
                              "link": record.link,
                              "category": record.category,
                              "retention": record.retention,
                              "on_site": record.on_site,
                              "off_site": record.off_site,
                              "total": record.total,
                              "division": record.division,
                              "division_contact": record.division_contact,
                              "business_unit": record.business_unit,
                              "remarks": record.remarks,
                              "is_template": record.is_template,
                              "status": "DIRTY"
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
  var objectId = mongo.toObjectId(req.params.dept_id);

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

  var objectId = mongo.toObjectId(req.params.dept_id);
  var email = req.headers["x-key"];
  var dept = {};
  dept._id = req.params.dept_id;

  //Does user have permission to change this deparmtent?
  // dept_auth(dept, email, function(secure_data){
  //
  //   if(secure_data === null){
  //     res.status(403);
  //     res.json({
  //       "status": 403,
  //       "message": "Not Authorized"
  //     });
  //     return;
  //   }
  // });

  mongo.schedules
    .find({
      _id: objectId
    }, {
      "draft": 1
    })
    .toArray(function(err, doc) {
      if (err)
        console.log(err);

      if (doc.length > 0) {
        doc[0].draft.record.sort(
          firstBy(mongo.sorter("division"))
          .thenBy(mongo.sorter("category"))
          .thenBy(mongo.sorter("title"))
        );

        res.send(doc[0]);
      } else {
        res.send({});
      }

    });
}
module.exports = setup;
