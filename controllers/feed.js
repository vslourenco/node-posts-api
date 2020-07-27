const { validationResult } = require('express-validator/check');
const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
  Post.find()
    .then((posts) => {
      res.status(200).json({ message: 'Fetched posts successfuly.', posts });
    })
    .catch((err) => {
      const error = err;
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      return next(error);
    });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path;
  const { title, content } = req.body;
  const post = new Post({
    title,
    content,
    imageUrl,
    creator: { name: 'Vinicius' },
  });
  post.save()
    .then((result) => res.status(201).json({
      message: 'Post created successfully!',
      post: result,
    }))
    .catch((err) => {
      const error = err;
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      return next(error);
    });
};

exports.getPost = (req, res, next) => {
  const { postId } = req.params;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error('Could not find post!');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: 'Post fetched.', post });
    })
    .catch((err) => {
      const error = err;
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      return next(error);
    });
};
