//RUN FROM NODE.JS
var databaseUrl = "index_of_records"; // "username:password@example.com/mydb"
var collections = ["schedules_draft", "schedules_adopted", "schedules"];
var db = require("mongojs").connect(databaseUrl, collections);
console.log("starting ...");
db.schedules_draft.find({}, function(err, schedules) {
  if( err || !schedules) console.log("None found");
  else schedules.forEach( function(schedule) {

    db.schedules.insert({draft: schedule, adopted: schedule}, function(err, result){
      console.log(result);
    });

  } );
});
