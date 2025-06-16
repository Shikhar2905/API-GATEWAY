const jwt = require('jsonwebtoken');     
require('dotenv').config();                                       // Import the jsonwebtoken package to verify JWT tokens
const JWT_SECRET = process.env.JWT_SECRET;                                           // Secret key used to sign and verify JWT tokens

// Middleware function to authenticate incoming requests
const authenticateUser = (req, res, next) => {
  
  const authHeader = req.headers.authorization;                                 // Get the Authorization header from the request

  if (!authHeader) return res.status(401).json({ error: 'Missing token' });     // If Authorization header is missing, respond with error
 
  const token = authHeader.split(' ')[1];                                       // The format of the header should be "Bearer <token>", so split it and get the token

  try {
    const decoded = jwt.verify(token, JWT_SECRET);                              // Verify the token using the secret key
    req.user = decoded;                                                         // Attach the decoded user data (e.g., userId) to the request object
    next();                                                                     // Proceed to the next middleware
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticateUser;