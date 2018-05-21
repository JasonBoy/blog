---
title: React Server Side Rendering with Koa
date: "2018-05-21"
description: "use React Server Side Rendering with Koa App"
tags: ["node", "react", "koa", "ssr"]
---

⚛️React是目前前端社区最流行的UI库之一，它的基于组件化的开发方式极大地提升了前端开发体验，React通过拆分一个大的应用至一个个小的组件，来使得我们的代码更加的可被重用，以及获得更好的可维护性，等等还有其他很多的优点...

通过React, 我们通常会开发一个单页应用（SPA），单页应用在浏览器端会比传统的网页有更好的用户体验，浏览器一般会拿到一个body为空的html，然后加载script指定的js, 当所有js加载完毕后，开始执行js, 最后再渲染到dom中, 在这个过程中，一般用户只能等待，什么都做不了，如果用户在一个高速的网络中，高配置的设备中，以上先要加载所有的js然后再执行的过程可能不是什么大问题，但是有很多情况是我们的网速一般，设备也可能不是最好的，在这种情况下的单页应用可能对用户来说是个很差的用户体验，用户可能还没体验到浏览器端SPA的好处时，就已经离开网站了，这样的话你的网站做的再好也不会有太多的浏览量。

但是我们总不能回到以前的一个页面一个页面的传统开发吧，现代化的UI库都提供了服务端渲染(SSR)的功能，使得我们开发的SPA应用也能完美的运行在服务端，大大加快了首屏渲染的时间，这样的话用户既能更快的看到网页的内容，与此同时，浏览器同时加载需要的js，加载完后把所有的dom事件，及各种交互添加到页面中，最后还是以一个SPA的形式运行，这样的话我们既提升了首屏渲染的时间，又能获得SPA的客户端用户体验，对于SEO也是个必须的功能😀。

OK，我们大致了解了SSR的必要性，下面我们就可以在一个React App中来实现服务端渲染的功能，BTW, 既然我们已经处在一个到处是async/await的环境中，这里的服务端我们使用[koa2](http://koajs.com/)来实现我们的服务端渲染。

### 初始化一个普通的单页应用SPA

首先我们先不管服务端渲染的东西，我们先创建一个基于React和React-Router的SPA，等我们把一个完整的SPA创建好后，再加入SSR的功能来最大化提升app的性能。

首先进入app入口 `App.js`:

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
上面我们为路由`/` 和 `/hello`创建了2个只是渲染一些文字到页面的组件。但当我们的项目变得越来越大，组件越来越多，最终我们打包出来的js可能会变得很大，甚至变得不可控，所以呢我们第一步需要优化的是代码拆分（code-splitting），幸运的是通过[webpack dynamic import](https://webpack.js.org/guides/code-splitting/#dynamic-imports) 和 [react-loadable](https://github.com/jamiebuilds/react-loadable)，我们可以很容易做到这一点。

### 用React-Loadable来时间代码拆分

使用之前，先安装 `react-loadable`:

```bash
npm install react-loadable
# or
yarn add react-loadable
```
然后在你的 javascript中:

```jsx
//...
import Loadable from 'react-loadable';
//...

const AsyncHello = Loadable({
  loading: <div>loading...</div>,
  //把你的Hello组件写到单独的文件中
  //然后使用webpack的 dynamic import
  loader: () => import('./Hello'), 
})

//然后在你的路由中使用loadable包装过的组件:
<Route exact path="/hello" component={AsyncHello} />
```
很简单吧，我们只需要import `react-loadable`， 然后传一些option进去就行了，其中的`loading`选项是当动态加载Hello组件所需的js时，渲染loading组件，给用户一种加载中的感觉，体验也会比什么都不加好。

好了，现在如果我们访问首页的话，只有Home组件依赖的js才会被加载，然后点击某个链接进入hello页面的话，会先渲染loading组件，并同时异步加载hello组件依赖的js，加载完后，替换掉loading来渲染hello组件。通过基于路由拆分代码到不同的代码块，我们的SPA已经有了很大的优化，cheers🍻。更叼的是`react-loadable`同样支持SSR，所以你可以在任意地方使用`react-loadable`，不管是运行在前端还是服务端，要让`react-loadable`在服务端正常运行的话我们需要做一些额外的配置，本文后面会讲到，先不急🏃。‍

到这里我们已经创建好一个基本的React SPA，加上代码拆分，我们的app已经有了不错的性能，但是我们还可以更加极致的优化app的性能，下面我们通过增加SSR的功能来进一步提升加载速度，顺便解决一下SPA中的SEO问题🎉。

### 加入服务端渲染（SSR）功能

首先我们先搭建一个最简单的koa web服务器：

```bash
npm install koa koa-router
```
然后在koa的入口文件`app.js`中:
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
上面`*`路由代表任意的url进来我们都默认渲染这个html，包括html中打包出来的js，你也可以用一些服务端模板引擎(如：[nunjucks](https://github.com/mozilla/nunjucks))来直接渲染html文件，在webpack打包时通过`html-webpack-plugin`来自动插入打包出来的js/css资源路径。

OK, 我们的简易koa server好了，接下来我们开始编写React SSR的入口文件`AppSSR.js`，这里我们需要使用`StaticRouter`来代替之前的`BrowserRouter`，因为在服务端，路由是静态的，用BrowserRouter的话是不起作用的，后面还会做一些配置来使得`react-loadable`运行在服务端。

**_提示: 你可以把整个node端的代码用ES6/JSX风格编写，而不是部分commonjs，部分JSX, 但这样的话你需要用webpack把整个服务端的代码编译成commonjs风格，才能使得它运行在node环境中，这里的话我们把React SSR的代码单独抽出去，然后在普通的node代码里去require它。因为可能在一个现有的项目中，之前都是commonjs的风格，把以前的node代码一次性转成ES6的话成本有点大，但是可以后期一步步的再迁移过去_**

OK, 现在在你的 `AppSRR.js`中:

```jsx
import React from 'react';
//使用静态 static router
import { StaticRouter } from 'react-router-dom';
import ReactDOMServer from 'react-dom/server';
import Loadable from 'react-loadable';
//下面这个是需要让react-loadable在服务端可运行需要的，下面会讲到
import { getBundles } from 'react-loadable/webpack';
import stats from '../build/react-loadable.json';

//这里吧react-router的路由设置抽出去，使得在浏览器跟服务端可以共用
//下面也会讲到...
import AppRoutes from 'src/AppRoutes';

//这里我们创建一个简单的class，暴露一些方法出去，然后在koa路由里去调用来实现服务端渲染
class SSR {
  //koa 路由里会调用这个方法
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
    //获取服务端已经渲染好的组件数组
    let bundles = getBundles(stats, modules);
    return {
      html,
      scripts: this.generateBundleScripts(bundles),
    };
  }
  //把SSR过的组件都转成script标签扔到html里
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
当编译这个文件的时候，在webpack配置里使用`target: "node"` 和 `externals`，并且在你的打包前端app的webpack配置中，需要加入react-loadable的插件，app的打包需要在ssr打包之前运行，不然拿不到react-loadable需要的各组件信息，先来看app的打包：
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
在`.babelrc`中加入loadable plugin:
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
上面的配置会让`react-loadable`知道哪些组件最终在服务端被渲染了，然后直接插入到html script标签中，并在前端初始化时把SSR过的组件考虑在内，避免重复加载，下面是SSR的打包：

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
  //避免把node_modules里的库都打包进去，此ssr js会直接运行在node端，
  //所以不需要打包进最终的文件中，运行时会自动从node_modules里加载
  externals: [nodeExternals()],
  //...
}
```
然后在koa `app.js`, require它，并且调用SSR的方法:
```javascript
//...koa app.js
//build出来的ssr.js
const SSR = require('./build/node/ssr');
//preload all components on server side, 服务端没有动态加载各个组件，提前先加载好
SSR.preloadAll();

//实例化一个SSR对象
const s = new SSR();

router.get('*', async (ctx) => {
  //根据路由，渲染不同的页面组件
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
  `;
  ctx.body = html;
});
//...
```
以上是个简单的实现React SSR到koa web server, 为了使`react-loadable`知道哪些组件在服务端渲染了，`rendered`里面的`scripts`数组里面包含了SSR过的组件组成的各个script标签，里面调用了`SSR#generateBundleScripts()`方法，在插入时需要确保这些script标签在`runtime.js`之后((通过 `CommonsChunkPlugin` 来抽出来))，并且在app bundle之前（也就是初始化的时候应该已经知道之前的哪些组件已经渲染过了）。更多`react-loadable`服务端支持，参考[这里](https://github.com/jamiebuilds/react-loadable#------------server-side-rendering).

上面我们还把react-router的路由都单独抽出去了，使得它可以运行在浏览器跟服务端，以下是`AppRoutes`组件：

```jsx
//AppRoutes.js
import Loadable from 'react-loadable';
//...

const AsyncHello = Loadable({
  loading: <div>loading...</div>,
  loader: () => import('./Hello'), 
})

function AppRoutes(props) {
  <Switch>
    <Route exact path="/hello" component={AsyncHello} />
    <Route path="/" component={Home} />
  </Switch>  
}

export default AppRoutes

//然后在 App.js 入口中
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

### 服务端渲染的初始状态

目前为止，我们已经创建了一个React SPA，并且能在浏览器端跟服务端共同运行🍺，社区称之为`universal app` 或者 `isomophic app`。但是我们现在的app还有一个遗留问题，一般来说我们app的数据或者状态都需要通过远端的api来异步获取，拿到数据后我们才能开始渲染组件，服务端SSR也是一样，我们要动态的获取初始数据，然后才能扔给React去做SSR，然后在浏览器端我们还要初始化就能同步获取这些SSR时的初始化数据，避免浏览器端初始化时又重新获取了一遍。

下面我们简单从github获取一些项目的信息作为页面初始化的数据, 在koa的`app.js`中:

```javascript
//...
const fetch = require('isomorphic-fetch');

router.get('*', async (ctx) => {
  //fetch branch info from github
  const api = 'https://api.github.com/repos/jasonboy/wechat-jssdk/branches';
  const data = await fetch(api).then(res => res.json());
  
  //传入初始化数据
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
  `;
  ctx.body = html;
});
```
然后在你的`Hello`组件中，你需要check`window`里面（或者在App入口中统一判断，然后通过props传到子组件中）是否存在`window.__INITIAL_DATA__`，有的话直接用来当做初始数据，没有的话我们在`componentDidMount`生命周期函数中再去来数据：

```jsx
export default class Hello extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      //这里直接判断window，如果是父组件传入的话，通过props判断
      github: window.__INITIAL_DATA__ || [],
    };
  }
  
  componentDidMount() {
    //判断没有数据的话，再去请求数据
    //请求数据的方法也可以抽出去，以让浏览器及服务端能统一调用，避免重复写
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
好了，现在如果页面被服务端渲染过的话，浏览器会拿到所有渲染过的html, 包括初始化数据，然后通过这些SSR的内容配合加载的js，再组成一个完整的SPA，就像一个普通的SPA一样，但是我们得到了更好的性能，更好的SEO😎。

### 🎉React-v16 更新

在React的最新版v16中，SSR的API做了很多的优化，并且提供了新的基于流的API来更好的提升性能，通过streaming api, 服务端可以边渲染边把前面渲染好的html发到浏览器，浏览器端也可以提前开始渲染页面而不是等服务端所有组件都渲染完成后才能开始浏览器端的初始化，提升了性能也降低了服务端资源的消耗。还有一个在浏览器端需要注意的是需要使用`ReactDOM.hydrate()`来代替之前的`ReactDOM.render()`，更多的更新参考medium文章[whats-new-with-server-side-rendering-in-react-16](https://hackernoon.com/whats-new-with-server-side-rendering-in-react-16-9b0d78585d67).

💖*要查看完整的demo, 参考 [koa-web-kit](https://github.com/JasonBoy/koa-web-kit), `koa-web-kit`是一个现代化的基于React/Koa的全栈开发框架，包括React SSR支持，可以直接用来测试服务端渲染的功能*😀

### 结论

好了，以上就是React-SSR + Koa的简单实践，通过SSR，我们既提升了性能，又很好的满足了SEO的要求，Best of the Both Worlds🍺。

> 英文[原文](https://blog.lovemily.me/react-server-side-rendering-with-koa/)