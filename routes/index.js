module.exports = function(io) {
    var express = require('express');
    var mongodb = require('mongodb').MongoClient;

    var router = express.Router();
    var app = express();

    /* GET home page. */
    router.get('/', function(req, res, next) {
        res.render('index', {
            title: 'WebChat'
        });
    });

    mongodb.connect('mongodb://localhost/chat', function(err, db) {
        if (err) {
            console.log("MongoDB error");
            throw err;
        } else {
            console.log("MongoDB: Connected to chat DB");
        }

        io.on('connection', function(socket) {
            var col = db.collection('messages');
            var sendStatus = function(s) {
                socket.emit('status', s);
            };

            // Emit all messages
            col.find().limit(100).sort({_id: 1}).toArray(function(err, res) {
                if (err) throw err;
                socket.emit('output', res);
            });

            // Wait for input
            socket.on('input', function(data) {
                console.log("User sent data: ", data);
                var name = data.name;
                var message = data.message;
                var whiteSpaceRegex = /^\s*$/;

                if (whiteSpaceRegex.test(name) || whiteSpaceRegex.test(message)) {
                    console.log("Invalid input");
                    sendStatus('Name and message is required.');
                } else {
                    col.insert({name: name, message: message}, function() {
                        console.log('User data inserted');

                        // Emit  latest message to all clients connected to the web chat
                        // Data has to go back as an array: [data]
                        io.emit('output', [data]);

                        sendStatus({
                            message: "Message sent",
                            clear: true
                        });
                    });
                }
            });
        });
    });

    return router;
}

