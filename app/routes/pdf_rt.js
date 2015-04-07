var wkhtmltopdf = require('wkhtmltopdf');
var fs          = require("fs");
var mongo       = require('../mongo.js');
var dept_auth = require('../private/auth.js').dept_auth;
var Browser = require('zombie');


function setup(app) {
  app.get('/v1/pdf/:dept_id', generatePDF);
}

function getDraftDepartmentName(dept_id, email, callback){
    var x = mongo.schedules.findOne(
      {
        _id: mongo.toObjectId(dept_id)
      },
      {
        "draft.department": 1
      },
      function(err,doc){
        if(err){callback(err)}

        var dept_name = null;

        if(doc.hasOwnProperty("draft")){
          dept_name = doc.draft.department
        }

        callback(dept_name);
      });
}

// function generatePDF(req, res){
//   var email = req.headers['x-key'];
//   var token = req.headers['x-access-token'];
//   var sched_id = req.params.dept_id;
//   var browser = new Browser();
//
//   browser.visit ('http://localhost/~cindy/sunshine/build/#/login', function(){
//       browser
//       .fill('#username', 's.account@sfgov.org')
//       .fill('#password', 'Spot.This.is.down.Down.is.good')
//       .pressButton('#submit', function(){
//         var url = 'http://localhost/~cindy/sunshine/build/#/schedule/' + sched_id;
//
//          browser.sessionStorage("localhost:80").setItem("user", email);
//          browser.sessionStorage("localhost:80").setItem("token", token);
//
//         browser.visit(url, function(){
//           //console.log(browser.html());
//           console.log(browser.document.angular);
//             var dept_name = "dept_test_name";
//             var file_name = "/Users/cindy/pdf/" + dept_name + ".pdf";
//             var config = {};
//             config.pageSize = 'legal';
//             config.orientation = 'Landscape';
//             config.footerLeft = '[page]/[topage]';
//             config.footerRight = 'Generated on: [date]';
//             config.marginTop = '17mm';
//             config.marginBottom = '10mm';
//             config.headerHtml = 'file:////Users/cindy/Projects/index_of_records/app/pdf_header_template/header.html';
//
//             // var stream = fs.createWriteStream(file_name);
//             // var disposition = "attachment; filename=\"" + dept_name + ".pdf\"";
//             //
//             // stream.on('finish', function(){
//             //   fs.readFile(file_name, function (err,data){
//             //       res.contentType("application/pdf");
//             //       res.setHeader("Content-Disposition", disposition);
//             //       res.send(data);
//             //   });
//             // });
//             //
//             // wkhtmltopdf(browser.html(), config)
//             // .pipe(stream);
//
//         })
//
//       });
//   });
// }

function generatePDF(req,res){

    var sched_id = req.params.dept_id;
    var obj = {};
    obj._id = sched_id;
    var email = req.headers['x-key'];
    var token = req.headers['x-access-token'];

    // dept_auth(obj, email, function(secure_data){
    //   //User does not have permission to any departments
    //   if(secure_data === null){
    //     res.status(403);
    //     res.json({
    //       "status": 403,
    //       "message": "Not Authorized"
    //     });
    //     return;
    //   }else{
        getDraftDepartmentName(sched_id, email, function(dept_name){
          if(dept_name){
            makePDF(dept_name);
          }
        });

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
      var file_name = "/Users/cindy/pdf/" + dept_name + ".pdf";
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
