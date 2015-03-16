var mongo = require('../mongo.js');

function setup(app) {

  app.get('/template', getTemplate);
  app.get('/template/:dept_id', getTemplateByDept);
  app.put('/template', upsertTemplateRecord);
  app.delete('/template/:record_id', deleteTemplateRecord);

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
        .find({}
          ,{
            sort:
              [["category",1],
              ["title",1]]
          })
        .toArray(function(err, template) {
          if (err)
            console.log(err);


            if(schedule.length == 0){
              schedule = [];
            }

            if(schedule.length > 0){
              schedule = draft_schedule[0].draft.record;
            }

            // add selected property if record exists in the schdule
           for(var i=0; i <= template.length - 1;i++ ){
               template[i]["selected"] = false;
               var temp_id = template[i]._id.toString();

               for(var y=0; y <= schedule.length - 1; y++){
                  if(temp_id == schedule[y]._id.toString()){
                    template[i]["selected"] = true;
                    continue;
                  }
               }
           }
          res.send(template);

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
      "is_template": true

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
