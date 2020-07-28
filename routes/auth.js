const { Router } = require('express');
const { body } = require('express-validator/check');

const isAuth = require('../middleware/is-auth');
const authController = require('../controllers/auth');
const User = require('../models/user');

const router = Router();

router.post('/signup', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .custom((value) => User.findOne({ email: value })
      .then((userDoc) => {
        if (userDoc) {
          return Promise.reject(new Error('E-mail address already exists'));
        }
        return Promise.resolve();
      })),
  body('password').trim().isLength({ min: 5 }),
  body('name').trim().not().isEmpty(),
], authController.signup);

router.post('/login', authController.login);
router.get('/status', isAuth, authController.getUserStatus);
router.put('/status', [
  body('status').trim().not().isEmpty(),
], isAuth, authController.updateUserStatus);

module.exports = router;
