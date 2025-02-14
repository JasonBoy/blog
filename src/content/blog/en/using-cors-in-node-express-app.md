---
title: Using CORS In Node Express App
description: >-
  using Cross-Origin resource sharing to handle cross domain ajax requests in
  your node express app, by adding Access-Control-Allow-Origin and other
  Access-Control headers
pubDate: '2016-03-08'
heroImage: /blog-placeholder-3.jpg
tags:
  - node
  - express
  - cross-origin
  - ajax
  - cors
---

There are lots of cases when we want to access the data from another domain using ajax, like in `a.com` we want to access the apis deployed in `api.a.com`, since the browser has the same-origin policy, we cannot send the ajax requests to `api.a.com`.

We have some solutions to solve this problem:

- Using `jsonp` to send the requests, which has some other issues like security issue, we can only use the `GET` method,
- Using proxy in server side, like nginx, to delegate the requests to api.a.com, but we can only use a.com in browser side, which is still not so ideal,
- To solve the issues above, we can use [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) as a better solution.

### How it works

Below is the basic cors flow:

![](/src/assets/images/2016/03/cors_flow.png)

The browser will check if the request is a cross origin ajax request, if yes, it will send a preflight request as http method `OPTIONS` to server to get permissions, if the preflight response match the cross origin policies, then the browser will send the actual request to get real data.

There are couple headers you should notice in both request and response in preflight:

1. `Access-Control-Request-Method`: Current request method, if the browser includes this header, the server should return the `Access-Control-Allow-Methods` with the value like `GET,POST` to tell the browser which method is allowed.
2. `Access-Control-Request-Headers`: the server should add the `Access-Control-Allow-Headers` with the value like `Accept, Content-Type` to the response headers to indicate all the headers that are allowed.
3. if the `withCredentials` property of the XMLHttpRequest object is set to `true`, the server should also respond the `Access-Control-Allow-Credentials: true` to the header.
4. And of course `Access-Control-Allow-Origin` is **required** for both the preflight and the actual request, the value could be `Access-Control-Allow-Origin: *`, which indicate that any site can access the data from the server, which is not so safe in real life production, so a better way to do is to set the value dynamically based on the request header `Origin`, and your whitelist to see if the origin is allowed for the request.
5. The problem is that we don't want to send 2 requests every time we make cross origin request, which really costs a lot for the clients, especially for the mobile clients, to solve this, we can add `Access-Control-Max-Age` with the seconds you want the browser to cache the preflight.

After understand the basic of the CORS request, we can add this in our real express server.

### Use CORS in Node Express App

- First you may want to add a middleware to handle all the preflight requests:

```javascript
app.use(function (req, res, next) {
  if ('OPTIONS' === req.method) {
    res.set('Access-Control-Allow-Origin', req.get('Origin'));
    res.set('Access-Control-Allow-Headers', 'Accept, Content-Type');
    //...add more if necessary
    res.end();
    return;
  }
  next();
});
```

- Actual request handler:

```javascript
app.use(function (req, res, next) {
  //'Access-Control-Allow-Origin' is still required in actual response
  res.set('Access-Control-Allow-Origin', req.get('Origin'));
  res.json({});
});
```

Now you can access the apis from other domain without any restrictions, cheers :)

### References

- [MDN CORS reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS)
- [HTML5ROCKS tutorial](http://www.html5rocks.com/en/tutorials/cors/)
