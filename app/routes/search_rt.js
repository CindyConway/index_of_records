var request = require('request');

var ES_SERVER = 'http://localhost:9200/index_of_records/';

function setup(app) {
  app.put('/search', getSearch);
}

function getSearch(req, res){
  var body = req.body;

  var search_fields = [ "title^10", "department^9", "division", "category^5", "retention"," remarks", "on_site", "off_site", "total", "website", "link", "phone", "contact"];


  var query = {};
  query["size"] = 100;
  query["query"]= {};
  query.query["filtered"] = {};
  query.query.filtered["query"] = {};
  query.query.filtered.query["multi_match"] = {};
  query.query.filtered.query.multi_match["query"] = "transportation";
  query.query.filtered.query.multi_match["type"] = "most_fields";
  query.query.filtered.query.multi_match["fields"] = search_fields;
  query.query.filtered.query.multi_match["tie_breaker"] = 0.3;
  query.query.filtered.query.multi_match["minimum_should_match"] = "70%";
  console.log(JSON.stringify(query, undefined, 2));
  var query_string = JSON.stringify(query, undefined, 0);

//   var query = '{"size":100, \
//                 "query": {\
//                   "filtered" : {\
//                     "query": { \
//                       "multi_match": { \
//                             "query":"{{search_terms}}", \
//                             "type": "most_fields", \
//                             "fields": [ "title^10", \
                                        // "department^9", \
                                        // "division", \
                                        // "category^5", \
                                        // "retention", \
                                        // "remarks", \
                                        // "on_site", \
                                        // "off_site", \
                                        // "total", \
                                        // "website", \
                                        // "link", \
                                        // "phone", \
                                        // "contact"], \
//                             "tie_breaker":0.3, \
//                             "minimum_should_match":"70%" \
//                         } \
//                       }, \
//                       "highlight": { \
//                         "pre_tags" : ["<strong class=\'search-highlight px1 regular \'>"], \
//                         "post_tags" : ["</strong>"], \
//                         "fields" : { \
//                           "title" : {}, \
//                           "department":{}, \
//                           "division": {}, \
//                           "category": {}, \
//                           "retention": {}, \
//                           "remarks": {}, \
//                           "on_site": {}, \
//                           "off_site": {}, \
//                           "total": {}, \
//                           "website":{}, \
//                           "contact":{}, \
//                           "link":{}, \
//                           "phone":{} \
//                         } \
//                       }, \
//                       "aggs" : { \
//                       "departments" : { \
//                           "terms" : { \
//                             "field" : "department.og" \
//                           }, \
//                           "aggs" : { \
//                           "division" : { \
//                           "terms" : { \
//                             "field" : "division.og" \
//                           } \
//                         } \
//                       } \
//                     }, \
//                         "category" : { \
//                           "terms" : { \
//                             "field" : "category.og" \
//                           } \
//                         }, \
//                         "retention" : { \
//                           "terms" : { \
//                             "field" : "retention.og" \
//                           } \
//                         } \
//                       } \
//                     }\
//                 }\
//               }';
//
//   var query = query.replace('{{search_terms}}', body.criteria.terms);
// console.log(query);
//
//     if(Object.keys(body.filters).length != 0){
//      var filter =  ',"post_filter": {   \
//        "and" : [ \
//        {{search_filters}} \
//        ] \
//      }';
//
//     var filters = body.filters;
//     var filter_list = '';
//
//     for (var item in filters){
//       filter_list += '{"terms": {"' + item + '": ["' + filters[item].join('","') + '"]}},';
//     }
//
//     filter_list = filter_list.slice(0,-1); // remove the trailing comma
//     query = query.substring(0, query.length - 1); //remove the last curly brace to insert filter
//
//     //insert the list of filters
//     query = query + filter.replace('{{search_filters}}', filter_list) + '}'; // last curly brace added back in
//
//    }

  request.post({
    url:ES_SERVER + 'record_types/_search',
    form: query_string},
    function(err,httpResponse,body){
      if (err){res.send(err);}
      res.send(body);
  })
}

module.exports = setup;
