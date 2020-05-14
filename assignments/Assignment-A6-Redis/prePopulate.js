/***
 * Excerpted from "Seven Databases in Seven Weeks",
 * published by The Pragmatic Bookshelf.
 * Copyrights apply to this code. It may not be used to create training material,
 * courses, books, articles, and the like. Contact us if you are in doubt.
 * We make no guarantees that this code is fit for any purpose.
 * Visit http://www.pragmaticprogrammer.com/titles/pwrdata for more book information.
***/
var
  // The TSV file containing the data for our exercise
  tsvFilename = 'group_membership.tsv',
  // Track how many file lines we've processed
  processedLines = 0,

  // Import libraries
  csv = require('csv-parser'),
  redis = require('redis'),
  fs = require('fs'),

  // Redis client
  redisClient = redis.createClient(6379);
//hej
/**
 * A helper function that splits up the comma-seperated list of roles and
 * converts it to an array. If no valid roles exist, return an empty array.
 * @param string the CSV to split into a role array
 */
function buildRoles(string) {
  if (string === undefined) {
    return [];
  } else {
    var roles = string.split(',');
    if (roles.length === 1 && roles[0] === '') {
      roles = [];
    }
    return roles;
  }
};

/**
 * Utility function that increments the total number
 * of lines (artists) processed and outputs every 1000.
 */
function trackLineCount() {
  if (++processedLines % 1000 === 0) {
    console.log(`Lines Processed: ${processedLines}`);
  }
}

/**
 * This function does all the heavy lifting. It loops through the
 * TSV data file and populates Redis with the given values.
 */
function populateRedis() {
  var stream = csv({
    separator: '\t',
    newline: '\n'
  });

  fs.createReadStream(tsvFilename)
    .pipe(stream)
    .on('data', function(data) {
      var
        artist = data['member'],
        band = data['group'],
        roles = buildRoles(data['role']);

      if (artist === '' || band === '') {
        trackLineCount();
        return true;
      }

      redisClient.sadd('band:' + band, artist);

      if (roles.length > 0) {
        roles.forEach(function(role) {
          redisClient.sadd(`artist:${band}:${artist}`, role);
        });
      }

      trackLineCount();
    })
    .on('end', function(totalLines) {
      console.log(`Total lines processed: ${processedLines}`);
      redisClient.quit();
    });
};

populateRedis();
