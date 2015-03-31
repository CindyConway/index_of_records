var mongo = require('../mongo.js');
var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');

var auth = {
  dept_auth: function(data, user_email, callback){

    auth.validateUser(user_email, function(user){

      // Admin and Publisher, return all departments
      if(user.roles.indexOf("Administrator") > -1 || user.roles.indexOf("Publisher") > -1){
        callback(data);
        return;
      }

      //******** Editor **************//
      var departments = user.departments;
      var secure_data = [];

      //The editor is associated with no departments
      if(!departments){
        callback(null);
        return;
      }

      //filter departments based on an array of departments
      if (Array.isArray(data)){
        for(var i = 0; i < departments.length; i++){
          for(var j = 0; j < data.length; j++){
            if(departments[i].toString() == data[j]._id.toString()){
              secure_data.push(data[j]);
              break;
            }
          }
        }
        if(secure_data.length === 0){
          callback(null);
          return;
        }else{
          callback(secure_data);
          return;
        }
      }

      //filter departments based on departments being in an object
      for(var i = 0; i < departments.length; i++){
        for (var item in data) {
          if (data.hasOwnProperty("_id")) {
            if(item == "_id"){
              if(departments[i].toString() == data["_id"].toString()){
                callback(data);
                return;
              }
            }
          }
        }
      }

      //no match found in department object, return empty object
      callback(null);
      return;
    })

  },
  checkRole : function(user, url, callback){

          if(url.indexOf('edit') > -1){
            if(user.roles.indexOf("Editor") > -1){
              callback(true);
              return;
            }else{
              callback(false);
              return
            }
          }

          if(url.indexOf('pub') > -1){
            if(user.roles.indexOf("Publisher") > -1){
              callback(true);
              return;
            }else{
              callback(false);
              return
            }
          }

          if(url.indexOf('admin') > -1){
            if(user.roles.indexOf("Administrator") > -1){
              callback(true);
              return;
            }else{
              callback(false);
              return
            }
          }

          callback(false);
          return;
  },
  validateUser : function(email, callback){

          mongo.users.findOne(
            {
              "email": email
            },
            function(err, data){
                if(err)callback(err);

                delete data.pwrd;
                callback(data);
            });
    },
    validate : function(email, pwrd){
            email = email.toLowerCase();
            var is_authenticated = authenticate(email, pwrd, function(is_authenticated){
                 if(!is_authenticated){
                   return null;
                 }

                 if(is_authenticated){

                   mongo.users.findOne(
                     {
                       "email": email
                     },{
                       "pwrd":0
                     },
                     function(err, data){
                         if(err)console.log(err);

                           return data;
                     });
                 }
           });
   },
    authenticate : function(email, pwrd, callback){

      var match = false;

      mongo.users.findOne(
        {
          "email": email
        },
        function(err, data){
            if(err)console.log(err);


            if(data !== null){
              match = bcrypt.compareSync(pwrd, data.pwrd);
              if(match){
                delete data.pwrd;
                callback(match, data);
                return;
              } else {
                callback(false);
                return;
              }
            }else{
              callback(false);
              return;
            }
        }
      );
    },
    genToken : function(user) {
      var expires = expiresIn(7); // 7 days
      var token = jwt.encode({
        exp: expires
      }, require('../config/secret')());

      return {
        token: token,
        expires: expires,
        user: user.email,
        roles : user.roles,
        users_dept : user.users_dept
      };
    }
}// END auth

// private method
function expiresIn(numDays) {
  var dateObj = new Date();
  return dateObj.setDate(dateObj.getDate() + numDays);
}

module.exports = auth;
