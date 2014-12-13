var request = require('request');

var ES_SERVER = 'http://localhost:9200/index_of_records/';

function setup(app) {
  app.put('/search', getSearch);
}

function getSearch(req, res){
 var body = req.body;

  var query = '{"size":100, \
                "query": { \
                  "multi_match": { \
                        "query":"{{search_terms}}", \
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
                  "highlight": { \
                    "pre_tags" : ["<strong class=\'search-highlight px1 regular \'>"], \
                    "post_tags" : ["</strong>"], \
                    "fields" : { \
                      "title" : {}, \
                      "department":{}, \
                      "division": {}, \
                      "category": {}, \
                      "retention": {}, \
                      "remarks": {}, \
                      "on_site": {}, \
                      "off_site": {}, \
                      "total": {}, \
                      "website":{}, \
                      "contact":{}, \
                      "link":{}, \
                      "phone":{} \
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

  var filter =  ',"post_filter": {   \
                  "term" : {{search_filters}} \
                }'

  var query = query.replace('{{search_terms}}', body.criteria.terms);

 //console.log(body.filters == '{}');
  if(body.filters != '{}'){
    query = query.substring(0, query.length - 1); //remove the last curly brace to insert filter

    query = query + filter.replace('{{search_filters}}', body.filters) + '}';
  }
console.log(query);
  request.post({
    url:ES_SERVER + 'record_types/_search',
    form: query},
    function(err,httpResponse,body){
      if (err){res.send(err);}
//console.log(body);
      res.send(body);
  })
}

module.exports = setup;
