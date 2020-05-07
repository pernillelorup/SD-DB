/***
 * Excerpted from "Seven Databases in Seven Weeks",
 * published by The Pragmatic Bookshelf.
 * Copyrights apply to this code. It may not be used to create training material,
 * courses, books, articles, and the like. Contact us if you are in doubt.
 * We make no guarantees that this code is fit for any purpose.
 * Visit http://www.pragmaticprogrammer.com/titles/pwrdata for more book information.
 ***/

var // Standard libraries
  events = require("events"),
  esc = require("querystring").escape,
  redis = require("redis"),
  // Custom libraries
  couch = require("../couchdb/watchChangesContinuous.js"),
  neo4j = require("./neo4jCachingClient.js"),
  // Database clients
  neo4jClient = neo4j.createClient(),
  couchWatcher = couch.createWatcher({
    db: "bands",
  }),
  redisClient = redis.createClient(6379);

// feed band information into redis for autocompleter
function feedBandToRedis(band) {
  redisClient.set(`band-name:${band.name}`, 1);
  band.artists.forEach(function (artist) {
    redisClient.set(`artist-name:${artist.name}`, 1);
    artist.role.forEach(function (role) {
      redisClient.set(`role-name:${role}`, 1);
    });
  });
}

/**
 * feed band membership and artist/role content from CouchDB to Neo4j.
 * @param band A band document from CouchDB.
 * @param progress EventEmitter to emit progress events.
 */
function feedBandToNeo4j(band, progress) {
  var lookup = neo4jClient.lookupOrCreateNode,
    relate = neo4jClient.createRelationship;

  lookup("bands", "name", band.name, "Band", function (bandNode) {
    progress.emit("progress", "band");
    band.artists.forEach(function (artist) {
      lookup("artists", "name", artist.name, "Artist", function (artistNode) {
        progress.emit("progress", "artist");
        relate(bandNode.metadata.id, artistNode.self, "member", function () {
          progress.emit("progress", "member");
        });
        artist.role.forEach(function (role) {
          lookup("roles", "role", role, "Role", function (roleNode) {
            progress.emit("progress", "role");
            relate(artistNode.metadata.id, roleNode.self, "plays", function () {
              progress.emit("progress", "plays");
            });
          });
        });
      });
    });
  });
}

// Process only interesting bands (ones with artists who have roles)
function processBand(band, progress) {
  // Change this to true to process all bands
  var addBand = false;

  band.artists.forEach(function (artist) {
    if (artist.role.length > 0) {
      addBand = true;
    }
  });

  if (addBand) {
    feedBandToRedis(band);
    feedBandToNeo4j(band, progress);
  }
}

// Progress-reporting measures (how much work has been done)
var stats = { doc: 0, band: 0, artist: 0, member: 0, role: 0, plays: 0 },
  progress = new events.EventEmitter(),
  timer = setInterval(function () {
    console.log(stats);
  }, 1000);

progress.on("progress", function (type) {
  stats[type] = (stats[type] || 0) + 1;
});

// start watching couch and processing bands as they come in
couchWatcher
  .on("change", function (data) {
    progress.emit("progress", "doc");
    if (data.doc && data.doc.name) {
      processBand(data.doc, progress);
    }
  })
  .start();
