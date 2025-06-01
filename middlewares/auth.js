// middleware/verifyRole.js
import jwt from "jsonwebtoken";

/**
 * Middleware to verify JWT and check if user's role is allowed.
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 */
const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied. Token missing." });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!allowedRoles.includes(decoded.role)) {
        return res
          .status(403)
          .json({ message: "Access denied. Not authorized." });
      }

      req.user = decoded; // attach decoded token to request
      next();
    } catch (err) {
      res.status(400).json({ message: "Invalid token." });
    }
  };
};

export default verifyRole;
