var express = require('express')
  , http = require('http')
  , app = express()
  , path = require('path')
  , server = http.createServer(app);

app.use(express.static(__dirname+'/view'));
app.use(express.static(__dirname+'/scripts'));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname+'/view/index.html'));
});

server.listen(8000, function() {
  console.log('Express server listening on port ' + server.address().port);
});