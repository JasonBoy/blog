---
title: React Server Side Rendering with Koa
date: "2018-05-18"
description: "use React Server Side Rendering with Koa App"
tags: ["node", "react", "koa", "ssr"]
---

⚛️React has been one of the most famous UI libraries in the community, whose component based development flow really improves the dev experiences, it splits a large application into small pieces, which makes your code much more reusable and better maintainability, and much more other goodies...  

[中文](/posts-zh_cn/react-server-side-rendering-with-koa-zh_cn/), [中文-掘金](https://juejin.im/post/5b0269c2518825428b3916f9)

*Check out the [React Server Side Rendering with Koa Part II](/react-server-side-rendering-with-koa-part-2/) for loadable-components usage and React Stream API usage.*

With React, we usually will build a Single Page Application(SPA), which has a really better user experience on the client side than a traditional website, the browser will get an empty body with the html, and after all the javascript bundles have been loaded and executed, the page starts to show up, during which, users have nothing to do but wait, in a high speed network, that may not be a big problem, but often case is that people are in a normal or worse network, or with low spec devices, which may cause a lot of time to download assets and execute your js code, which in the end has a really bad experience for your end users. And one way to solve this is to use React Server Side Rendering(SSR) to render your components on your server, and send the rendered html to the browser directly, then the browser can render the page as soon as they receiving the html content, which is usually know as the above the fold rendering, now the user can see the page(content) much earlier instead of waiting all the javascript to be loaded(which also improves SEO since search engines usually won't execute js), while the users can now start viewing the page, the browser on the other hand start to download the rest javascript, and then add all the functionality(interactivity) to the page as a normal SPA will do before users can see content.

So after we understand why SSR is necessary in a modern web application, we can start to do some practices in a react app, also, since we are already living on an async/await world, we will use [koa2](http://koajs.com/) as a web framework on the server side in the following demo.

### Initialize the App as a normal SPA

So first of all, let us forget the SSR stuff, but build a simple SPA-only app with React and React-Router, then we will add the SSR functionality to maximize your app performance.

A simple root `App.js`:
```jsx
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';

const Home = () => <div>Home</div>;
const Hello = () => <div>Hello</div>;

const App = () => {
  return (
    <Router>
      <Route exact path="/" component={Home} />
      <Route exact path="/hello" component={Hello} />
    </Router>
  )
}

ReactDOM.render(<App/>, document.getElementById('app'))
```
Here we have two dame simple components for two routes, `/` and `/hello`, which just render some text into the page. But as a SPA, our final bundle may increase much larger than we expect as we add more functionality every day, which may bloat in the end. So with this problem, we will first try to split your large bundle into small pieces based on your route, and luckily with [webpack dynamic import](https://webpack.js.org/guides/code-splitting/#dynamic-imports) and [react-loadable](https://github.com/jamiebuilds/react-loadable), we can achieve this much simpler then we think.

### Code Splitting with React-Loadable

Before use, install `react-loadable` to your project:

```bash
npm install react-loadable
# or
yarn add react-loadable
```
Then in your javascript:

```jsx
//...
import Loadable from 'react-loadable';
//...

const AsyncHello = Loadable({
  loading: <div>loading...</div>,
  //extract your Hello component into separate file
  //use webpack's dynamic import
  loader: () => import('./Hello'), 
})

//and in your router:
<Route exact path="/hello" component={AsyncHello} />
```
Simple! right? You only need to import `react-loadable`, and pass your options to `Loadable`, the `loading` option will be rendered while the `Hello` component is loading.

Now when you go to home page, only the code in `Home` component will be loaded, , and then you click a link to hello page, it will render the `loading` component while downloading bundle for `Hello` component, after loaded, `Hello` component will be rendered replacing the `loading` component. By code-splitting your bundles into route based pieces, your SPA has already been optimized a lot, cheers🍻. The even cooler thing is that `react-loadable` also supports SSR, so you can use it anywhere in your app seamlessly both on client and server sides, you only need to do some simple setup on the server side for `react-loadable` to be functional, I will cover this later in the post.

And we are done building a simple react SPA, and it's already good with code-splitting applied, but we can still improve performance on the server side for faster page content rendering in the browser.

### Add SSR Functionality

Since we are on the server side, we will first setup a simple koa web server:

```bash
npm install koa koa-router
```
And in your server entry app.js:
```javascript
const Koa = require('koa');
const Router = require('koa-router');

const app = new Koa();
const router = new Router();
router.get('*', async (ctx) => {
  ctx.body = `
     <!DOCTYPE html>
       <html lang="en">
       <head>
         <meta charset="UTF-8">
         <title>React SSR</title>
       </head>
       <body>
         <div id="app"></div>
         <script type="text/javascript" src="/bundle.js"></script>
       </body>
     </html>
   `;
});

app.use(router.routes());
app.listen(3000, '0.0.0.0');
```
The `*` pattern will match all the page url, and return the empty html, with the bundle script at the bottom, you can also use some server side template engine(e.g [nunjucks](https://github.com/mozilla/nunjucks)) to render the html, with `html-webpack-plugin` to insert the bundles automatically during building phase.

With the koa server ready, we can start to write an entry file `AppSSR.js` for server side, here we will use `StaticRouter` instead of `BrowserRouter`, because on server side, the route is static, and it won't work if you use BrowserRouter, also we will setup `react-loadable` for server side.

**_TIP: you can also write all your server side code in ES6/JSX style, instead of commonjs style, but you will need to transpile the whole server side code into commonjs to make it work on node runtime, but here we extract the React SSR code into separate bundle, and the normal server side `app.js` will require the transpiled bundle_**

OK, now in your `AppSRR.js`:

```jsx
import React from 'react';
//use the static router
import { StaticRouter } from 'react-router-dom';
import ReactDOMServer from 'react-dom/server';
import Loadable from 'react-loadable';
//something to make react-loadable work on SSR
import { getBundles } from 'react-loadable/webpack';
import stats from '../build/react-loadable.json';

//Extracted react router config, for use on both client and server side, 
//Trust me, we will come to this later
import AppRoutes from 'src/AppRoutes';

//create a simple ssr class to be exposed to other server side code, 
//especially in the koa route
class SSR {
  //called in outside route
  render(url, data) {
    let modules = [];
    const context = {};
    const html = ReactDOMServer.renderToString(
      <Loadable.Capture report={moduleName => modules.push(moduleName)}>
        <StaticRouter location={url} context={context}>
          <AppRoutes initialData={data} />
        </StaticRouter>
      </Loadable.Capture>
    );
    let bundles = getBundles(stats, modules);
    return {
      html,
      scripts: this.generateBundleScripts(bundles),
    };
  }

  generateBundleScripts(bundles) {
    return bundles.filter(bundle => bundle.file.endsWith('.js')).map(bundle => {
      return `<script type="text/javascript" src="${bundle.file}"></script>\n`;
    });
  }

  static preloadAll() {
    return Loadable.preloadAll();
  }
}

export default SSR;

```
When you build this with webpack, try to set `target: "node"`, and `externals`, also don't forget to add the loadable plugin into your app webpack config before you run the `webpack.ssr.js`:
```javascript
//webpack.config.dev.js, app bundle
const ReactLoadablePlugin = require('react-loadable/webpack')
  .ReactLoadablePlugin;

module.exports = {
  //...
  plugins: [
    //...
    new ReactLoadablePlugin({ filename: './build/react-loadable.json', }),
  ]
}
```
Also add babel plugin to `.babelrc`:
```json
{
  "plugins": [
      "syntax-dynamic-import",
      "react-loadable/babel",
      ["import-inspector", {
        "serverSideRequirePath": true
      }]
    ]
}
```
The above config will let react-loadable know which components have been rendered on server side, and then rehydrate on client side. And below comes the ssr config bundle:

```javascript
//webpack.ssr.js
const nodeExternals = require('webpack-node-externals');

module.exports = {
  //...
  target: 'node',
  output: {
    path: 'build/node',
    filename: 'ssr.js',
    libraryExport: 'default',
    libraryTarget: 'commonjs2',
  },
  //exclude bundle libs in node_modules
  externals: [nodeExternals()],
  //...
}
```
And in your `app.js`, require it and use the ssr functionality:
```javascript
//...koa stuff
const SSR = require('./build/node/ssr');
//preload all components on server side
SSR.preloadAll();

const s = new SSR();

router.get('*', async (ctx) => {
  const rendered = s.render(ctx.url);
  
  const html = `
    <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div id="app">${rendered.html}</div>
        <script type="text/javascript" src="/runtime.js"></script>
        ${rendered.scripts.join()}
        <script type="text/javascript" src="/app.js"></script>
      </body>
    </html>
  `
});
//...
```
And it's a very simple react ssr stuff, to let `react-loadable` client know which component has been rendered on server side, add get those bundles from `SSR#generateBundleScripts()` function, and loop them and insert them into script tags, after the webpack `runtime` bundle(use `CommonsChunkPlugin` to extract), but before your client app bundle, for more `react-loadable` SSR support, check out the [doc](https://github.com/jamiebuilds/react-loadable#------------server-side-rendering).

In the above example, we extract the react routes config into separate component to make it work on both client and server side, `AppRoutes`:

```jsx
//AppRoutes.js
import Loadable from 'react-loadable';
//...

const AsyncHello = Loadable({
  loading: <div>loading...</div>,
  //extract your Hello component into separate file
  //use webpack's dynamic import
  loader: () => import('./Hello'), 
})

function AppRoutes(props) {
  <Switch>
    <Route exact path="/hello" component={AsyncHello} />
    <Route path="/" component={Home} />
  </Switch>  
}

export default AppRoutes

//and in /App.js
import AppRoutes from './AppRoutes';
// ...
export default () => {
  return (
    <Router>
      <AppRoutes/>
    </Router>
  )
}
```

### Initial state on Server Side

Up until now, we have a simple React App with benefits of both SPA and SSR, but we have one more thing to do, since most of the time, we have the data or state from some remote api, before we can render the react component, we need to get some init data from other api, then we provide the data into the component to render on SSR, also we need to grab that on the client side to prevent re-fetching the api.

Still in your server `app.js`:
```javascript
//...
const fetch = require('isomorphic-fetch');

router.get('*', async (ctx) => {
  //fetch branch info from github
  const api = 'https://api.github.com/repos/jasonboy/wechat-jssdk/branches';
  const data = await fetch(api).then(res => res.json());
  
  const rendered = s.render(ctx.url, data);
  
  const html = `
    <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div id="app">${rendered.html}</div>
        
        <script type="text/javascript">window.__INITIAL_DATA__ = ${JSON.stringify(data)}</script>
        
        <script type="text/javascript" src="/runtime.js"></script>
        ${rendered.scripts.join()}
        <script type="text/javascript" src="/app.js"></script>
      </body>
    </html>
  `
});
```
And in your `Hello` component, you need to check if the initial data is provided, if `window.__INITIAL_DATA__` is not empty, just use it, otherwise fetch it on `componentDidMount` life cycle:

```jsx
export default class Hello extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      github: window.__INITIAL_DATA__ || [],
    };
  }
  
  componentDidMount() {
    if (this.state.github.length <= 0) {
      fetch('https://api.github.com/repos/jasonboy/wechat-jssdk/branches')
        .then(res => res.json())
        .then(data => {
          this.setState({ github: data });
        });
    }
  }
  
  render() {
    return (
      <div>
        <ul>
          {this.state.github.map(b => {
            return <li key={b.name}>{b.name}</li>;
          })}
        </ul>
      </div>
    );
  }
}
```
Now that if it's rendered by server side, just grab all the stuff, html and data, otherwise fetch on the client side just like a normal SPA.

### 🎉React-v16 updates

In the latest React16, the SSR API has been optimized, it also provides streaming api to even improve the performance, with which the server can send rendered html chunk by chunk to browser, also in the client side, you need to use `ReactDOM.hydrate()` when render the app. For more details, check out the [whats-new-with-server-side-rendering-in-react-16](https://hackernoon.com/whats-new-with-server-side-rendering-in-react-16-9b0d78585d67).

💖*Want to see the full demo above, check out the [koa-web-kit](https://github.com/JasonBoy/koa-web-kit), and enjoy the SSR bonus for your application*😀

### Conclusion

And that's a simple practice with React SSR, with which we can push our app for even better performance, also provides better SEO, best of the both worlds🍺.

*If you have some issue, [let me know](https://github.com/JasonBoy/blog/issues/new)*
