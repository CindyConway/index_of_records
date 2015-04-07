 var mongo = require('../mongo.js');
 var dept_auth = require('../private/auth.js').dept_auth;
 var validateUser = require('../private/auth.js').validateUser;

 var add_dept = require('../private/user.js').add_dept;
 var extend = require('util')._extend;

function setup(app) {

  app.get('/v1/department', getAdoptedDepartment);

  app.get('/v1/edit/department', getDraftDepartment);
  app.put('/v1/edit/department/:dept_id', updateDraftDepartment);
  app.put('/v1/edit/add', addDepartment);

  app.delete('/v1/pub/department/:department_id', archiveDepartment);
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
  var email = req.headers["x-key"];

  mongo.schedules.insert(
    {
      "draft":{
          _id : draftId,
          "department": "new organization",
          "revision":1,
          "status": "DRAFT",
          "record":[]
      }
    },
    function(err, dept){
      if(err)console.log(err)

       validateUser(email, function(user){
           add_dept(user._id.toString(), dept[0]._id.toString(), function(data){
            if(err) console.log(err);

            res.send(dept[0]);
           })
       })
    })
}

function getAdoptedDepartment(req, res) {

  mongo.schedules
  .find({"adopted":{"$exists":1}}, {"adopted.department":true},{"sort":"adopted.department"})
  .toArray(function(err, doc){
    if(err)
      console.log(err);

    res.send(doc);
  });

}

function getDraftDepartment(req, res) {
  var email = req.headers['x-key'];

  mongo.schedules
    .find({"draft":{"$exists":1}}, {"draft.department":true},{"sort":"draft.department"})
    .toArray(function(err, doc){
      if(err)
        console.log(err);

        //Does user have permission to change this deparmtent?
        dept_auth(doc, email, function(secure_data){

          if(secure_data === null){
            res.status(403);
            res.json({
              "status": 403,
              "message": "Not Authorized"
            });
            return;
          }else{
            //return just the departments the user has access to
            res.send(secure_data);
          }

        });

        // dept_auth(doc, user_email, function(secure_data){
        //   res.send(secure_data);
        // });
    });
}

function updateDraftDepartment(req, res){
  var email = req.headers['x-key'];
  var objectId = mongo.toObjectId(req.params.dept_id);
  var dept = req.body;

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
        "_id": objectId
      }
      ,
      {
        $set:{
            "draft.department": dept.draft.department,
            "draft.website": dept.draft.website,
            "draft.contact": dept.draft.contact,
            "draft.email": dept.draft.email,
            "draft.phone": dept.draft.phone,
            "draft.ratified_on": dept.draft.ratified_on,
            "draft.status":"DIRTY"
          }
      }
      , {w:1},
      function(err, result) {
        if (err) console.log("err " + err);

          res.send({"result": result});
      });
}

module.exports = setup;
