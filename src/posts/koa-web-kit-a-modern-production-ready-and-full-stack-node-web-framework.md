---
title: 🚀A Modern, Production-Ready, and Full-Stack Node Web Framework
date: "2017-12-19"
---

There are lots of starter kit or boilerplate projects out there, most of which are focusing just on front-end development, like the simple yet powerful [create-react-app](https://github.com/facebookincubator/create-react-app), but as a full stack developer like myself, a static site focused boilerplate is not enough for building complex web applications both for front-end and back-end. So here I will introduce yet another Node.JS full stack framework [koa-web-kit](https://github.com/JasonBoy/koa-web-kit), which may not suit for everyone, but at least you have one more choice at your disposal, right?🤣 which is also great.

#Highlighted Features
- ✨Built with all modern frameworks and libs, including Koa2, React-v16, Bootstrap-v4(CSS only), Webpack, ES6, Babel...
- 📦Get all the Node.JS full stack development experience out of the box
- 🔥Hot Module Replacement support without refreshing whole page, and bundle size analyzer support
- 📉Async/Await support for writing neat async code
- 💖SASS preprocessor, PostCSS, autoprefixer for better css compatibility
- 🎉Simple API Proxy bundled, no complex extra nginx configuration
- 🌈Available for generating static react site, React SSR(WIP)
- ⚡️Just one npm command to deploy your app to production
- 👷Continuously Maintaining🍻

## Server Side
The framework's server side is built on [koajs](https://github.com/koajs/koa), a next generation web framework for node.js, created by the forks also invented the famous [expressjs](https://expressjs.com/) MVC framework. Koa supports the latest async/await syntax so that you can have a better experience writing async code in a sync coding style, which is awesome😎. Also it has a better and more semantic middleware mechanism, with which you can add lots of small middlewares focusing on single functionality to make your application richer and more robust, instead of pre-bundling lots of middlewares ahead, which makes koa much more ligthweight. 

Every modern web application may have an API layer which may write in other languages(e.g java, go...), which may also served on a different api endpoint, in which case we may need to configure a reverse proxy service to proxy our fetch requests to the api endpoint to workaround the CORS issue restricted by the browser. That could make your dev env setup process much more complex and time wasting, so with the help of [koa-web-kit](https://github.com/JasonBoy/koa-web-kit), a pre-bundled API Proxy may save you a lot of time by setting up your dev environment, you just need to configure a custom url prefix mapping to the real api endpoint, and it's done, all the requests in your browser will be delegated to the real api endpoint, what makes it even better is that you can not only configure just one endpoint(since your apis may live on different endpoints), but as many as you like, like the configuration below: 
```javascript
config = {
  //...other configs
  "API_ENDPOINTS": {
    //e.g http://127.0.0.1:3000/prefix/api/login -->proxy to--> http://127.0.0.1:3001/api/login
    "/prefix": "http://127.0.0.1:3001",
    "/prefix2": "http://127.0.0.1:3002",
  }
}
```
Simple right? You don't need to setup another nginx server on your local development env, just type some configurations, and there you go. 
> *As in production env, it may be better to use a reverse proxy to proxy the apis directly to backend, instead of sending all requests to node, which may blow up your node server.*

And also a log layer is necessary for every server side application, `koa-web-kit` also provides a default simple logger utility, powered by the amazing async logging library [winston](https://github.com/winstonjs/winston), e.g:
```javascript
const logger = require('./mw/logger');
logger.info(msg);
logger.warn(msg);
logger.error(msg);
```
You can add custom transports to winston to add more specific loggers, all the logs are kept in `./logs` dir by default.

Usually we will minify all the static assets(css, js, html...) for browsers to speed up your page loading, but people rarely think about minifying their node.js side code, which can also make your node.js code less readable, less packed size, and do some pre-optimization by the tools. With `koa-web-kit`, we also provide a webpack build script to minify your nodejs code, cheers🍻.

In case you have dynamic template rendering, instead of just plain html with all content rendered by the React/Vue like libraries, we also got your back, `nunjucks` template engine is bundled by default, but you can use any other javascript template engine you'd like, which is powered by [consolidate.js](https://github.com/tj/consolidate.js/). The SSR for React is not included, since it probably may complicate your code base, and couple of more considerations you need to be careful when write your Components, but you can still try some SSR frameworks like [next.js](https://github.com/zeit/next.js/) to meet your own needs.

A so called full stack framework should also include a DB layer, right? Yes, exactly, but to make `koa-web-kit` not so opinionated on the perspective of database, and since modern development is all about modularity, you can simplely `npm install` any db layer, or db ORM packages suit for your choice of database, another condition is that not all node.js apps have to develop apis or db operations on their own, since it may already being developing by other teams, or other backend languages, in which case, you only need to configure to use these apis as mentioned above in the configuration file. and that's why the preconfigured db layer is not included by default to make the framework stay as simple as possible, yet also easy to extend when necessary.

Another cool stuff that I want to share is that `koa-web-kit` has multiple environment variables configuration layers. As we all know, every project needs some envs to indicate that it needs to run differently on different environments, such as in dev env, we will send api requesst to the dev endpoint, and later when deployed to production, it should send requests to the production api endpoint; another use case is that in dev env, we need to log lots of message for better debugging, but we don't need these in production mode, and also we can add different features based on different envs..., there are lots of stuff that we depend on environment variables. So with `koa-web-kit`, you can set envs in different ways:

- config.json/config.json.sample, you can copy the pre-included `config.json.sample` to `config.json`, and set different options inside in your local env.  
- Environment Variables, when you run scripts, you can also set environment variables with the same key, to override the config in `config.json`
- Default config/build.dev(prod).js in source code, this one is used in case you use neither `config.json` nor Environment Variables.

More details check out the [koa-web-kit#ENV_Configuration](https://github.com/JasonBoy/koa-web-kit#environment-variables).

## Front End
And finally we are here, the front-end stuff. `koa-web-kit` uses the latest front-end libraries and tools to help you utlize the best techs in the community.
Featuring:  

- React-v16, one of the most famous libs to build declaritive UIs, with a very active and big community support.
- Bootstrap-v4, most used css/layout framework for building responsive websites, with the latest v4 version, utlizing the cool css flexbox feature.
- Embrace the ES6, with the help of webpack and babel, you can use the latest new javascript features without worrying about backward compatibility, new syntax can be transpiled to ES5 based on your [browerslist](https://github.com/ai/browserslist) config.
- SASS/SCSS preprocessor for your style sheets, with the extra PostCSS to write no vendor prefixed and clear css styles, yet still autoprefixed based on browerslist config while building.

<h2 id="production-deployment" href="production-deployment">Production Deployment</h2>

After you've finished your development for both of your front and back end code, it's time to deploy your app to production so that your users can access it. And yet again, with `koa-web-kit`, the deployment experience is still easy and simple, with just one npm script command with several additional options, then just grab a cup of ☕️ and wait for it to finish. For example:

`npm run deploy`, simplest one  
`npm run deploy -- app2 2`, with name app2, pm2 cluster number: 2,  
for more options and examples, check out [koa-web-kit#Deploy](https://github.com/JasonBoy/koa-web-kit#production-deployment)

<h2 id="generate-static-site" href="generate-static-site">Bonus Round: Generate a Static Site</h2>

Even though `koa-web-kit` is a full stack framework, you can still generate a static site if you don't need any server side stuff without losing all the dev experiences koa-web-kit offers.  
When you want to generate a static site, there is one more thing you may need to put into consideration, the `prefix path` and the `trailing slash` confusion, which is also documented in the famous static site generator [Gatsby](https://www.gatsbyjs.org/docs/path-prefix/). The thing is that when you want to deploy the static site to some 3rd servers, like github pages, or the famous static site service provider like [netlify](https://www.netlify.com), in which cases, your app may be served on a sub directory url(e.g https://user.github.io/app1/), here the `prefix` for your site is `/app1/`, everything should be stay under the sub path `/app1/`, with koa-web-kit, it's also very easy to configure that, for example, just in your `config.json` file:
```javascript
const config = {
  //...
  //your cdn domain for your static assets if you have
  "STATIC_ENDPOINT": "http://cdn.com",
  //additional prefix for your cdn domain
  "STATIC_PREFIX": "/public/",
  //trailing slash for "APP_PREFIX"
  "PREFIX_TRAILING_SLASH": true,
  //here is the prefix path for your app1, 
  //if "PREFIX_TRAILING_SLASH" is true,
  //the final "env.prefix" value(details below) will be "/app1/"
  "APP_PREFIX": "/app1",
  //...
}
```
So how do we access this in a programming level(like in your components), simple, just import that in your js:
```javascript
//full path: "./src/modules/env.js"
import env from 'modules/env';

// -> "/app1/public/" , with extra static assets prefix
console.log(env.prefix); 
// -> "/app1/"
console.log(env.appPrefix); 
```
```html
<!--concat your static url if it does not need a webpack loader-->
<img src={`${env.prefix}static/imgs/no-loader.png`}>
```
The webpack loader will also be prefix aware, so in your source code, just import your assets normally, or use relative bg path in your scss files.
If you want all the static assets have relative path without '/' ahead, just set `PREFIX_TRAILING_SLASH: false`, `STATIC_PREFIX: ""`, `APP_PREFIX: ""`.

<h2 id="conclusion" href="conclusion">Conclusion</h2>

And that's a simple introduction of [koa-web-kit](https://github.com/JasonBoy/koa-web-kit), if you like, go ahead and have a try, feel free to [fire an issue](https://github.com/JasonBoy/koa-web-kit/issues), or a PR to request new features. Hope that will simplify your full stack node.js development experience.

With 💖 by [koa-web-kit](https://github.com/JasonBoy/koa-web-kit).