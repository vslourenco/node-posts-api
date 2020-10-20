const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const { graphqlHTTP } = require('express-graphql');

const auth = require('./middleware/is-auth');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const FileHelper = require('./util/file');

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

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  }

  next();
});

app.use(auth);

app.post('/post-image', (req, res, next) => {
  if (!req.isAuth) {
    const error = new Error('Not authenticated!');
    error.code = 401;
    throw error;
  }
  if (!req.file) {
    return res.status(200).json({ message: 'No file provided!' });
  }

  if (req.body.oldPath) {
    FileHelper.deleteFile(req.body.oldPath);
  }

  return res.status(201).json({ message: 'File stored.', filePath: req.file.path });
});

app.use('/graphql', graphqlHTTP({
  schema: graphqlSchema,
  rootValue: graphqlResolver,
  graphiql: true,
  formatError(err) {
    if (!err.originalError) {
      return err;
    }
    const { data } = err.originalError;
    const message = err.message || 'An error ocurred!';
    const status = err.originalError.code || 500;

    return { message, status, data };
  },
}));

app.use((error, req, res, next) => {
  res.status(error.statusCode || 500).json({ message: error.message, data: error.data });
  next();
});

mongoose.connect(MONGODB_URI)
  .then(() => {
    const server = app.listen(8080);
    // eslint-disable-next-line global-require
    const io = require('./socket').init(server);
    io.on('connection', (socket) => {
      console.log(`Client connected! Socket:${socket}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
