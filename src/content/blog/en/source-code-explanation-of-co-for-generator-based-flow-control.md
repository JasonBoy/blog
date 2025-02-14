---
title: Source Code Explanation of Co for Generator Based Flow-Control
description: Source Code Explanation of Co for Generator Based Flow-Control
pubDate: '2016-11-08'
heroImage: /blog-placeholder-2.jpg
tags:
  - node
  - co
  - generator
  - promise
  - ES6
---

Since the release of ES6(ES2015), which introduced a new feature called [Generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator), which is used for async control flow to prevent the callback hell. Generator allows us to do async tasks with sync coding, which makes our code more elegant and straight forward.
Generator is like a normal function, after you call the function, it returns an Iterator, which then you can call `next` method to control the code running all by yourself. Even though we have the full control with generator, which is really cool, but sometimes it is also a little bit overhead, when you have lots of generators nested together, which makes you stuck in the nested hell:(. Fortunately we already had a tool called [Co](https://github.com/tj/co) to help us run the whole generator(s) flow automatically out of the box.
The source code of Co is simple and elegant with only about 200 lines of code, below we will go through the main function code line by line to show you how the small tool makes your life easier.

### Code

_Code is based on on `Co@4.6.0`. At the end of the article, I will show a demo which uses all the `yield`ables that co supports_

```javascript
var slice = Array.prototype.slice;
```

This line is simple, which is used to convert the `arguments` to array and pass the needed parameters to `fn.apply` call.

```javascript
co.wrap = function (fn) {
  createPromise.__generatorFunction__ = fn;
  return createPromise;
  function createPromise() {
    //just pass the returned Iterator(Generator) to co call
    return co.call(this, fn.apply(this, arguments));
  }
};
```

The comments in the source code shows that it wraps the generator function into a function to prevent unnecessary closure with multiple `co()` calls, the `wrap` fun is also used internally in [Koa](https://github.com/koajs/koa), Inside the `createPromise` fn, it calls the co fn while also passing the consistent `this`, and the called generator function.

In the main `function co(gen){}` fun:

```javascript
var ctx = this;
var args = slice.call(arguments, 1);
```

First reference `this` to ctx, and extract the arguments except the first generator parameter, and pass them to `gen.apply()` .
Co wraps everything into a Promise, and will return the Promise.

```javascript
return new Promise(function(resolve, reject) {
    if (typeof gen === 'function') gen = gen.apply(ctx, args);
    if (!gen || typeof gen.next !== 'function') return resolve(gen);

    onFulfilled();
...
});
```

Inside the promise executor, it checks if `gen` is a function type, if yes, just run the function, and set the result to gen again, which will be a generator iterator if it was a `GeneratorFunction`, and then we can call `next` to start the code execution. And if the result is not a Iterator, just resolve the promise with the result of `gen` itself.
Run `onFulfilled()` to start the recursive execution of the nested yieldables.

```javascript
function onFulfilled(res) {
  var ret;
  try {
    ret = gen.next(res);
  } catch (e) {
    return reject(e);
  }
  next(ret);
  return null;
}
```

With `gen.next(res)` to pass `res` from the previous Promise result to previously paused yield expression result, and also get the next yield expression result to set to `ret`, if exception occurs, reject the current promise. Then call `next(ret)` to check the yielded result and create Promise based on the result object type to continue the next nested recursive flow.
`onRejected` function is almost the same as above.  
The last function inside the main `co` is `next()`, which is called as many times as needed to go through the whole execution flow, until it reaches the end.

```javascript
function next(ret) {
  if (ret.done) return resolve(ret.value);
  var value = toPromise.call(ctx, ret.value);
  if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
  return onRejected(
    new TypeError(
      'You may only yield a function, promise, generator, array, or object, ' +
        'but the following object was passed: "' +
        String(ret.value) +
        '"',
    ),
  );
}
```

First it checks if the current `ret` generator iterator is done, if yes, return and resolve the promise with the final value of the generator. Otherwise, convert `ret.value` to another Promise, and add the resolve/reject handler for the promise, if it's not promise, just reject the original promise with the type not supported Error.
Code above are the main logic of the Co library, and rest of the utility functions are used to convert different objects to Promises, object checking...
All supported `yield`ables are:

- thunk(function with a node-style callback, e.g `function(err, res){}`), may be deprecated soon.
- Promise
- Generator, GeneratorFunction
- Array, concurrently run multi async tasks
- Object, same as above, but with a key for every task

### Demo

Let's go through a demo to have a better understanding of the co control flow:

```javascript
testCo();
//control flow test
function testCo() {
  co(function* (a) {
    console.log('passed args:', a);
    let temp = 1;
    console.log(temp);
    temp = yield Promise.resolve(++temp);
    console.log(temp);
    temp = yield foo();
    console.log('foo done:', temp);
    return 'all done';
  }, 11).then(function (res) {
    console.log('final result:', res);
  });
}

function* foo() {
  console.log('foo:');
  const one = yield [
    Promise.resolve('foo-1'),
    new Promise(function (resolveFn, rejectFn) {
      setTimeout(function () {
        resolveFn('array timeout done!');
      }, 500);
    }),
  ];
  console.log('array: ', one);
  const two = yield bar();
  console.log('from bar:', two);
  return 'foo-done';
}

function* bar() {
  const obj = yield {
    objA: Promise.resolve('bar-1'),
    objB: new Promise(function (resolveFn, rejectFn) {
      setTimeout(function () {
        resolveFn('obj timeout done!');
      }, 500);
    }),
  };
  console.log('object:', obj);
  //yield a thunk
  const cc = yield function (cb) {
    cb(null, 'thunk result');
  };
  console.log('bar thunk:', cc);
  return 'bar done';
}
```

The result will be:

```
passed args: 11
1
2
foo:
array:  [ 'foo-1', 'array timeout done!' ]
object: { objA: 'bar-1', objB: 'obj timeout done!' }
bar thunk: thunk result
from bar: bar done
foo done: foo-done
final result: all done
```

You can go through the flow to understand the whole idea of Co.

### Conclusion

Co is a nice solution for simpler generator control flow, we can yield any supported async tasks in our business logic, and leave everything else to Co to finish all the tasks with the respect of our sync and async sequence needs.
Feel free to try it out, your life will become easier :).
