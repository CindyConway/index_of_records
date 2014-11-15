var request = require('request');

function setup(app) {
  app.post('/search', getSearch);
}

function getSearch(req, res){
  var terms = req.body;
  console.log(terms[0]);
  var query = '{"query": { \
                  "multi_match": { \
                        "query":"{search_term}", \
                        "type": "most_fields", \
                        "fields": [ "title^10", \
                                    "department^9", \
                                    "division", \
                                    "category^5", \
                                    "retention", \
                                    "remarks", \
                                    "on_site", \
                                    "off_site", \
                                    "total", \
                                    "website", \
                                    "link", \
                                    "phone", \
                                    "contact"], \
                        "tie_breaker":0.3, \
                        "minimum_should_match":"70%" \
                    } \
                  }, \
                  "aggs" : { \
                  "departments" : { \
                      "terms" : { \
                        "field" : "department.og" \
                      }, \
                      "aggs" : { \
                      "division" : { \
                      "terms" : { \
                        "field" : "division.og" \
                      } \
                    } \
                  } \
                }, \
                    "category" : { \
                      "terms" : { \
                        "field" : "category.og" \
                      } \
                    }, \
                    "retention" : { \
                      "terms" : { \
                        "field" : "retention.og" \
                      } \
                    } \
                  } \
                }';

  var query = query.replace('{search_term}', terms);
  res.send(query);

  var request = require('request');
  request('http://www.google.com', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body) // Print the google web page.
  }
})

}

module.exports = setup;
