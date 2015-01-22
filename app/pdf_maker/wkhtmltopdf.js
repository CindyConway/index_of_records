var wkhtmltopdf = require('wkhtmltopdf');
var fs          = require("fs");

var config = {};
config.pageSize = 'legal';
config.orientation = 'Landscape';
config.footerLeft = '[page]/[topage]';
config.footerRight = 'Generated on: [date]';
config.marginTop = '17mm';
config.marginBottom = '10mm';

config.headerHtml = 'file:///Users/cindy/Projects/index_of_records/app/pdf_maker/header.html';

console.log(config);
wkhtmltopdf('http://localhost/~cindy/sunshine/build/#/schedule', config)
  .pipe(fs.createWriteStream('DPH.pdf'));