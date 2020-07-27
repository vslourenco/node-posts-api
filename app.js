const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');

const feedRoutes = require('./routes/feed');

const app = express();

const MONGODB_URI = 'mongodb+srv://omnistack:omnistack@development-h5m1r.mongodb.net/nodefeed?retryWrites=true&w=majority';

const fileStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'images');
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.json()); // application/json
app.use(multer({ storage: fileStorage, fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/feed', feedRoutes);
app.use((error, req, res, next) => {
  res.status(error.statusCode || 500).json({ message: error.message });
  next();
});

mongoose.connect(MONGODB_URI)
  .then(() => {
    app.listen(8080);
  })
  .catch((err) => {
    console.log(err);
  });
