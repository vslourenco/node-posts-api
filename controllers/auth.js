const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const { email, password, name } = req.body;
  bcrypt.hash(password, 12)
    .then((hashedPaswword) => {
      const user = new User({ email, password: hashedPaswword, name });
      return user.save();
    })
    .then((result) => res.status(201).json({
      message: 'User created!',
      // eslint-disable-next-line no-underscore-dangle
      userId: result._id,
    }))
    .catch((err) => {
      const error = err;
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      return next(error);
    });
};

exports.login = (req, res, next) => {
  const { email, password } = req.body;
  let loadedUser;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        const error = new Error('Invalid email or password!');
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error('Invalid email or password!');
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign({
        // eslint-disable-next-line no-underscore-dangle
        email: loadedUser.email, userId: loadedUser._id.toString(),
      },
      'nodefeedsupersecret',
      { expiresIn: '1h' });

      // eslint-disable-next-line no-underscore-dangle
      return res.status(200).json({ token, userId: loadedUser._id.toString() });
    })
    .catch((err) => {
      const error = err;
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      return next(error);
    });
};

exports.getUserStatus = (req, res, next) => {
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error('User not find post!');
        error.statusCode = 404;
        throw error;
      }
      return res.status(200).json({ status: user.status });
    })
    .catch((err) => {
      const error = err;
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      return next(error);
    });
};

exports.updateUserStatus = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const { status } = req.body;
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error('User not find post!');
        error.statusCode = 404;
        throw error;
      }
      // eslint-disable-next-line no-param-reassign
      user.status = status;
      return user.save();
    })
    .then(() => res.status(200).json({ message: 'User updated.' }))
    .catch((err) => {
      const error = err;
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      return next(error);
    });
};
