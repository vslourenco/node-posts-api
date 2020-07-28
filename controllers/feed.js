const { validationResult } = require('express-validator/check');
const Post = require('../models/post');
const User = require('../models/user');
const FileHelper = require('../util/file');

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;
  Post.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    })
    .then((posts) => {
      res.status(200).json({ message: 'Fetched posts successfuly.', posts, totalItems });
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
    creator: req.userId,
  });
  post.save()
    .then(() => User.findById(req.userId))
    .then((user) => {
      user.posts.push(post);
      return user.save();
    })
    .then((user) => {
      res.status(201).json({
        message: 'Post created successfully!',
        post,
        // eslint-disable-next-line no-underscore-dangle
        creator: { _id: user._id, name: user.name },
      });
    })
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

exports.updatePost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    throw error;
  }
  const {
    title, content,
  } = req.body;
  const {
    postId,
  } = req.params;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    throw error;
  }
  Post.findById(postId)
    .then((postData) => {
      if (!postData) {
        const error = new Error('Could not find post!');
        error.statusCode = 404;
        throw error;
      }
      if (imageUrl !== postData.imageUrl) {
        FileHelper.deleteFile(postData.imageUrl);
      }
      const post = postData;
      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save();
    })
    .then((post) => {
      res.status(200).json({ message: 'Post updated.', post });
    })
    .catch((err) => {
      const error = err;
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      return next(error);
    });
};

exports.deletePost = (req, res, next) => {
  const { postId } = req.params;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error('Could not find post!');
        error.statusCode = 404;
        throw error;
      }
      FileHelper.deleteFile(post.imageUrl);
      return Post.findByIdAndDelete(postId);
    })
    .then(() => {
      res.status(200).json({ message: 'Post deleted.' });
    })
    .catch((err) => {
      const error = err;
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      return next(error);
    });
};
