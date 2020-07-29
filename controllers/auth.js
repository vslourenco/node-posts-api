const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await new User({ email, password: hashedPassword, name });
    await user.save();
    return res.status(201).json({
      message: 'User created!',
      // eslint-disable-next-line no-underscore-dangle
      userId: user._id,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('Invalid email or password!');
      error.statusCode = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);

    if (!isEqual) {
      const error = new Error('Invalid email or password!');
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign({
      // eslint-disable-next-line no-underscore-dangle
      email: user.email, userId: user._id.toString(),
    },
    'nodefeedsupersecret',
    { expiresIn: '1h' });

    // eslint-disable-next-line no-underscore-dangle
    return res.status(200).json({ token, userId: user._id.toString() });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    return next(error);
  }
};

exports.getUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('User not find post!');
      error.statusCode = 404;
      throw error;
    }
    return res.status(200).json({ status: user.status });
  } catch (err) {
    const error = err;
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    return next(error);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const { status } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('User not find post!');
      error.statusCode = 404;
      throw error;
    }
    // eslint-disable-next-line no-param-reassign
    user.status = status;
    await user.save();
    return res.status(200).json({ message: 'User updated.' });
  } catch (err) {
    const error = err;
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    return next(error);
  }
};
