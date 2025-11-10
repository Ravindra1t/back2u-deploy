const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

module.exports = async function (req, res, next) {
  // Get token from header
  const authHeader = req.header("Authorization");

  // Check if not token
  if (!authHeader) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  // Check if token starts with 'Bearer '
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token format is invalid" });
  }

  // Get the token part
  const token = authHeader.split(" ")[1];

  // Verify token
  try {
    let decoded;
    if (token === 'admin-local') {
      // Dev shortcut: treat as admin user
      decoded = { user: { id: 'admin-local', name: 'Admin', email: 'admin1234@amrita.edu', role: 'admin' }, iat: Math.floor(Date.now()/1000) };
    } else {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    }

    // Check if password has been changed after this token was issued
    // Only if not the dev admin-local
    if (decoded.user.id !== 'admin-local') {
      const User = require('../models/User');
      const dbUser = await User.findById(decoded.user.id).select('passwordChangedAt role name email');
      if (!dbUser) return res.status(401).json({ message: 'User not found' });
      if (dbUser.passwordChangedAt) {
        const tokenIssuedAtMs = (decoded.iat || 0) * 1000;
        if (tokenIssuedAtMs < dbUser.passwordChangedAt.getTime()) {
          return res.status(401).json({ message: 'Session expired. Please log in again.' });
        }
      }
      // Sync role/name/email from DB in case they changed
      req.user = { id: decoded.user.id, role: dbUser.role, name: dbUser.name, email: dbUser.email };
    } else {
      req.user = decoded.user;
    }

    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};