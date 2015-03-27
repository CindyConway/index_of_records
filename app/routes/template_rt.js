var mongo = require('../mongo.js');
var extend = require('util')._extend;

function setup(app) {

  app.get('/v1/pub/template', getTemplate);
  app.put('/v1/pub/template', upsertTemplateRecord);
  app.delete('/v1/pub/template/:record_id', deleteTemplateRecord);
  app.get('/v1/edit/template/:dept_id', getTemplateByDept);
  
}

function getTemplateByDept(req, res) {
  var objectId = mongo.toObjectId(req.params.dept_id);
  var schedule;
  var template;

  // Get all the template records from the schedule
  mongo.schedules
    .find({
      "_id": objectId
    }, {
      "draft.record": 1
    })
    .toArray(function(err, draft_schedule) {
      if (err)
      console.log(err);

      schedule = draft_schedule;

      // get all the template records
      mongo.template
        .find({
            "is_visible": "Visible"
          },
          {
            sort:
              [["category",1],
              ["title",1]]
          })
        .toArray(function(err, template) {
          if (err)
            console.log(err);

            var templateClone = extend([], template);

            if(schedule.length == 0){
              schedule = [];
            }

            if(schedule.length > 0){
              schedule = draft_schedule[0].draft.record;
            }


            //mark as selected any template records already in the schedule
           for(var i = 0; i < schedule.length; i++){
             if(!schedule[i].is_template){
               continue;
             }

             for(var j = 0; j < template.length; j++){

               if(schedule[i]._id.toString() == template[j]._id.toString()){
                 templateClone[j]["selected"] = true;
               }
             }
           }

           //add any templates that are still in the schedule but no longer in the master template list
           for(var x = 0; x < schedule.length; x++){
             if(!schedule[x].is_template){
               continue;
             }

             var exists = false;
             for(var y = 0; y < template.length; y++){
               if(schedule[x]._id.toString() == template[y]._id.toString()){
                 exists = true;
               }
             }

             if(!exists){
               var record = extend({}, schedule[x]);
               record["selected"] = true;
               templateClone.push(record);
             }
           }

          //Add the selected attribute for any unselected template records
           for(var k = 0 ; k < templateClone.length; k++){
             if(!templateClone[k].hasOwnProperty("selected")){
               templateClone[k]["selected"] = false;
             }
           }


           console.log(templateClone);
           //console.log(template);
          res.send(templateClone);

        });
    });
}

function getTemplate(req, res) {

  mongo.template
    .find({}
      ,{
        sort:
          [["category",1],
          ["title",1]]
      })
    .toArray(function(err, doc) {
      if (err)
        console.log(err);

        res.send(doc);

    });
}

function upsertTemplateRecord(req, res) {
  var record = req.body;

  if(record._id == null){
    var objectId = mongo.newObjectId()
  }

  if(record._id != null){
    var objectId = mongo.toObjectId(req.body._id);
  }

  mongo.template.update(
    {
        "_id": objectId
    },
    {
      "_id": objectId,
      "category": record.category,
      "title": record.title,
      "link" : record.link,
      "retention": record.retention,
      "on_site" : record.on_site,
      "off_site": record.off_site,
      "total" : record.total,
      "remarks" : record.remarks,
      "is_template": true,
      "is_visible": record.is_visible

    },
    {
      upsert: true
    },
    function(err, result) {
      if (err) res.send("err " + err);

      res.send({
        "_id": objectId
      });

    });
}

function deleteTemplateRecord(req,res){
var objectId = mongo.toObjectId(req.params.record_id);

mongo.template.remove(
  {
      "_id": objectId
  },
  {w:1},
  function(err, result) {
    if (err) res.send("err " + err);
    res.send({
      "status": "deleted"
    });
  });
}


module.exports = setup;
