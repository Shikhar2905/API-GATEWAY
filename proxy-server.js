const express = require('express');
const proxy = require('express-http-proxy');           // For forwarding requests to microservices
const rateLimit = require('express-rate-limit');       // Rate limiting middleware
const bodyParser = require('body-parser');             // To handle raw request bodies
const pool = require('./dbConfig');                    // MySQL DB connection pool
const redisClient = require('./redisClient');          // Redis client
const configRoutes = require('./routes/configRoutes'); // Routes to manage service configurations
const userRoutes = require('./routes/userRoutes');     // Routes for user signup/login
const jwtAuth = require('./middleware/auth');          // JWT middleware for end-user auth

const app = express();
const PORT = 3000;

app.use(express.json());                                // Middleware to parse JSON bodies


// Route for user authentication (signup/login)
app.use('/auth', userRoutes);


// Dynamically setup routing for services
(async () => {
  
  const [configs] = await pool.query('SELECT * FROM serviceconfigs');         // Load all service configurations from DB

  if (!configs.length) {                                                      // When no services are found
    console.log("No service configs found in DB");
    return;
  }

  configs.forEach(config => {                                                 // For each service config, create a proxy route
    const { prefix, target, windowMS, maxRequests } = config;

    const limiter = rateLimit({                                             // Set up rate limiter
      windowMs: windowMS,                                                   // Time window in ms
      max: maxRequests,                                                     // Max requests per window
      message: 'Too many requests'                                          // Response on limit breach
    });

    // Register route:
    app.use(
      prefix,                                       // Route prefix e.g., "/serviceA"
      bodyParser.raw({ type: '*/*' }),              // Ensure raw body is forwarded
      jwtAuth,                                      // Only authenticated users can access
      limiter,                                      // Rate Limit
      proxy(target)                                 // Forward to actual microservice
    );
  });

  // Route to access and manage service configuration
  app.use('/server_configuration', configRoutes);
})();


app.listen(PORT, () => {
  console.log(`API Gateway running at http://localhost:${PORT}`);
});