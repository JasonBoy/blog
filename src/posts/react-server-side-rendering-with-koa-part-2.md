---
title: React Server Side Rendering with Koa Part II
date: "2019-02-22"
description: "use React Server Side Rendering with Koa App with loadable-component"
tags: ["node", "react", "koa", "ssr"]
---

This is the 2nd part of the React SSR guide since the [previous one](/react-server-side-rendering-with-koa/), during the last couple of months(actually it's almost a year🤣), lots of stuff has been changed, so in this post, I will make some changes to the SSR toolchain, and also add some new features for SSR🍺.

### TLDR:

- ✂️ Replace not-maintained `react-loadable` with <a href="https://github.com/smooth-code/loadable-components" target="_blank">loadable-components</a>
- 📉 Use `loadable-components` to make async components work both on client and server side
- 🚰 Use react stream API on SSR
- 💾 Cache SSRed content for both React sync and stream API

### ✂️ Replace react-loadable with loadable-components

react-loadable has not been maintained for a long time, and it's not compatible with webpack4+ and babel7+, so if you try the <a href="https://github.com/JasonBoy/koa-web-kit" target="_blank">koa-web-kit</a> on the v2.8 and older versions, it will always show a Deprecation warning when you build with webpack which is caused by react-loadable's webpack plugin, so the first thing we need to do is to replace it with something new, and works great with the latest version of webpack, babel and `React.lazy|React Suspense` api, and `loadable-components` is a [recommended one](https://reactjs.org/docs/code-splitting.html#reactlazy) by the React team if you want do async components and SSR(currently `React.lazy` does not support SSR).

So the first thing we need to do is to install the related packages:  
```bash
# For `dependencies`:
npm i @loadable/component @loadable/server
# For `devDependencies`:
npm i -D @loadable/babel-plugin @loadable/webpack-plugin
```
And then you can remove the `react-loadable/webpack` and `react-loadable/babel` plugins and replace them with `@loadable/webpack-plugin` and `@loadable/babel-plugin` in the corespondent webpack and babel config files.
So on the next step, we will need to do some code change on React component if they need to do code-splitting.

### 📉 Use loadable-components to make async components work both on client and server side

In an React Component:
```jsx
// import Loadable from 'react-loadable';
import loadable from '@loadable/component';

const Loading = <h3>Loading...</h3>;
const HelloAsyncLoadable = loadable(
  () => import('components/Hello'),
  { fallback: Loading, }
);
//simple usage
export default MyComponent() {
  return (
    <div>
      <HelloAsyncLoadable />
    </div>
  )
}
//an react-router usage
export default MyComponent() {
  return (
    <Router>
      <Route path="/hello" render={props => <HelloAsyncLoadable {...props}/>}/>
    </Router> 
  )
}
```
It's very similar with the react-loadable style, simply pass a function to loadable which return a dynamic import statement, and optionally add a fallback component, and that's all you need to do with your React Component.

And the next thing is to change the entry file to hydrate the server rendered content,
in your `src/index.js`:
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { loadableReady } from '@loadable/component';
import App from './App';

loadableReady(() => {
  ReactDOM.hydrate(
    <App />,
    document.getElementById('app')
  );
});
```
And that's basically all the stuff you need to change on client side when migrating to loadable-components. Next we will make some changes on server side to make SSR really work with loadable-components.

With the old react-loadable, you need to `Loadable.preloadAll()` components on server side when you have async components since they don't need to be asynchronously loaded on server side, with loadable-components, it's unnecessary, so just remove that call. Then, in your server side webpack entry file:
```javascript
import path from 'path';
import { StaticRouter } from 'react-router-dom';
import ReactDOMServer from 'react-dom/server';
import { ChunkExtractor } from '@loadable/server';
import AppRoutes from 'src/AppRoutes';
//...maybe some other libraries

function render(url, initialData = {}) {
  const extractor = new ChunkExtractor({ statsFile: path.resolve('../dist/loadable-stats.json') });
  const jsx = extractor.collectChunks(
    <StaticRouter location={url}>
      <AppRoutes initialData={data} />
    </StaticRouter>
  );
  const html = ReactDOMServer.renderToString(jsx);
  const renderedScriptTags = extractor.getScriptTags();
  const renderedLinkTags = extractor.getLinkTags();
  const renderedStyleTags = extractor.getStyleTags();
  return `
      <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>React App</title>
          ${renderedLinkTags}
          ${renderedStyleTags}
        </head>
        <body>
          <div id="app">${html}</div>
          <script type="text/javascript">window.__INITIAL_DATA__ = ${JSON.stringify(
            initialData
          )}</script>
          ${renderedScriptTags}
        </body>
      </html>
    `;
}
```
And bingo, everything is working like old times😀

### 🚰 Use react stream API on SSR

From React v16+, the React team added a stream API `renderToNodeStream` to streaming your large app rendering for better performance, and that's what we gonna do next:
In a koa route for example:
```javascript
router.get('/index', async ctx => {
  //disable koa handling the current response, since we will pipe content to http res directly
  ctx.respond = false;
  const {htmlStream, extractor} = render(ctx.url);
  const before = `
        <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            ${extractor.getStyleTags()}
          </head>
          <body><div id="app">`;
  ctx.res.write(before);
  htmlStream.pipe(
    ctx.res,
    { end: false }
  );
  htmlStream.on('end', () => {
    const after = `</div>
        <script type="text/javascript">window.__INITIAL_DATA__ = ${JSON.stringify(
          extra.initialData || {}
        )}</script>
          ${extractor.getScriptTags()}
        </body>
      </html>`;
    // res.end(after);

    ctx.res.write(after);
    ctx.res.end();
  });
});
function render(url){
  //...
  //and replace renderToString with renderToNodeStream
  const htmlStream = ReactDOMServer.renderToNodeStream(jsx);
  return {
    htmlStream,
    extractor,
  }
  //...
}
```
The above code mainly split the stream into 3 parts, first we need write the html head and half of the React app container(with the `id="app"` div), then we pipe the stream from `ReactDom.renderToNodeStream()` into res, and disable auto close of the res stream, and last we listen on the htmlStream's end event to write the last part of the html document, and `res.end()` to end the res stream manually. So here we go, we have support both the two render modes for SSR. 

Another remaining problem is that we don't want to render the whole App for every request, that would be unnecessary for some static pages, since every time the rendered content is the same, it will heavily impact the performance for requests handling, to solve this kind of problem, we need to add a cache layer for SSR, you can save cached content in memory, files, or even databases based on your project needs.

### 💾 Cache SSRed content for both React sync and stream API

It's easy to cache html content when we use the `renderToString` API, you get the html and save the html somewhere based on the url or other unique key. But how do we achieve the same result with the `renderToNodeStream` API since the stream is piping into http response directly? Here the streams we are using are `ReadableStream`(from renderToNodeStream) and `WritableStream`(http response), but there are some other streams we can use to solve the problem, one of which is [TransformStream](https://nodejs.org/api/stream.html#stream_duplex_and_transform_streams), by piping the readableStream into transformStream, we can do some transformation to the chunk data received from the readableStream, and then pipe the transformed result into another writableStream. Here we are not actually transforming the rendered html to something else, but just to grab the html chunks and save that temporally in memory, and after the stream is done, we concatenate all the chunks to get the full html document, and then we can store it into some persistence storage, and voila, problem solved.

Enough talk, let's write the code to see how it works:
```javascript
const { Transform } = require('stream');
//here we create a cache using Map just for simplicity
const cache = new Map();
//Array to temporally save the stream chunks
const bufferedChunks = [];
//Create a transform Stream
const cacheStream = new Transform({
  //this will be called when we get a chunk of data, and we push that into bufferedChunks
  transform(data, enc, cb) {
    bufferedChunks.push(data);
    //continue to pipe to res without changing anything
    cb(null, data);
  },

  // flush() is called when everything is done
  flush(cb) {
    //concat all the chunks to transform to string, and store that into cache with the key
    cache.set(key, Buffer.concat(bufferedChunks).toString() );
    cb();
  },
});
```
We'd better to wrap the code above into a function so that we can create a cacheStream when a different request received. And the we change the code to use cacheStream:

```javascript
//wrap the code above into a createCacheStream function
const cacheStream = createCacheStream(key);
//cacheStream will pipe to res instead of htmlStream, the htmlStream will pipe to cacheStream
cacheStream.pipe(
  res,
  { end: false }
);
//only show part of the html
const before = ` <!DOCTYPE html> <html lang="en"> <head>...`;
cacheStream.write(before);
// res.write(before);

htmlStream.pipe(
  cacheStream,
  { end: false }
);

htmlStream.on('end', () => {
  const after = `</div>
      <script type="text/javascript">window.__INITIAL_DATA__ = ${JSON.stringify( {} )}</script>
        ${extractor.getScriptTags()}
      </body>
    </html>`;
  cacheStream.write(after);
  console.log('streaming rest html content done!');
  res.end();
  cacheStream.end();
});
```
We pipe the htmlStream into cacheStream, which will grab all the html content and try to save it in Map, while also piping that into res stream, so now next time when an request with the same url reaches, you can check if the cache already has the html for that url, (e.g: `cache.has(key)`), if it returns true, you can just send the content directly without re-rendering the App again.

**💖*Want to see the full demo above? Check out the [koa-web-kit](https://github.com/JasonBoy/koa-web-kit), and enjoy the SSR bonus for your application*😀**

### Conclusion

And above are basically all the stuff for this Part II guide(check out [Part 1](/react-server-side-rendering-with-koa/) for basic setup), we first replace the react-loadable which is not maintained anymore, and it's not compatible with the latest toolchains, and then we use the react stream API to do SSR which can improve our SSR performance when we has a large React App, and finally we leverage the cache layer to further improve our React SSR performance, cheers🍺  

Stay tuned for Part III🙌

