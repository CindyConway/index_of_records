var wkhtmltopdf = require('wkhtmltopdf');
var fs          = require("fs");
var mongo       = require('../mongo.js');


function setup(app) {
  app.get('/v1/edit/pdf/:schedule_id', generatePDF);
}

function getDraftDepartmentName(dept_id, callback){
    var x = mongo.schedules.findOne(
      {
        _id: mongo.toObjectId(dept_id)
      },
      {
        "draft.department": 1
      },
      function(err,doc){
        dept_name = doc.draft.department;
        if(err){callback(err)}

        callback(dept_name);
      }
    );
}

function generatePDF(req,res){
    var sched_id = req.params.schedule_id;
    getDraftDepartmentName(sched_id, function(dept_name){
      makePDF(dept_name);
    });

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
