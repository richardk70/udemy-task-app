// CRUD operations
const mongodb = require('mongodb');
// const MongoClient = mongodb.MongoClient;
// const ObjectID = mongodb.ObjectID;
const { MongoClient, ObjectID } = require('mongodb');

const dbName = 'Todo';

MongoClient.connect(process.env.MONGO_CONNECT, {useNewUrlParser: true}, (error, client) => {
    const db = client.db(dbName);

    if (error)
        return console.log('Unable to connect to DB.');
});