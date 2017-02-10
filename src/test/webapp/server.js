var fs = require('fs');
var http = require('http');
var options = {
    // key: fs.readFileSync('server-key.pem'),
    // cert: fs.readFileSync('server-crt.pem'),
    // ca: fs.readFileSync('ca-crt.pem'),
};
// TODO: create vagrant image to run this stuff and allow port 80
http.createServer(function (req, res) {
    console.log(new Date()+' '+
        req.connection.remoteAddress+' '+
        req.method+' '+req.url);
    res.writeHead(200);
    res.end(fs.readFileSync('swagger.json'));
}).listen(80);
