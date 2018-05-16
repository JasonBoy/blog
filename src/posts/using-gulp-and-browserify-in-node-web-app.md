---
title: Using Gulp and Browserify in Node Web App
date: "2016-01-02"
description: "Here I will talk about using browserify with gulp together to build our assets quickly both in dev and prod environment"
tags: ["node", "gulp", "browserify"]
---

After you developing your project, and before releasing it to the public, you may want to do some optimization for your project for best performance. 
Before I was using the requirejs to do the module loading, but since the AMD way is little bit old, and thanks to the Node's commonjs way, we start to use [browserify](http://browserify.org/)(OK, webpack is newer, but according to the project we have, we will use browserify first) to do the job.
Here I will talk about using browserify with gulp together to build our assets quickly both in dev and prod environment.
### Install Modules

`npm install -g gulp`  
and related modules to you project's `package.json`'s `devDependencies` section. 


```json
{
  "browserify": "^12.0.1",
  "glob": "^6.0.1",
  "gulp": "~3.9.0",
  "gulp-concat": "^2.5.2",
  "gulp-rename": "~1.2.2",
  "gulp-uglify": "^1.2.0",
  "gulp-util": "^3.0.3",
  "vinyl-buffer": "^1.0.0",
  "vinyl-paths": "^1.0.0",
  "vinyl-source-stream": "^1.1.0"
}
```
  
### Create the gulp task

Now we can write a simple js task to bundle your js files with browserify. 
```javascript
var gulp = require('gulp');
var b = require('browserify');
//...  
gulp.task('js', function(){
  b({
    entries: './js/app.js',
    debug: true
  }).bundle()
  .pipe(source('bundle.js'))
  .pipe(gulp.dest('./build')) 
});
```
That's a simple task to bundle your js into a single file, the `debug` property indicates that the bundled file will have it's sourcemap to navigate to the exact line when some error occured or when you want to do some debug.
But what about if I want to bundle couple of entries at once, like I have couple of Angular controllers in separate files, and want to bundle them into a single one, well you can use `glob` module to get all the entries and pass it to the `entries` property as an array.
And how about if I want to separate the libs into another file, which will rebundle your own js files much faster? You can use the `external` method to do that, and `require` these libs in your another bundle.
OK, lets put all these together:
```javascript
gulp.task('js', function(){
  glob('./js/*.js', function(err, files){
    b({
      entries: files,
      debug: false,
      cache: {}, //use when uglify js 
      packageCache: {},
    })
    .external(['angular', 'jquery'])//ignore the libs in your bundle
    .plugin('bundle-collapser/plugin') //replace module file path with index in your bundled js to further reduce file size and not expose your file path
    .bundle()
    .pipe(source('bundle.js')) //bundle js name
    .pipe(buffer()) //(vinyl-buffer)convert to gulp stream to uglify
    .pipe(uglify()) //now we can uglify it
    .pipe(rev()) //(gulp-rev) to revision the file name with hash attached, e.g bundle-238dsdad1.js to have best use of cache.
    .pipe(gulp.dest('./public/build/js'))
    .pipe(rev.manifest()) // options for gulp-rev manifest file
    .pipe(gulp.dest('./build')) //write the dest file
  });
});
gulp.task('js.lib', function(){
  b().require(['angular', 'jquery'])
     .bundle()
     .pipe(source('bundle.lib.js'))
     .pipe(gulp.dest('./build'))
});
```
Now we have a fully featured task to bundle our js files for production:

* use multiple entries
* externalize the libs into separate bundle.  
* use plugin to even reduce the file size
* use gulp-rev to revision the bundled js for best cache policy
* use uglify to minify the js

### Watch your files

For dev env, you can also watch your js files to rebundle automatically.
Install `watchify` module, 
`npm isntall watchify --save`  
```javascript
gulp.task('watch', function(){
  b({
    entries: 'app.js'
  })
  .plugin(watchify, {
   ignoreWatch: ['**/node_modules/**']
  })
  .on('update', function(){
    //gulp.start('js')
    //your own handler when your file updated
  })
  .on('log', function(msg){
    gulpUtil.log(mes); //log something
  })
});
```
Now you can focus on your project without worrying about running the task manually, so cool :).

### Other Tips

* When working with jquery and bootstrap in browserify, don't forget to write:  
`window.$ = window.jQuery = require('jquery')`,  
otherwise your bootstrap.js will throw error with no jQuery found  
* using [browserify-shim](https://github.com/thlorenz/browserify-shim) when you have none CommonJS style libs  
* When we use libs installed by others package manager(like Bower), we need to define these libs manually if we dont want style like this in every file,  
`require('../../libs/angular/angular.min.js')`,  
instead we just want `require('angular')`, 
config that in your `package.json`'s `browser` property, see also [this](https://github.com/thlorenz/browserify-shim#a-config-inside-packagejson-without-aliases)

### Conclusion

Here we learned how to use gulp and browserify to simply bundle your js files.See you next time:)



