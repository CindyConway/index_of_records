 var mongo = require('../mongo.js');
 var extend = require('util')._extend;

function setup(app) {

  app.get('/draft/department', getDraftDepartment);
  app.get('/department', getAdoptedDepartment);
  app.put('/draft/department', updateDraftDepartment);
  app.put('/draft/add', addDepartment);
  app.delete('/draft/department/:department_id', archiveDepartment);
}

function archiveDepartment(req, res){
  var objectId = mongo.toObjectId(req.params.department_id);

  //get the draft to be published
  mongo.schedules.findOne(
    {
        _id: objectId
    },
    function(err, doc) {

      //Make clone of adopted schedule for history array
      var adopted = extend({}, doc.adopted);
      adopted.status = "REMOVE_FROM_SEARCHABLE";

      //add history array if needed
      if (!doc.hasOwnProperty('history')) {
        doc.history = [];
      }

      //add final adopted schedule to history
      doc.history.push(adopted);

      //remove adopted
      delete doc.adopted;

      //remove draft
      delete doc.draft;

      // save the updated schedule (draft and adopted) to the mongodb
      // use findAndModify because it is Atomic
      var sort = [];
      mongo.schedules.findAndModify(
        {
          _id: objectId
        },
          sort
        ,
          doc
        ,{
          w: 1
        },
        function(err, result) {
          if (err) {
            return res.send({
              "error": err
            });
          }

          return res.send({
            "happy day": "document published"
          });
        });

      res.send({"test": "true"});
    });
};

function addDepartment(req, res){
  var draftId = mongo.newObjectId();
  var adoptedId = mongo.newObjectId();

  mongo.schedules.insert(
    {
      draft:{
          _id : draftId,
          department: "new",
          record:[]
      },
      adopted: {
        _id: adoptedId,
        department:null,
        record:[]
      }
    },
    function(err, doc){
      res.send(doc[0]);
    }
  )
}

function getAdoptedDepartment(req, res) {

  mongo.schedules
  .find({}, {"adopted.department":true},{"sort":"adopted.department"})
  .toArray(function(err, doc){
    if(err)
      console.log(err);

    res.send(doc);
  });

}

function getDraftDepartment(req, res) {

  mongo.schedules
    .find({"draft":{"$exists":1}}, {"draft.department":true},{"sort":"draft.department"})
    .toArray(function(err, doc){
      if(err)
        console.log(err);

      res.send(doc);
    });
}

function updateDraftDepartment(req, res){
  var objectId = mongo.toObjectId(req.body.sched_id);
  var dept = req.body;
  mongo.schedules.update(
    {
      "_id": objectId
    }
    ,
    {
      $set:{
          "draft.department": dept.department,
          "draft.website": dept.website,
          "draft.contact": dept.contact,
          "draft.email": dept.email,
          "draft.phone": dept.phone,
          "draft.ratified_on": dept.ratified_on,
          "draft.status":"DIRTY"
        }
    }
    , {w:1},
    function(err, result) {
      if (err) res.send("err " + err);
      res.send({"result": result});
    });
}

module.exports = setup;
