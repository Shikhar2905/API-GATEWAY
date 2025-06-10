// *** Ignore this File ***
// MicroserviceA.js - copy
// Contains previous code which was tested - 

// const express = require('express');
// const { raw } = require('body-parser');
// var proxy = require('express-http-proxy');
// // const { createProxyMiddleware } = require('http-proxy-middleware');

// const app = express();
// const PORT = 3000;


// app.use(raw({ type: '*/*' }));          // Using "raw",data is sent a Buffer
// app.use(express.json())              // parse as json



// // Proxy setup - 1
// app.use(
//   '*',(req,res)=>{ console.log(req.body);
// res.send(req.body)
//   })


// Proxy setup - 2
// app.use(
//   '*',
//   createProxyMiddleware({
//     target: 'http://localhost:7000',
//     changeOrigin: true,
//     selfHandleResponse: false,
//     onProxyReq: (proxyReq, req, res) => {
//       // let bodyData;
     
//       // if (req.body && req.body.length > 0) {
//       //   // Client sent a body – forward it as-is
//       //   bodyData = req.body;
//       //   proxyReq.setHeader('Content-Type', req.headers['content-type'] || 'application/octet-stream');
//       //   proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
//       //   proxyReq.write(bodyData);
//       // } else {
//       //   // Inject your custom JSON body if none was sent
//       //   const injectedData = JSON.stringify({
//       //     injected: true,
//       //     message: "This body was added by Microservice A"
//       //   });

//         proxyReq.setHeader('Content-Type', 'application/json');
//         // proxyReq.setHeader('Content-Length', Buffer.byteLength(injectedData));
//         // proxyReq.write(injectedData);
//       }
//     }
//   )
// );



// Proxy setup - 3

// // Forward all requests to Microservice B
// app.use(proxy('http://localhost:7000', {
 
//   // // This tells the proxy what path to forward the request to on the target server.
//   // proxyReqPathResolver: req => req.originalUrl,

//   // // Customize or modify the HTTP request options (headers, method, etc.) before the request is sent to Microservice B.
//   // proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
//   //   // Set headers explicitly if needed
//   //   proxyReqOpts.headers['Content-Type'] = srcReq.headers['content-type'] || 'application/json';
//   //   return proxyReqOpts;
//   // },

//   // Lets you intercept and modify the body that will be sent to Microservice B.
//   proxyReqBodyDecorator: (bodyContent, srcReq) => {
//     // Forward JSON body
//     console.log('Headers : ', srcReq.headers),
//     console.log('Query params : ', srcReq.query);
//     console.log('Data received in server A : ', bodyContent);
//     console.log('Type of body: ', typeof bodyContent)

//     return bodyContent;
//   }

// }));



//Route B: Forward to B 

// app.use('/B', proxy('http://localhost:7000', {
//   // proxyReqPathResolver: req => {
//   //   // This removes '/B' from path, so /B/abc → /abc
//   //   const newPath = req.originalUrl.replace(/^\/B/, '');
//   //   return newPath;
//   // },
 
//   proxyReqBodyDecorator: (bodyContent, srcReq) => {
//     console.log('Forwarding to B → Body:', bodyContent);
//     return bodyContent;
//   }
// }));


//Route: C → Forwards to Microservice C (port 7001)

// app.use('/C', proxy('http://localhost:7001', {
//   // proxyReqPathResolver: req => {
//   //   // Remove '/C' from path
//   //   const newPath = req.originalUrl.replace(/^\/C/, '');
//   //   return newPath;
//   // },
  
//   proxyReqBodyDecorator: (bodyContent, srcReq) => {
//     console.log('Forwarding to C → Body:', bodyContent);
//     return bodyContent;
//   }
// }));




// app.use('*', 
//   (req, res) => {
//     // Decide the target dynamically based on the request URL
//     let target;

//     if (req.originalUrl.startsWith('/B')) target = 'http://localhost:7000';
//     else if (req.originalUrl.startsWith('/C')) target = 'http://localhost:7001';
//     else return res.status(404).send('Invalid route');
  

//     return proxy(target, {
//       proxyReqBodyDecorator: (bodyContent, srcReq) => {
//         console.log('Forwarding Body:', bodyContent);
//         console.log('Type:', typeof bodyContent);
//         return bodyContent;
//       }
//     }
//   )(req, res); // <-- Important: return the middleware result
// });


// app.listen(PORT, () => {
//   console.log(`Microservice A running at http://localhost:${PORT}`);
// });






/* Before integrting db */

// Microservice A

const express = require('express');
const { raw } = require('body-parser');
var proxy = require('express-http-proxy');
const rateLimit = require('express-rate-limit'); 
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;


// Apply rate limiting to all requests
const limiter = rateLimit({                                           
  windowMs: 1 * 60 * 1000,                                            // 1 minute window
  max: 10,                                                            // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);                                                     // APPLY RATE LIMITER


// Logging setup
const accessLogStream = fs.createWriteStream(                         // 1. Create a write stream for access logs
  path.join(__dirname, 'access.log'),                                 // Log file in the same directory
  { flags: 'a' }                                                      // 'a' means append mode
);

app.use(morgan('combined', { stream: accessLogStream }));             // 2. Use morgan to log standard request details

app.use((req, res, next) => {                                         // 3. Custom logger for audit
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});



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











// middleware => req, res, next
// body-parser
// raw