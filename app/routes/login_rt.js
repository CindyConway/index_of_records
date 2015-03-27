var mongo = require('../mongo.js');
var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');
var auth = require('../middlewares/auth.js');

function setup(app) {
  app.post('/v1/login', login);
  app.post('/v1/signup', signup);
}

function signup(req,res){
   var pwrd = req.body.pwrd;
   var hash = bcrypt.hashSync(pwrd, 10);
   var email = req.body.email.toLowerCase()

  mongo.users.insert(
    {
      "first_name": req.body.first_name,
      "last_name": req.body.last_name,
      "email": email,
      "pwrd": hash
    },
      function(err, doc){
        res.send(doc[0]);
      }
    )
  res.json({"status":"success"});
}

function login(req, res){

    var email = req.body.email || '';
    var pwrd = req.body.pwrd || '';
    email = email.toLowerCase();

    if (email == '' || pwrd == '') {
     res.status(401);
     res.json({
       "status": 401,
       "message": "email or password is blank"
     });
     return;
   }


   var is_authenticated = auth.authenticate(email, pwrd, function(is_authenticated, user){
         if(!is_authenticated){
           //credential are INVALID
           res.status(401);
           res.json({
             "status": 401,
             "message": "not authenticated"
           });
           return;
         }

         if(is_authenticated){
           //credentials are VALID. Return JWToken
           res.json(auth.genToken(user));
           return;
         }
   });
};

module.exports = setup;
