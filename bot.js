const Discord = require('discord.js');
const client = new Discord.Client();
const request = require('request');
const fs = require('fs');
const Faced = require('faced');
var faced = new Faced();
const Jimp = require('jimp');

client.on('ready', function() {
  console.log('Bot ready.');
});

var isUriImage = function(uri) {
  //make sure we remove any nasty GET params
  uri = uri.split('?')[0];
  //moving on, split the uri into parts that had dots before them
  var parts = uri.split('.');
  //get the last part ( should be the extension )
  var extension = parts[parts.length-1];
  //define some image types to test against
  var imageTypes = ['jpg','jpeg','tiff','png','gif','bmp'];
  //check if the extension matches anything in the list.
  if(imageTypes.indexOf(extension) !== -1) {
    return true;
  }
}

var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

client.on('message', function(message) {
  var match_data = message.content.match(/ayy/i);
  if(match_data) {
    message.channel.sendMessage("lmao");
    return;
  }

  var url_regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/
  match_data = message.content.match(url_regex);
  if(match_data) {
    var uri = match_data[0];
    var path_parts = match_data[2].split('/');
    var filename = './images/' + path_parts[path_parts.length - 1];
    download(uri, filename, function() {
      faced.detect(filename, function(faces, image, file) {
        console.log("Found " + faces.length + " faces.");
        for(var i = 0; i < faces.length; i++) {
          var face = faces[i];
          Jimp.read(filename).then(function(_face, _i, _channel, img) {
            var x = _face.getX();
            var y = _face.getY();

            var w = _face.getWidth();
            var h = _face.getHeight();

            img.crop(x, y, w, h);
            img.scale(5);
            img.getBuffer(Jimp.AUTO, function(err, buf) {
              console.log(err, buf);
              _channel.sendFile(buf);
            });
          }.bind(null, face, i, message.channel));
        }
      });
    });
    return;
  }

  if(message.attachments.size > 0) {
    var images = message.attachments.forEach(function(attachment) {
      if(attachment.width && attachment.height && !message.author.bot) {
        var uri = attachment.url;
        var filename = './images/' + attachment.filename;
        download(uri, filename, function() {
          faced.detect(filename, function(faces, image, file) {
            console.log("Found " + faces.length + " faces.");
            for(var i = 0; i < faces.length; i++) {
              var face = faces[i];
              Jimp.read(filename).then(function(_face, _i, _channel, img) {
                var x = _face.getX();
                var y = _face.getY();

                var w = _face.getWidth();
                var h = _face.getHeight();

                img.crop(x, y, w, h);
                img.getBuffer(Jimp.AUTO, function(err, buf) {
                  console.log(err, buf);
                  _channel.sendFile(buf);
                });
              }.bind(null, face, i, message.channel));
            }
          });
        });
      }
    });
  }
});

fs.readFile('API_KEY', 'UTF-8', function(err, content) {
	client.login(content);
});
