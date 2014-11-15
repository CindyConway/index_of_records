 var mongo = require('../mongo.js');

function setup(app) {

  app.get('/draft/department', getDraftDepartment);
  app.get('/department', getAdoptedDepartment);
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

module.exports = setup;
