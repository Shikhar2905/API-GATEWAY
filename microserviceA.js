// Microservice A

const express = require('express');
const { raw } = require('body-parser');
var proxy = require('express-http-proxy');
const rateLimit = require('express-rate-limit'); 
const app = express();
const PORT = 3000;


const limiter = rateLimit({                                           // Apply rate limiting to all requests
  windowMs: 1 * 60 * 1000,                                            // 1 minute window
  max: 10,                                                            // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);                                                     // APPLY RATE LIMITER


// Middleware to parse the incoming request body as raw Buffer.
// This is useful when forwarding data without modifying it
app.use(raw({ type: '*/*' }));          

// app.use(express.json())                                            // To parse as json


const routeMap = new Map([                                            // Map of route prefixes to their target URLs
  ['/B', 'http://localhost:7000'],
  ['/C', 'http://localhost:7001']
]);


app.use('*',                                                          // Route to intercept all incoming requests
  (req, res) => {

    // Decide the target dynamically based on the request URL
    const routePrefix = Array.from(routeMap.keys()).find(             // Find the prefix in the URL that matches a key in the map
      prefix => req.originalUrl.startsWith(prefix));

    if(!routePrefix) return res.status(404).send('Invalid Route');

    
    const target = routeMap.get(routePrefix);
    return proxy(target, {                                             // Proxy the request to the target microservice

      // To inspect or modify the body before sending it to the target (Optional)
      proxyReqBodyDecorator: (bodyContent, srcReq) => {
        console.log('Forwarding Body:', bodyContent);
        console.log('Type:', typeof bodyContent);
        return bodyContent;
      }
    }
  )(req, res);                                                          // return the middleware result
});

// Start the server and listen on the defined port
app.listen(PORT, () => {
  console.log(`Microservice A running at http://localhost:${PORT}`);
});