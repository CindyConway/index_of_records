var wkhtmltopdf = require('wkhtmltopdf');
var fs          = require("fs");
var mongo       = require('../mongo.js');
var dept_auth = require('../private/auth.js').dept_auth;


function setup(app) {
  app.get('/v1/edit/pdf/:dept_id', generatePDF);
}

function getDraftDepartmentName(dept_id, user_email, callback){
    var x = mongo.schedules.findOne(
      {
        _id: mongo.toObjectId(dept_id)
      },
      {
        "draft.department": 1
      },
      function(err,doc){
        if(err){callback(err)}

        dept_auth(doc, user_email, function(secure_data){
           if(secure_data.draft.department){
             dept_name = secure_data.draft.department;
           }else{
             dept_name = null;
           };
           callback(dept_name);
        })
      }
    );
}

function generatePDF(req,res){
    var sched_id = req.params.dept_id;
    var obj = {};
    obj._id = sched_id;
    var user_email = req.headers['x-key'];

    dept_auth(doc, email, function(secure_data){
      //User does not have permission to any departments
      if(secure_data === null){
        res.status(403);
        res.json({
          "status": 403,
          "message": "Not Authorized"
        });
        return;
      }

      //set schedule to the list of departments the user can edit
      getDraftDepartmentName(sched_id, user_email, function(dept_name){
        if(dept_name){
          makePDF(dept_name);
        }
      });
    });

    // getDraftDepartmentName(sched_id, user_email, function(dept_name){
    //   if(dept_name){
    //     makePDF(dept_name);
    //   }
    // });

    function makePDF(dept_name){
      var dept_name = dept_name.split(" ").join("_");
      var clientAppLocation = 'http://localhost/~cindy/sunshine/build/#';

      var config = {};
      config.pageSize = 'legal';
      config.orientation = 'Landscape';
      config.footerLeft = '[page]/[topage]';
      config.footerRight = 'Generated on: [date]';
      config.marginTop = '17mm';
      config.marginBottom = '10mm';
      config.headerHtml = 'file:////Users/cindy/Projects/index_of_records/app/pdf_header_template/header.html';

      var url = clientAppLocation + "/schedule/" + sched_id;
      var file_name = "../pdf/" + dept_name + ".pdf";
      var disposition = "attachment; filename=\"" + dept_name + ".pdf\"";
      var stream = fs.createWriteStream(file_name);

      stream.on('finish', function(){
        fs.readFile(file_name, function (err,data){
            res.contentType("application/pdf");
            res.setHeader("Content-Disposition", disposition);
            res.send(data);
        });
      });

      wkhtmltopdf(url, config)
        .pipe(stream);

    }

}

module.exports = setup;
