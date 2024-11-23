const jwt = require('jsonwebtoken');
const { User } = require('../db/models');

const restoreUser = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    req.user = null;
    return next();
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify your app's JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(payload.id); // Find user in the database
    if (!user) {
      req.user = null;
      return next();
    }

    req.user = user; // Attach user to request
    next();
  } catch (err) {
    console.error('Error verifying token:', err);
    req.user = null;
    next();
  }
};

module.exports = restoreUser;
