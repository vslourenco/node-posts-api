const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');

const FileHelper = require('../util/file');

module.exports = {
  async createUser({ userInput }, req) {
    const { email, name, password } = userInput;
    const errors = [];

    if (!validator.isEmail(email)) {
      errors.push({ message: 'E-mail is invalid' });
    }

    if (validator.isEmpty(password) || !validator.isLength(password, { min: 5 })) {
      errors.push({ message: 'Password too short!' });
    }

    if (errors.length > 0) {
      const error = new Error('Invalid input!');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      const error = new Error('User exists already!');
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ email, password: hashedPassword, name });
    const createdUser = await user.save();

    // eslint-disable-next-line no-underscore-dangle
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
  async login({ email, password }, req) {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('Invalid email or password!');
      error.code = 401;
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
    return { token, userId: user._id.toString() };
  },
  async createPost({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }

    const { title, content, imageUrl } = postInput;
    const errors = [];

    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
      errors.push({ message: 'Title is invalid!' });
    }

    if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
      errors.push({ message: 'Content is invalid!' });
    }

    if (errors.length > 0) {
      const error = new Error('Invalid input!');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('Invalid User!');
      error.code = 401;
      throw error;
    }

    const post = new Post({
      title,
      content,
      imageUrl,
      creator: user,
    });
    const createdPost = await post.save();

    user.posts.push(createdPost);
    await user.save();

    return {
      // eslint-disable-next-line no-underscore-dangle
      ...createdPost._doc,
      // eslint-disable-next-line no-underscore-dangle
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
  async posts({ page }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    const currentPage = page || 1;
    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate('creator')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    return {
      posts: posts.map((p) => ({
        // eslint-disable-next-line no-underscore-dangle
        ...p._doc,
        // eslint-disable-next-line no-underscore-dangle
        _id: p._id.toString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      totalPosts,
    };
  },
  async post({ id }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id).populate('creator');

    if (!post) {
      const error = new Error('No post found!');
      error.code = 404;
      throw error;
    }

    return {
      // eslint-disable-next-line no-underscore-dangle
      ...post._doc,
      // eslint-disable-next-line no-underscore-dangle
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),

    };
  },
  async updatePost({ id, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id).populate('creator');

    if (!post) {
      const error = new Error('No post found!');
      error.code = 404;
      throw error;
    }

    // eslint-disable-next-line no-underscore-dangle
    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error('Not authenticated!');
      error.code = 403;
      throw error;
    }

    const { title, content, imageUrl } = postInput;
    const errors = [];

    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
      errors.push({ message: 'Title is invalid!' });
    }

    if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
      errors.push({ message: 'Content is invalid!' });
    }

    if (errors.length > 0) {
      const error = new Error('Invalid input!');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    post.title = title;
    post.content = content;
    if (imageUrl !== 'undefined') {
      post.imageUrl = imageUrl;
    }
    const updatedPost = await post.save();

    return {
      // eslint-disable-next-line no-underscore-dangle
      ...updatedPost._doc,
      // eslint-disable-next-line no-underscore-dangle
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),

    };
  },
  async deletePost({ id }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id);

    if (!post) {
      const error = new Error('No post found!');
      error.code = 404;
      throw error;
    }

    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error('Not authenticated!');
      error.code = 403;
      throw error;
    }

    FileHelper.deleteFile(post.imageUrl);
    await Post.findByIdAndDelete(id);
    const user = await User.findById(req.userId);
    user.posts.pull(id);
    await user.save();

    return true;
  },
  async user(args, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error('No user found!');
      error.code = 404;
      throw error;
    }

    // eslint-disable-next-line no-underscore-dangle
    return { ...user._doc, _id: user._id.toString() };
  },
  async updateStatus({ status }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error('No user found!');
      error.code = 404;
      throw error;
    }

    user.status = status;
    await user.save();

    // eslint-disable-next-line no-underscore-dangle
    return { ...user._doc, _id: user._id.toString() };
  },

};
