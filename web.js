var http = require('http');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var port = process.env.PORT || 3000;

var botId = 'ff62f374fe343f73';

var server = http.createServer(function(req, res) {
  req.startTime = new Date();
  console.log('--> [' + req.method + '] "' + req.url + '" at ' + req.startTime);
  if (req.method === 'OPTIONS') {
    options(req, res);
  } else if (req.method === 'GET' && req.url === '/') {
    root.get(req, res);
  } else if (req.method === 'POST' && req.url === '/') {
    root.post(req, res);
  }
});

function options(req, res) {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':  'content-type, accept',
  });
  res.end();
  console.log('--> 200 OK in ' + ((new Date() - req.startTime) / 1000) + ' seconds');
}

var root = {}

root.get = function(req, res) {
  res.writeHead(200);
  res.end("Hi.");
  console.log('  --> 200 OK in ' + ((new Date() - req.startTime) / 1000) + ' seconds');
}

root.post = function(req, res) {
  var query = '';
  var body = '';

  // Handle incoming data
  req.on('data', function(chunk) {
    query += '&' + chunk;
  });

  req.on('end', function() {
    if (!/botid=/.test(query)) query += '&botid=' + botId;

    var options = {
      host: 'www.pandorabots.com',
      port: 80,
      path: '/pandora/talk-xml',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': query.length
      }
    }

    var post = http.request(options, function(postRes) {
      postRes.on('data', function(postData) {
        body += postData;
      });
      postRes.on('end', function() {
        parser.parseString(body, function(err, json) {
          if (err || !json) {
            console.log('  --> Error parsing response.');
            return false;
          }
          var responseJSON= {
            customer_id: json['@'].custid,
            bot_id: json['@'].botid,
            status: json['@'].status,
            response: json.that
          }
          var response = JSON.stringify(responseJSON);
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Content-Length': response.length
          });
          res.end(response);
          console.log('  --> 200 OK in ' + ((new Date() - req.startTime) / 1000) + ' seconds');
        });
      })
    });

    post.write(query);
    post.end();
  })
}

server.listen(port, function() {
  console.log("Server listening on port " + port);
});

