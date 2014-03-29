var express = require('express');
var app = express();
var path = require('path');
var key = require('./key');

app.set('views',__dirname + '/views');
app.set('view engine', 'jade');
app.use(app.router);
app.use(express.static(path.join(__dirname, "public")));
app.set('port', 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());

app.listen(3000, function() {
  console.log("Server listening on port 3000!");
});
console.log("Server is listening!");

var util = require('util'),
        twitter = require('twitter');
var twit = new twitter({
      consumer_key: key.consumer_key,
        consumer_secret: key.consumer_secret,
        access_token_key: key.access_token_key,
        access_token_secret: key.access_token_secret
});

app.get('/', twit.gatekeeper('/login'), function(req, res) {
  res.send("Sup");
});

app.get('/login', function(req, res) {
  res.redirect('/twauth');
});
app.get('/twauth', twit.login());

app.get('/load', function(req, res) {
  count = {};
  if (typeof req.query.one === "undefined" || typeof req.query.two === "undefined") {
    res.send(req.query.one);
    res.send("Dude, put something good, like /load?one=awesome?two=sick");
    return;
  }

  words = [];
  words.push(req.query.one);
  words.push(req.query.two);
  twit.search(req.query.two + " OR " + req.query.one, function(data) {
    if(!data.statuses) {
      console.log(data);
      res.send("Error 404");  
      return;
    }
    
    checkWinner(data, count, words, function(result) {
      if (result == null) {
        res.send("Something went wrong :(");
        return;
      }

      if (!(words[0] in result) && !(words[1] in result)) {
        res.send("No one wins :(");
        return;
      } else if (!(words[0] in result)) {
        res.render('index', {
          winner:words[1],
          loser:words[0]
        });
        return;
      } else if (!(words[1] in result)) {
        res.render('index', {
          winner:words[0],
          loser:words[1]
        });
        return;
      }

      var bestWord = result[words[0]] > result[words[1]] ? words[0] : words[1];
      var worstWord = bestWord === words[0] ? words[1] : words[0];
      var bestWord = bestWord;
      var worstWord = worstWord;
      console.log(worstWord);
      res.render('index', {
        winner:bestWord,
        loser:worstWord
      });
      return;
    });
  });
});

function checkWinner(data, count, words, callback) {
  if (words.length != 2) {
    callback(null);
  }
  console.log(words);

  console.log("===========",data.statuses.length);
  data.statuses.forEach(function(stuff) {
    console.log(stuff.text);
    if (stuff.text.indexOf(words[0]) != -1) {
      add(count, words[0]);
    }

    if (stuff.text.indexOf(words[1]) != -1) {
      add(count, words[1]);
    }
  });
  console.log("Done"); 
  callback(count); 
}

function add(count, word) {
  console.log(word);
  if (word in count) {
    count[word] = count[word] + 1;
  } else {
    count[word] = 1;
  }
}
