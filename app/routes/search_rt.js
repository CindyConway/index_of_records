var request = require('request');

var ES_SERVER = 'http://localhost:9200/index_of_records/';

function setup(app) {
  app.put('/search', getSearch);
}

function getSearch(req, res){
  var body = req.body;
  var query = '{"query": { \
                  "multi_match": { \
                        "query":"{search_terms}", \
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

  var query = query.replace('{search_terms}', body.terms);

  request.post({
    url:ES_SERVER + 'record_types/_search',
    form: query},
    function(err,httpResponse,body){
      if (err){res.send(err);}
      res.send(body);
  })
}

module.exports = setup;
