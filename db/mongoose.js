const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/Todo', { useNewUrlParser: true, useCreateIndex: true });