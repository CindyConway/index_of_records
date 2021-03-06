var jwt = require('jwt-simple');
var validateUser = require('../private/auth.js').validateUser;
var checkRole = require('../private/auth.js').checkRole;
module.exports = function(req, res, next) {

  var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
  var key = (req.body && req.body.x_key) || (req.query && req.query.x_key) || req.headers['x-key'];

  if (token || key) {
    try {
          var decoded = jwt.decode(token, require('../config/secret.js')());

          if (decoded.exp <= Date.now()) {
            res.status(400);
            res.json({
              "status": 400,
              "message": "Token Expired"
            });
            return;
          }

          // Authorize the user to see if s/he can access our resources
          validateUser(key, function(dbUser){
              if (dbUser) {
                       checkRole(dbUser, req.url, function(is_valid){
                                   if (is_valid) {
                                      next(); // To move to next middleware
                                   } else {
                                      res.status(403);
                                      res.json({
                                        "status": 403,
                                        "message": "Not Authorized"
                                      });
                                      return;
                                  }
                        })
             } else {
               // No user with this name exists, respond back with a 401
               res.status(401);
               res.json({
                 "status": 401,
                 "message": "Invalid User"
               });
               return;
             }
         }); // The key would be the logged in user's username

   } catch (err) {
      res.status(500);
      res.json({
        "status": 500,
        "message": "Oops something went wrong",
        "error": err
      });
    }
  } else {
    res.status(401);
    res.json({
      "status": 401,
      "message": "Invalid Token or Key"
    });
    return;
  }
};
