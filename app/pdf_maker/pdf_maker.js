var phantom = require('phantom');

//phantom.create(function (ph) {
//  ph.createPage(function (page) {
//    var size = {};
//    size.format = "legal";
//    size.orientation = "landscape";
//    size.margin = "1cm";
//
//    var footer = {};
//      footer.contents="this is a test";
//
//    console.log(size);
//    page.set('paperSize',size, function() {
//      // continue with page setup
//    });
//    page.set('footer',footer, function() {
//      // continue with page setup
//    });
//    page.open("http://10.250.60.109/cindy/sunshine/build/#/schedule", function start(status) {
//      console.log(status);
//      var fileName = 'test_' +  Math.floor((Math.random() * 100) + 1) + '.pdf';
//      page.render(fileName, function() {
//        // file is now written to disk
//      });
//      ph.exit();
//    });
//  });
//});


phantom.create(function (ph) {
  ph.createPage(function (page) {
    page.open("http://10.250.60.109/cindy/sunshine/build/#/schedule", function (status) {

      var paperConfig = {
        format: 'legal',
        orientation: 'landscape',
        border: '1cm',
        header: {
          height: '1cm',
          contents: ph.callback(function(pageNum, numPages) {
            return '<h1>My Custom Header</h1>';
          })
        },
        footer: {
          height: '1cm',
          contents: ph.callback(function(pageNum, numPages) {
            return '<p>Page ' + pageNum + ' / ' + numPages + '</p>';
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

