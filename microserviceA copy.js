// *** Ignore this File ***
// MicroserviceA.js - copy
// Contains previous code which was tested - 

const express = require('express');
const { raw } = require('body-parser');
var proxy = require('express-http-proxy');
// const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;


app.use(raw({ type: '*/*' }));          // Using "raw",data is sent a Buffer
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




app.use('*', 
  (req, res) => {
    // Decide the target dynamically based on the request URL
    let target;

    if (req.originalUrl.startsWith('/B')) target = 'http://localhost:7000';
    else if (req.originalUrl.startsWith('/C')) target = 'http://localhost:7001';
    else return res.status(404).send('Invalid route');
  

    return proxy(target, {
      proxyReqBodyDecorator: (bodyContent, srcReq) => {
        console.log('Forwarding Body:', bodyContent);
        console.log('Type:', typeof bodyContent);
        return bodyContent;
      }
    }
  )(req, res); // <-- Important: return the middleware result
});


app.listen(PORT, () => {
  console.log(`Microservice A running at http://localhost:${PORT}`);
});



// middleware => req, res, next
// body-parser
// raw