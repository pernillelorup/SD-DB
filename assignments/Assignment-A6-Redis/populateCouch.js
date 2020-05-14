/***
 * Excerpted from "Seven Databases in Seven Weeks",
 * published by The Pragmatic Bookshelf.
 * Copyrights apply to this code. It may not be used to create training material,
 * courses, books, articles, and the like. Contact us if you are in doubt.
 * We make no guarantees that this code is fit for any purpose.
 * Visit http://www.pragmaticprogrammer.com/titles/pwrdata for more book information.
***/

var
  // how many bands we expect to process
  totalBands = null,
  // and keep track of how many bands we have processed
  processedBands = 0,
  // The name of the couch database
  couchDBDatabase = 'bands',
  // The size of document upload batches
  batchSize = 50,

  // standard libraries
  http = require('http'),
  redis = require('redis'),

  // database clients
  CouchConnection = require('cradle').Connection,
  couchClient = new(CouchConnection)().database(couchDBDatabase),
  redisClient = redis.createClient(6379);
/**
 * A helper function that builds a good CouchDB key
 * @param string the unicode string being keyified
 */
function couchKeyify(string)
{
  // remove bad chars, and disallow starting with an underscore
  return string.
    replace(/[\t \?\#\\\-\+\.\,'"()*&!\/]+/g, '_').
    replace(/^_+/, '');
};

/*
 * Keep track of the number of bands processed, output every 1000 loaded,
 * and close the Redis client when we've loaded them all.
 */
function trackLineCount(increment) {
  processedBands += increment;

  // Output once every 1000 lines
  if (processedBands % 1000 === 0) {
    console.log('Bands Loaded: ' + processedBands);
  }

  // Close the Redis client when complete
  if (totalBands <= processedBands) {
    console.log(`Total Bands Loaded: ${processedBands}`);
    redisClient.quit();
  }
};

/*
 * Post documents into CouchDB in bulk.
 * @param documents The documents to store
 * @param count The number of documents being inserted.
 */
function saveDocs(documents, count) {
  couchClient.save(documents, function(err, res) {
    if (err) {
      console.error(`saveDocs tot error: ${err.message}`);
    } else {
      trackLineCount(count);
    }
  });
};

/*
 * Loop through all of the bands populated in Redis. We expect
 * the format of each key to be 'band:Band Name' having the value
 * as a set of artist names. The artists each have the list of roles
 * they play in each band, keyed by 'artist:Band Name:Artist Name'.
 * The band name, set of artists, and set of roles each artist plays
 * populates the CouchDB documents. eg:
  {
    name:"Nirvana",
    artists:[{
      name: "Kurt Cobain",
      roles:["Lead Vocals", "Guitar"]
    },...]
  }
 */
function populateBands() {
  // Create the "bands" database
  couchClient.create(function(err) {
    console.error(`Could not create the bands database in CouchDB: ${err.message}`);
  });

  redisClient.keys('band:*', function(err, bandKeys) {
    totalBands = bandKeys.length;
    var
      readBands = 0,
      bandsBatch = [];

    bandKeys.forEach(function(bandKey) {
      // substring of 'band:'.length gives us the band name
      var bandName = bandKey.substring(5);
      redisClient.smembers(bandKey, function(err, artists) {
        // batch the Redis calls to get all artists' information at once
        var roleBatch = [];
        artists.forEach(function(artistName) {
          roleBatch.push([
            'smembers',
            `artist:${bandName}:${artistName}`
          ]);
        });

        // batch up each band member to find the roles they play
        redisClient.
          multi(roleBatch).
          exec(function(err, roles) {
            var
              i = 0,
              artistDocs = [];

            // build the artists sub-documents
            artists.forEach(function(artistName) {
              artistDocs.push({ name: artistName, role : roles[i++] });
            });

            // add this new band document to the batch to be executed later
            bandsBatch.push({
              _id: couchKeyify(bandName),
              name: bandName,
              artists: artistDocs
            });
            // keep track of the total number of bands read
            readBands++;

            // upload batches of 50 values to couch, or the remaining values left
            if (bandsBatch.length >= batchSize || totalBands - readBands == 0) {
              saveDocs(bandsBatch, bandsBatch.length);

              // empty out the batch array to be filled again
              bandsBatch = [];
            }
          }
        );
      });
    });
  });
};

// expose couchKeyify function
exports.couchKeyify = couchKeyify;

// start populating bands if running as main script
if (!module.parent) {
  populateBands();
}
