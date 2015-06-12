var express = require('express');
var request = require('request');
var moment = require('moment');
var ig = require('instagram-node').instagram();
var app = express();

app.use(express.static(__dirname + '/public'));

app.set('port', (process.env.PORT || 8000));

app.get('/feed', function(req, res) {
  //have the base instagram URL
  var instagramURL = "https://api.instagram.com/v1";
  // get your own client id http://instagram.com/developer/
  var instaClientId = '6a4536f6c1334d1cb0e37519930b084c';
  ig.use({
    client_id: 'b22f1558148641a5a06eaeb8e2d06f16',
    client_secret: '26ddac68deb14c1a91c0fc3547471ae7'
  });

  var allResults = [];
  var count = 0;
  var hdl = function(err, result, pagination, remaining, limit) {
    // Your implementation here



    allResults[count] = JSON.stringify(result);
    count = count + 1;
    try {
      if (pagination.next) {
        pagination.next(hdl); // Will get second page results
      } else {
        var finalResult = "";
        for (i = 0; i < allResults.length; i++) {
          finalResult += ('"' + i.toString() + '":' + allResults[i]);
          if (i + 1 < allResults.length) {
            finalResult += ",";
          }
        }
        finalResult = "{" + finalResult + "}";
        finalResult = JSON.parse(finalResult);

        var keyWords = {
          'engagement': ['shesaidyes', 'proposed', 'proposal', 'engagement party', 'she said yes', 'engagment ring', 'engaged', 'engagement'],

          'wedding_shower': ['wedding shower', 'shower'],

          'bachelor/bachelorette_party': ['bachelorette', 'bachelorette party','bachelor party', 'bachelor'],

          'dress_shopping': ['shopping', 'trying on', 'yes to the dress'],

          'rehearsal_dinner': ['tomorrow', 'rehearsal dinner', 'big day tomorrow', 'practice'],

          // emojis
          // first dance, father-daughter, father daughter, father/daughter, first kiss, I do, just married, diamond
          'wedding_day': ['I do', 'big day', 'aisle', 'dance', 'vows', 'father', 'family', 'daughter', 'father daughter', 'cake', 'diamond', 'first kiss', 'just married', 'tonight', 'bridesmaid', 'rings', 'husband and wife', 'line up'],

          'reception': ['reception', 'speeches', 'toast', 'first dance', 'wedding cake', 'cake', 'bouquet toss', 'garter'],

          'drive_away': ['sparklers', 'just married'],

          'throw_back': ['tbt']
        };

        var keys = [];
        var keyValues = [];
        for (var key in keyWords) {
          if (keyWords.hasOwnProperty(key)) {
            keys.push(key);
            keyValues.push(keyWords[key]);

          }
        }

        finalResult = tagPhotos(finalResult, keys, keyValues, keyWords);

        // finalResult as returned from reorderPhotos is a giant array, not a complicated
        // JSON object like before
        finalResult = reorderPhotos(finalResult, keys, keyValues, keyWords);


        x = instaToTimeline(finalResult, req.query.hashtag);
        res.json(x);
      }
    } catch (e) {
      console.log("Error detected:", e);
    }

  };
  x = ig.tag_media_recent(req.query.hashtag, hdl);
});

function tagPhotos(finalResult, keys, keyValues, keyWords) {
  for (var i = 0; i < Object.keys(finalResult).length; i++) {
    for (var j = 0; j < Object.keys(finalResult[i]).length; j++) {

      var captions = JSON.stringify(finalResult[i][j].caption.text.toLowerCase());

      var key_index = 0;
      while (key_index < keys.length) {
        for (var k in keyWords[keys[key_index]]) {
          var index = new RegExp("\\b" + keyWords[keys[key_index]][k] + "\\b", "i");
          if (captions.match(index)) {
            // console.log("internal tags: " + keys[key_index]);
            finalResult[i][j].internalTag = keys[key_index];
            console.log("FINAL RESULT INTERNAL TAGGING: " + JSON.stringify(finalResult[i][j], null, 4));
          }
        }
        key_index++;
      }
    }
  }
  return finalResult;
}

function reorderPhotos(finalResult, keys, keyValues, keyWords) {
  // Store the photos into a giant array...it's easier this way
  var photos = [];
  for (var i = 0; i < Object.keys(finalResult).length; i++) {
    for (var j = 0; j < Object.keys(finalResult[i]).length; j++) {
      photos.push(finalResult[i][j]);
    }
  }

  // Initialize an array of arrays such that the first index corresponds to
  // the internal tag and the second array corresponds to the index in the
  // complete list of photos. Example:
  // tempIndices[0] = [4, 51, 67] would mean that the 1st tag (engagement
  // in our case) is the internal tag for pictures with indices 4, 51, and 67.
  var temp = [];
  var tempIndices = [];
  for (var i = 0; i < keys.length+1; i++) {
    tempIndices[i] = [];
  }

  var minDate = Infinity;

  // Loop over all of the photos, looking for tags and putting them into the
  // correct place in the array like above
  for (var i = 0; i < photos.length; i++) {
    keyIndex = keys.indexOf(photos[i].internalTag);

    // If we have a tag, put it in the array
    if (keyIndex != -1) {
      // If we happen to be the first tag, then check to see if it's the
      // earliest date (so we can base our slideshow off of it)
      if (photos[i].created_time < minDate) {
        minDate = photos[i].created_time;
        console.log('min date found', minDate);
      }
      tempIndices[keyIndex].push(i);
    }
    // Otherwise, we don't have a tag
    else {
      tempIndices[keys.length].push(i);
    }
  }

  // Loop over the keys, ordering the photos according to their grouping
  for (var i = 0; i < keys.length; i++) {
    for (var j = 0; j < tempIndices[i].length; j++) {
      var t = photos[tempIndices[i][j]];
      // Give them some ficitious time such that the photos are in order according
      // to their grouping, not their posting time
      t.created_time = parseInt(minDate) + i * 10 + j;
      t.created_time = t.created_time.toString();
      console.log(t.created_time);
      temp.push(t);
    }
  }
  console.log(tempIndices);
  return temp;
}

function instaToTimeline(d, htag) {
  // Maximum likes for cover image (disabled cuz it's a weird pic)
  // maxLikes = 0;
  // url = '';
  // for (j = 0; j < d.length; j++) {

  //   if (row.likes.count > maxLikes) {
  //     console.log(row.likes.count)
  //     maxLikes = row.likes.count;
  //     url = row.images.standard_resolution.url;
  //   }
  // }

  if (d.length > 7) {
    row = d[7];
  } else {
    row = Math.random() * (d.length - 1);
  }
  url = row.images.standard_resolution.url;

  var instaObj = {
    "title": {
      "media": {
        "url": url,
        "caption": "",
        "credit": ""
      },
      "text": {
        "headline": "#" + htag,
        "text": ""
      }
    },
    "events": []
  }

  for (j = 0; j < d.length; j++) {
    row = d[j];
    tempDate = moment(new Date(row.created_time * 1000));

    var eventSection = "";
    switch(row.internalTag) {
      case "engagement":
        eventSection = "Engagement";
        break;
      case "wedding_shower":
        eventSection = "Wedding Shower";
        break;
      case "bachelor/bachelorette_party":
        eventSection = "Bachelor/Bachelorette Party";
        break;

      case "dress_shopping":
        eventSection = "Dress Shopping"
        break;

      case "rehearsal_dinner":
        eventSection = "Rehearsal Dinner";
        break;
      case "wedding_day":
        eventSection = "Wedding Day";
        break;
      case "reception":
        eventSection = "Reception";
        break;
      case "drive_away":
        eventSection = "Drive Away";
        break;
      case "throw_back":
        eventSection = "Throw Back Thursday";
        break;
    }

    instaObj.events[j] = {
      "media": {
        "url": row.images.standard_resolution.url,
        "caption": row.internalTag,
        "credit": "@" + row.user.username,
        "thumb": row.images.standard_resolution.url
      },
      "start_date": {
        "month": tempDate.format("MM"),
        "day": tempDate.format("DD"),
        "year": tempDate.format("YYYY"),
        "hour": tempDate.format("HH"),
        "minute": tempDate.format("mm"),
        "second": tempDate.format("ss")
      },
      "text": {
        "headline": eventSection,
        "text": "<p>" + row.caption.text + "</p>"
      },
    }
  }

  return JSON.parse(JSON.stringify(instaObj));
}

app.get('*', function(req, res) {
  res.sendFile('index.html');
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
