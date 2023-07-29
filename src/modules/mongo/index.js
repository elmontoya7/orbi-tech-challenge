// libraries
var mongoose = require('mongoose');

//Set up default mongoose connection
var mongoDB = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@main.2vegxnu.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`

// connect to db
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Mongo connected');
});

module.exports = db