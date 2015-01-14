var phantom = require('phantom');

//phantom.create(function (ph) {
//  ph.createPage(function (page) {
//    page.open("http://www.google.com", function (status) {
//      console.log("opened google? ", status);
//      page.evaluate(function () { return document.title; }, function (result) {
//        console.log('Page title is ' + result);
//        ph.exit();
//      });
//    });
//  });
//});

phantom.create(function (ph) {
  ph.createPage(function (page) {
    page.paperSize= {format: 'Legal', orientation:'landscape'};
    //page.viewportSize = { width: 1920, height: 1080 };
    page.open("http://www.google.com", function start(status) {
      page.render('google_home.pdf', {format: 'pdf', quality: '100'});
      ph.exit();
    });
  });
});



