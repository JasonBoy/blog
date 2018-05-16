---
title: Dispatch API requests with nodejs request module
date: "2016-05-13"
---

There are lots of cool things we can do when we use nodejs as our front-end development tool, request-proxy is one of the daily thing that we messed with, sometimes we may have the cross-origin issue when we send apis, sometimes we need to modify some data before sending requests or modify data after api response, and other freaking issues, but with the help of nodejs, we can solve all the problems above.

Here we will talk about using the [request module](https://github.com/request/request) to dispatch the requests from browser, including modifying the data before dispatching the request, modifying the response before sending back to the browser.

First of all, we need to install the `request` module:
`npm install request --save`  

*We assume you are using `express` as your MVC framework*

### Pipe the original request  

The most common case is that we only need to dispatch the original request from browser to the destination without any modification with the original request, which could be easily solved with the `pipe` method.  
```
var request = require('request');
router.get('/api/user', function(req, res){
  req.pipe(request({
    url: req.url,
    baseUrl: 'http://api.a.com',
    method: req.method,
    json: true
  })).pipe(res);
});
```
For more `request` options, pls refer the [request module](https://github.com/request/request)  
__Important:__ _you should pipe the request without using any middleware to parse the body, if you use like `body-parser` to parse the request body before piping it, the request piping will fail._


This is the simplest way to dispatch the original request to your api server, which will also pipe the data back to the browser without any modification.  
If you want to change the response before sending back to the browser, you can use the callback or the `response` event.
```
request(options, function(err, httpResponse, body){
  if(err) {
    console.error(err);
  }
  res.json(body);
})
```
__*TIP:*__ You can wrap this into a Promise to make it look better, the `bluebird` can `promisifyAll` the `request` module to make its methods all promisify.

### Modify the request body before sending

Another case is that we need to modify the request data, or add other data or headers before sending to the destination, in this case, we may not use the `pipe` anymore, because we need to parse the body first to read the data, and modify the data, which will change the original request object, the solution is that we may need to create the request options and final data manually.

```
var request = require('request');
var bodyParser = require('body-parser');
//parse the body before goto the final handler
router.get('/api/user', bodyParser.urlencoded({extended: false}), function(req, res){
  console.log(req.body);
  var body = req.body;
  body.extra = 'extra info'; //add extra info
  //set the modified form data to request object
  request({form: body, ...other options}, callback).pipe(res);
});
```

Now you can send the modified data to destination.

This is the simple solution to use nodejs as a request proxy. 
Hope this helps with your daily development:)