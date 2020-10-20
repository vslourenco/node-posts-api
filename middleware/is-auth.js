const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    // const error = new Error('Not authenticated.');
    // error.statusCode = 401;
    // throw error;
    req.isAuth = false;
    return next();
  }
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'nodefeedsupersecret');
  } catch (error) {
    // error.statusCode = 500;
    // throw error;
    req.isAuth = false;
    return next();
  }
  if (!decodedToken) {
    // const error = new Error('Not authenticated.');
    // error.statusCode = 401;
    // throw error;
    req.isAuth = false;
    return next();
  }
  req.isAuth = true;
  req.userId = decodedToken.userId;
  return next();
};
