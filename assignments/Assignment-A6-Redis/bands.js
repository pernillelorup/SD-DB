/***
 * Excerpted from "Seven Databases in Seven Weeks",
 * published by The Pragmatic Bookshelf.
 * Copyrights apply to this code. It may not be used to create training material,
 * courses, books, articles, and the like. Contact us if you are in doubt.
 * We make no guarantees that this code is fit for any purpose.
 * Visit http://www.pragmaticprogrammer.com/titles/pwrdata for more book information.
 ***/

var // The port on which the HTTP server will run
  port = 8080,
  // standard libraries
  http = require("http"),
  redis = require("redis"),
  bricks = require("bricks"),
  mustache = require("mustache"),
  fs = require("fs"),
  // custom libraries
  couchUtil = require("./populateCouch.js"),
  neo4j = require("./neo4jCachingClient.js"),
  // database clients
  CouchConnection = require("cradle").Connection,
  couchClient = new CouchConnection().database("bands"),
  neo4jClient = neo4j.createClient({}),
  redisClient = redis.createClient(6379);

var cypher = neo4jClient.runCypher;

/*
 * Post one or more documents into CouchDB.
 * @param url is where we POST to.
 * @param docString a stringified JSON document.
 * @param count the number of documents being inserted.
 */
function getCouchDoc(path, res, callback) {
  couchClient.get(path, function (err, doc) {
    if (err) {
      console.error(`Error fetching from CouchDB: ${err.message}`);
      writeTemplate(res, "", { message: "Value not found" });
    } else {
      callback(doc);
    }
  });
}

/**
 * Wraps a block of HTML with a standard template. HTML lives in template.html.
 * @innerHtml populates the body of the template
 */
function htmlTemplate(innerHtml) {
  var file_data = fs.readFileSync("template.html", "utf8");
  return file_data.replace("[[YIELD]]", innerHtml);
}

function writeTemplate(response, innerHtml, values) {
  response.write(mustache.to_html(htmlTemplate(innerHtml), values));
  response.end();
}

// A Node.js web app utility setup
var appServer = new bricks.appserver();

// attach request plugin to easily extract params
appServer.addRoute("^/", appServer.plugins.request);

/*
 * Just display a blank form if no band is given.
 */
appServer.addRoute("^/$", function (req, res) {
  writeTemplate(res, "", { message: "Find a band" });
});

/*
 * Accepts a band name and displays all artists in the band.
 * Also displays a list of suggested bands where at least
 * one artist has played at one time.
 */
appServer.addRoute("^/band$", function (req, res) {
  var bandName = req.param("name"),
    bandNodePath = couchUtil.couchKeyify(bandName),
    membersCypherQuery = `MATCH (Band {name: "${bandName}"})-[:member*1..3]-(b:Band) RETURN DISTINCT b LIMIT 10`;

  getCouchDoc(bandNodePath, res, function (couchDoc) {
    var artists = couchDoc && couchDoc["artists"];

    cypher(membersCypherQuery, function (bandsGraphData) {
      var bands = [];
      bandsGraphData.data.forEach(function (band) {
        bands.push(band[0].data.name);
      });

      var values = { band: bandName, artists: artists, bands: bands };

      var template = `
        <h2>{{band}} Band Members</h2>
        <ul>
          {{#artists}}
          <li><a href="/artist?name={{name}}">{{name}}</a></li>
          {{/artists}}
        </ul>
        <h3>You may also like</h3>
        <ul>
          {{#bands}}
          <li><a href="/band?name={{.}}">{{.}}</a></li>
          {{/bands}}
        </ul>
      `;

      writeTemplate(res, template, values);
    });
  });
});

/*
 * Accepts an artist name and displays band and role information
 */
appServer.addRoute("^/artist$", function (req, res) {
  var artistName = req.param("name"),
    rolesCypherQuery = `MATCH (Artist {name: "${artistName}"})-[:plays]-(r:Role) RETURN r`,
    bandsCypherQuery = `MATCH (Artist {name: "${artistName}"})-[:member]-(b:Band) RETURN b`;

  cypher(rolesCypherQuery, function (rolesGraphData) {
    cypher(bandsCypherQuery, function (bandsGraphData) {
      var roles = [],
        bands = [];

      rolesGraphData.data.forEach(function (role) {
        roles.push(role[0].data.role);
      });

      bandsGraphData.data.forEach(function (band) {
        bands.push(band[0].data.name);
      });

      var values = { artist: artistName, roles: roles, bands: bands };

      var template = `
          <h3>{{artist}} Performs these Roles</h3>
          <ul>
            {{#roles}}
            <li>{{.}}</li>
            {{/roles}}
          </ul>
          <h3>Play in Bands</h3>
          <ul>
            {{#bands}}
            <li><a href="/band?name={{.}}">{{.}}</a></li>
            {{/bands}}
          </ul>
        `;
      writeTemplate(res, template, values);
    });
  });
});

/*
 * A band name search. Used for autocompletion.
 */
appServer.addRoute("^/search$", function (req, res) {
  var query = req.param("term");

  redisClient.keys(`band-name:${query}*`, function (error, keys) {
    var bands = [];
    keys.forEach(function (key) {
      bands.push(key.replace("band-name:", ""));
    });
    res.write(JSON.stringify(bands));
    res.end();
  });
});

// catch all unknown routes with a 404
appServer.addRoute(".+", appServer.plugins.fourohfour);
appServer.addRoute(".+", appServer.plugins.loghandler, { section: "final" });

// start up the server
console.log(`Starting Server on port ${port}`);
appServer.createServer().listen(port);
