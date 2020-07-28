const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
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