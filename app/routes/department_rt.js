 var mongo = require('../mongo.js');

function setup(app) {

  app.get('/draft/department', getDraftDepartment);
  app.get('/department', getAdoptedDepartment);
  app.put('/draft/department', updateDraftDepartment);
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
    .find({}, {"draft.department":true},{"sort":"draft.department"})
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
