---
title: A guideline for simple NodeJS web app
date: "2015-10-05"
---

Since the Node.JS has become one of the most popular technology recently, more and more developers have beening embracing NodeJS as their primary tech stack in their projects. 
Here we use NodeJS as our front-end technology as we want to be faster and more flexiable both in developement and deployment. Here I want to share a guideline for creating a simple web app using NodeJS, including some helpful experience in real practises. 

First of all, download and install [NodeJS](https://nodejs.org/en/) in your platform, and you're ready to go. 

### Create empty project

We will use [ExpressJS](http://expressjs.com/) as the MVC framework, the great thing is that the express team offers a [ExpressGenerator](http://expressjs.com/starter/generator.html) to guickly create a simple nodejs web application in seconds.

1. install the express generator globally
   `npm install express-generator -g`
2. create a sample web app in your worksapce
   `express myapp`       
3. install dependences and start the sample server
   `cd myapp` to go inside the project dir  
   `npm install` to install all the dependences  
   `npm start` to start the server  


It's very easy to create a empty nodejs app using ExpressGenerator, and then we can add more stuff to the project.

### Change Template Engine  
  
The default template engine used by the project is [Jade](http://jade-lang.com/), but we are going to switch to [Swig](http://paularmstrong.github.io/swig/) which is simpler and more powerful and the most important thing is that swig suits our project better, I didn't say which template is better, but which suits your project better is the best choice.

1. Add swig to your `package.json` in `dependencies` section
   `"swig": "~1.4.2"`  
2. `npm install` to install the swig lib  
3. go to `app.js` to change the html engine  

```javascript
var swig = require('swig');
var app = require('express')();
//html in views dir
app.set('views', require('path').join(__dirname, 'views')); 
app.engine('html', swig.renderFile);
app.set('view engine', 'html') //set file extension
```
Then you can use swig and html file to render the pages.

### Build Tool

Now you can start your server and add pages to your project, but before you release your project to the web, you still have some work to do, one important thing is that you need to build your js/css/html files into compressed ones to have better performence.

Currently we use [Gulp](http://gulpjs.com/) to build our static assets(there are also Browserify and webpack to do the job, I will talk about that in later articles).
1. install gulp globally  
   `npm install gulp -g`  
2. Add related gulp and it's plugins into `package.json`  
```
    "gulp": "~3.9.0",
    "gulp-concat": "^2.5.2",
    "gulp-imagemin": "^2.4.0",
    "gulp-less": "^3.0.3",
    "gulp-minify-css": "^1.1.1",
    "gulp-notify": "^2.2.0",
    "gulp-rename": "~1.2.2",
    "gulp-rev": "^6.0.1",
    "gulp-sourcemaps": "^1.5.2",
    "gulp-uglify": "^1.2.0",
    "gulp-util": "^3.0.3",
    ...
```
3. Then create `gulpfile.js` in your project root dir, and add some tasks there.
For example, we want to add a task to compile the `less` files into css, we can do as follows:
```javascript
//...require any libs needed below
gulp.task('css', function () {
  var compiledPath = 'public/build/css';
  return gulp.src(['public/less/**/*.less'])
    .pipe(gulpif(DEV_MODE, sourcemaps.init()))
    .pipe(less())
    .pipe(gulpif(DEV_MODE, sourcemaps.write('./maps')))
    .on('error', gutil.log)
    .pipe(gulpif(!DEV_MODE, minifycss()))
    .pipe(gulp.dest(compiledPath))
    ;
});
```
Then we can run `gulp css` in command line to compile all the less files in `/public/less` to css file, and minify that if we are in production mode.
Another example to uglify js files:
```javascript
gulp.task("js", function () {
  return gulp.src(compileSrc)
    .pipe(uglify())
    .pipe(gulp.dest(buildPath))
    ;
});
```
You can add as many tasks as you want to complete your project workflow. And we can run needed tasks before we start the server, but one more thing, how to deploy the node project properly?

### Deployment

Of course we can run `npm start` to start the node server, but what about when some exception occurs, which will kill the process, and we are done, unless we start the server manually, but that's really inconvenient. So we choose [PM2](http://pm2.keymetrics.io/) as a production deployment tool, which can restart the node app automatically when the process is dead, also it has a built-in load-banlancer to have cluster mode in production, and many many other cool features.
To start the server using PM2, 
1. install pm2 globally  
   `npm install pm2 -g`  
2. run the command to start the server in cluster mode:
   `pm2 start ./bin/www -i 0 --name 'myapp'`  
3. and you can use `pm2 list` to see the running process in pm2, and reference the [PM2 Document](https://github.com/Unitech/pm2) for details.

### Conclusion

This is simple guide to create a nodejs app from scratch, we covered some cool frameworks and libs to make our develop life easier.See you soon:)!!!

 
 