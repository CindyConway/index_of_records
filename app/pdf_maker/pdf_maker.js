var phantom = require('phantom');

phantom.create(function (ph) {
  ph.createPage(function (page) {

    page.open("http://localhost/~cindy/sunshine/build/#/schedule", function (status) {
      var self = this;
      self.gen_dt = null;
      var paperConfig = {
        format: 'legal',
        orientation: 'landscape',
        margin:'0.75cm',
        header: {
          height: "2cm",
          contents: ph.callback(function(pageNum, numPages) {
            if(pageNum == 1) {return;}
            if(pageNum == numPages) {return;}

            var style = '<style> \
                          td{border: solid 1px #eee;}\
                          table{table-layout:fixed; \
                                width: 100%; \
                                border:none; \
                                border-collapse:collapse; \
                                font-size:80%; \
                                font-weight:bold; \
                                font-family: "Raleway"; \
                                margin:0px;} \
                          tr{border-right: 1px solid #eee;} \
                          .center {text-align: center;} \
                          .p1{padding:1em;} \
                          .grey-background {background: #f2f2f2 !important; border-top: 1px solid #d7d7d7 } \
                          body{margin:0px;} \
                        </style>'
            var header = '<table> \
                      <tr> \
                      <td class="p1">Division</td> \
                      <td class="p1">Division Contract</td> \
                      <td class="p1">Record Category</td> \
                      <td class="p1">Record Title/ Description</td> \
                      <td class="p1">Document Link</td> \
                      <td class="p1">Retention Category</td> \
                      <td class="p1 center"colspan="3">Retention Period</td> \
                      <td class="p1">Remarks</td> \
                      </tr> \
                      <tr class="grey-background"> \
                      <td></td> \
                      <td></td> \
                      <td></td> \
                      <td></td> \
                      <td></td> \
                      <td></td> \
                      <td>Total</td> \
                      <td>On-site</td> \
                      <td>Off-site</td> \
                      <td></td> \
                      </tr>\
                      </table>'

            return style+header;
          })
        },
        footer: {
          height: '1cm',
          contents: ph.callback(function(pageNum, numPages) {
            if(self.gen_dt == null){
              var months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
              var today = new Date();
              var date = today.getDate();
              var month = months[today.getMonth()];
              var year = today.getFullYear();
              self.gen_dt = month + '/' + date + '/' + year;
            }
            var footer = '<span style="float:left">Page ' + pageNum + ' / ' + numPages + '</span>';
               footer = footer + '<span style="float:right"> Generated on: ' + self.gen_dt + '</span>';
            return footer;
          })
        }
      };

      page.set('paperSize', paperConfig, function() {
        var fileName = 'test_' +  Math.floor((Math.random() * 100) + 1) + '.pdf';
        page.render(fileName, function() {
          page.close();
          ph.exit();
        });
      });


    });
  });
});
