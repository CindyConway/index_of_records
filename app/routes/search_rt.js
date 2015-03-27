var request = require('request');

var ES_SERVER = 'http://localhost:9200/index_of_records/';

function setup(app) {
  app.put('/v1/search', getSearch);
}

function getSearch(req, res){
  var body = req.body;

  //create array of fields to search
  var search_fields = [ "title"];
  search_fields.push("department");
  search_fields.push("division");
  search_fields.push("category");
  search_fields.push("retention");
  search_fields.push("remarks");
  search_fields.push("on_site");
  search_fields.push("off_site");
  search_fields.push("total");
  search_fields.push("website");
  search_fields.push("link");
  search_fields.push("phone");
  search_fields.push("contact");

// Create the EleasticSearch query
  var queryObj = {};
  queryObj["size"] = 100;

  queryObj["query"] = {};
  queryObj.query["multi_match"] = {};
  queryObj.query.multi_match["query"] = body.criteria.terms;
  queryObj.query.multi_match["type"] = "most_fields";
  queryObj.query.multi_match["fields"] = search_fields;
  queryObj.query.multi_match["tie_breaker"] = 0.3;
  queryObj.query.multi_match["minimum_should_match"] = "70%";


  //This is the query format needed to limit the filters as well as the search resutls
  // I left this in here because I think the users may want this instead
  // queryObj["query"]= {};
  // queryObj.query.["query"] = {};
  // queryObj.query.query["multi_match"] = {};
  // queryObj.query.query.multi_match["query"] = body.criteria.terms;
  // queryObj.query.query.multi_match["type"] = "most_fields";
  // queryObj.query.query.multi_match["fields"] = search_fields;
  // queryObj.query.query.multi_match["tie_breaker"] = 0.3;
  // queryObj.query.query.multi_match["minimum_should_match"] = "70%";
  // queryObj.query["filtered"] = {};
  // queryObj.query.filtered["query"] = {};
  // queryObj.query.filtered.query["multi_match"] = {};
  // queryObj.query.filtered.query.multi_match["query"] = body.criteria.terms;
  // queryObj.query.filtered.query.multi_match["type"] = "most_fields";
  // queryObj.query.filtered.query.multi_match["fields"] = search_fields;
  // queryObj.query.filtered.query.multi_match["tie_breaker"] = 0.3;
  // queryObj.query.filtered.query.multi_match["minimum_should_match"] = "70%";

  // cause the search terms to return highlightes;
  queryObj["highlight"] = {};
  queryObj.highlight["pre_tags"] = ["<strong class=\'search-highlight px1 regular \'>"];
  queryObj.highlight["post_tag"] = ["</strong>"];
  queryObj.highlight["fields"] = {};
  queryObj.highlight.fields["title"] = {};
  queryObj.highlight.fields["department"] = {};
  queryObj.highlight.fields["division"] = {};
  queryObj.highlight.fields["category"] = {};
  queryObj.highlight.fields["retention"] = {};
  queryObj.highlight.fields["remarks"] = {};
  queryObj.highlight.fields["on_site"] = {};
  queryObj.highlight.fields["off_site"] = {};
  queryObj.highlight.fields["total"] = {};
  queryObj.highlight.fields["website"] = {};
  queryObj.highlight.fields["contact"] = {};
  queryObj.highlight.fields["link"] = {};
  queryObj.highlight.fields["phone"] = {};

  //cause aggregates to be returned. These are used as filters
  queryObj["aggs"] = {};
  queryObj.aggs["departments"] = {};
  queryObj.aggs.departments["terms"] = {};
  queryObj.aggs.departments.terms["field"] = "department.og";
  queryObj.aggs.departments["aggs"] = {};
  queryObj.aggs.departments.aggs["division"] = {};
  queryObj.aggs.departments.aggs.division["terms"] = {};
  queryObj.aggs.departments.aggs.division.terms["field"] = "division.og";
  queryObj.aggs.category = {};
  queryObj.aggs.category["terms"] = {};
  queryObj.aggs.category.terms["field"] = "category.og";
  queryObj.aggs.retention = {};
  queryObj.aggs.retention["terms"] = {};
  queryObj.aggs.retention.terms["field"] = "retention.og";

//if nothing is returned, suggest terms
  queryObj["suggest"] = {};
  queryObj.suggest["general"] = {}
  queryObj.suggest.general["text"] = body.criteria.terms;
  queryObj.suggest.general["term"] = {};
  queryObj.suggest.general.term["field"] =  "_all";
  queryObj.suggest.general.term["suggest_mode"] =  "missing";
  queryObj.suggest.general.term["size"] =  2;

  if(Object.keys(body.filters).length != 0){

    // This filter will limit the search results, but the filters do not change
    queryObj["post_filter"] = {};
    queryObj.post_filter["bool"]= {};
    queryObj.post_filter.bool["must"] = [];

    var filters = body.filters;
    for (var item in filters){
      obj = {};
      obj.terms = {};
      obj.terms[item] = filters[item];
      queryObj.post_filter.bool.must.push(obj);
    }

    // FILTER RESULTS **AND** FITLERS - User may ask me to do this instead
    // queryObj.query.filtered["filter"] = {};
    // queryObj.query.filtered.filter["bool"] = {};
    // queryObj.query.filtered.filter.bool["must"] = [];
    //
    // var filters = body.filters;
    // for (var item in filters){
    //   obj = {};
    //   obj.terms = {};
    //   obj.terms[item] = filters[item];
    //   queryObj.query.filtered.filter.bool.must.push(obj);
    // }
 }

  var queryString = JSON.stringify(queryObj, undefined, 0);
  //console.log(JSON.stringify(queryObj, undefined, 2));
  request.post({
    url:ES_SERVER + 'record_types/_search',
    form: queryString},
    function(err,httpResponse,body){
      if (err){res.send(err);}
      res.send(body);
  })
}

module.exports = setup;
