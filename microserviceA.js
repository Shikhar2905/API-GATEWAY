const express = require('express');
const proxy = require('express-http-proxy');
const rateLimit = require('express-rate-limit');
// const { raw } = require('body-parser');
const bodyParser = require('body-parser');

const connectDB = require('./dbConfig');
const serviceconfigs = require('./models/ServiceConfig');
const configRoutes = require('./routes/configRoutes');

const app = express();
const PORT = 3000;

// app.use(raw({ type: '*/*' }));
app.use(express.json());


// Connect to DB and load config
connectDB().then(async () => {
  const server_configuration = await serviceconfigs.find();
  
  if (!server_configuration.length) {
    console.log("No service configs found in DB");
    return;
  }

  // For each route config from DB
  server_configuration.forEach(config => {
    const { prefix, target, windowMs, maxRequests } = config;

    console.log(target);
    
    const limiter = rateLimit({                 // Add rate limiter
      windowMs,
      max: maxRequests,
      message: 'Too many requests',
    });

    // Route with rate limiting and proxying
    app.use(prefix, bodyParser.raw({ type : '*/'}) , limiter, proxy(target));

  });
});

app.use('/server_configuration', configRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Gateway running at http://localhost:${PORT}`);
});
