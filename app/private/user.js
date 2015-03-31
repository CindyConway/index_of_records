var mongo = require('../mongo.js');

var user = {
  add_dept : function(user_id, dept_id, callback){
    var objectId = mongo.toObjectId(user_id);
    var dept_objectId = mongo.toObjectId(dept_id);

    mongo.users.update(
      {
        _id: objectId
      },
      {
        $push:{"departments": dept_objectId}
      },function(err, data){
        if (err) console.log(err);

        callback(data);
      })
  }
}

module.exports = user;
