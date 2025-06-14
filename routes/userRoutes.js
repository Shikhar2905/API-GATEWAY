const express = require('express');
const bcrypt = require('bcrypt');                                        // For securely hashing passwords
const jwt = require('jsonwebtoken');                                     // For generating and verifying JWT tokens
const pool = require('../dbConfig');                                     // MySQL connection pool
const router = express.Router();
const JWT_SECRET = 'your_jwt_secret';


// User Signup Route
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);                             // Hash the user's password using bcrypt
    await pool.query('INSERT INTO users (username, password) VALUES (?, ?)',            // Save the new user to the database
        [username, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully' });                  // Respond with success
  } catch (err) {
    res.status(500).json({ error: 'Signup failed', details: err.message });
  }
});


// User Login Route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);      // Look up user by username
    const user = rows[0];

    if (!user) return res.status(404).json({ error: 'User not found' });                // If user doesn't exist, return error

    const match = await bcrypt.compare(password, user.password);                        // Match Password
    if (!match) return res.status(401).json({ error: 'Incorrect password' });

    const token = jwt.sign(                                                             // Create a JWT token with user data
      { id: user.id, username: user.username },                                         // payload
      JWT_SECRET,                                                                       // secret key
      { expiresIn: '1h' }                                                               // token validity
    );

   
    res.json({ message: 'Login successful', token });                                   // Return token to client
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// Export the router so it can be used in other files
module.exports = router;