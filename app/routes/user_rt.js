var mongo = require('../mongo.js');
var add_role = require('../private/user.js').addRole;
// var dept_auth = require('../middlewares/auth.js').dept_auth;
// var extend = require('util')._extend;

function setup(app) {

  app.put('/v1/admin/user_role', addRole);

}

function addRole(req, res){

    add_role(req.body._id, req.body.dept_id, function(data){
      console.log(data)
    })


}

module.exports = setup;
