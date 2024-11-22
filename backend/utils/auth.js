const requireAuth = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }
    next(); // Continue to the route handler
  };
  
module.exports = requireAuth;