---
title: A Deep Dive Guide for Crawling SPA with Puppeteer and Troubleshooting
date: "2017-10-18"
---

Websites have beening evolving from static sites to modern SPA applications, and with those changes, the tasks of SEO and web crawling have became a little bit tricky since you cannot get all the information from the initial html document. Here I will share some guides on how to crawl a SPA-like website with [puppeteer](https://github.com/GoogleChrome/puppeteer).
In a [previous post](https://blog.lovemily.me/better-seo-by-pre-rendering-angularjs-like-apps/), I shared how to use an existing service like `prerender` to serve better SEO for SPA apps, but here we will look at an even new lib with the latest Headless Chrome to work with, since we can use all the coolest and latest new features powered by Chrome, which brings us even closer to the real end users.
I may not cover the really basic apis that we can use with puppeteer, like capturing a screenshot, generating a pdf, set a UA, etc..., but on the other hand, I'd rather to share some guides when you work on a real life website crawling, with some troubleshooting tips when you deploy your puppeteer application to production.

TL;DR

- [Crawl a SPA Page](#crawl-a-spa-page)
- [Get Async/Ajax data](#get-async-ajax-data)
- [Navigate To Another Page](#navigate-to-another-page)
- [Troubleshooting while Deploying to Linux Systems](#troubleshooting)

<h2 id="crawl-a-spa-page" href="crawl-a-spa-page">Crawl a SPA Page</h2>

Before you start and open a webpage, you may also need to set a `HTTP_PROXY`/`HTTPS_PROXY` env to let your headless chrome request pages through the proxy to prevent being blocked by some anti-spider policies on which page you want to crawl.
Also if you are crawling a mobile page, you may want to emulate a mobile UA just like you do in your chrome dev tools, so you don't need to call `setUserAgent()` method manually:
```javascript
const devices = require('puppeteer/DeviceDescriptors');
const iPhone6 = devices['iPhone 6'];
...
const page = await browser.newPage();
await page.emulate(iPhone6);
```
also to make your request more human-like, you can set some extra headers like `Referer`:  
`await page.setExtraHTTPHeaders({Referer: 'https://www.domain.com/langdingpage'})`    
Now you can really goto the page:  
`await page.goto('https://www.domain.com/page1')`  
By default, it will resolve until the `load` event fires, so you have all the html available for following steps.
Now you can save the html to file for use at some later time, you could use [cheerio](https://github.com/cheeriojs/cheerio) to parse the html, and get some data from it:
```javascript
const cheerio = require('cheerio');
//whole document html at the moment
const html = await page.content();
//save to file
fs.writeFile('build/content.html', html, _ => console.log('done'));
//scrape that html conent
const $ = cheerio.load(html);
//now you use just like you do with jquery in browser
$('.title').text();
```


<h2 id="get-async-ajax-data" href="get-async-ajax-data">Get Async/Ajax data</h2>

So now you are in the initial state of the page, with only few information you want, the page may load more data as user scroll down the page continuously, so here you may simulate that you have scrolled down the page, and tell the page to load the next chunk of data. 
Before you do that, you need to go to the page in a real browser, and analyze how the page works, like in which element every item is wrapped(e.g li or a div), what is the ajax call(the url), what the pagination parameters look like, how the response data structured, and how you can check that all the data has been loaded..., yes, there are lots of preparation you need to do before you get the data you want.
So here suppose the page has a list of data, and we will need to scroll the page to load more data, one solution is that you get the last element like `li`, and scroll that into view inside `evaluate()`:
```javascript
await page.evaluate(() => {
    const lastLi = document.querySelector('ul.list > li:last-child');
    if(lastLi) {
      lastLi.scrollIntoView();
    }
  });
```
And then an ajax request will be triggered, but how you can get that response data? You may want to ask why the hell I need to get the request response data, I only need to want some time, and query through the DOM, get the newly added elements, and scrape the texts inside, and that's done. Yes, that's another way to scrape the data from html directly, but the benefits of intercepting the requests are that you can get all the raw data, and can be easily mapped to your own data structure, also the content displayed in html may be formatted from the raw data, like a displayed date may only be like "5 minutes ago", but what we need is a milliseconds value with all date info within it.
The way is that we use `request` and `response` events to listen for all the requests that the browser triggers, usually you only need to listen on `response` event since you only need response data:
```javascript
let allData = [];
page.on('response', async res => {
  //get and parse the url for later filtering
  const parsedUrl = new URL(res.url);
  //filter out the requests we do not need, or when the request fails
  if(parsedUrl.pathname != '/needed/ajax/url' || !res.ok) return;
  //do with the json data, e.g:
  const data = await res.json();
  // no more data
  if(!data.list) return;
  //add data to a single array for later use
  allData = allData.concat(data.list);
  //now you can trigger the next scroll
  //do the same above to get the updated last li, and scroll that into view...
})
```
You should wrap these sequence actions into a Promise so that you can resolve that after you get all the data, and continue to the next step:

```javascript
async function getListData(url) {
  return new Promise(async (resolve, reject) => {
    const page = await browser.newPage();
    page.on('response', async res => {
      if(allDataReceived) {return resolve(allData)}
      if(err) {return reject(err);}
      do with the data...
    });
    page.goto(url);
  });
}
```
*Don't forget that if you want to pass params from your node context to `evaluate()`(browser context), you need to pass them to the callback*
```javascript
const p1 = 1;
//if you don't add p1 after the callback, you cannot access `p1` in the callback, which will throw exception
const p2 = await page.evaluate(p1 => p1 * 2, p1);
```


<h2 id="navigate-to-another-page" href="navigate-to-another-page">Navigate To Another Page</h2>

After getting all the data on the current page, you may want to navigate to another page to fetch some other data, So you need to query some element like an `a` tag, and click on that:
```javascript
const ele = await page.$('a.next-page');
await ele.click({delay: 300});
```
then wait the new page loaded, and get new data, there are couple of ways to wait the second page to be loaded:
```javascript
//1.wait for a specific element to be available in 2nd page:
await page.waitForSelector('#page2 ul.datalist2');
//2. listen on a "load" event when loading page:
page.on('load', async () => {
    console.log('load event! new page html...');
    const html = await page.content();
    ...
  });
//also listen on a "framenavigated" event when navigating to another url
page.on('framenavigated', frame => {
    console.log(`new url: ${frame.url()}`);
    ...
  });
```
After everything is done, close the page and the headless browser:
```javascript
await page.close();
browser.close();
```  


<h2 id="troubleshooting" href="troubleshooting">Troubleshooting while Deploying to Linux Systems</h2>

So far everything looks great when you develop your crawler on your Mac or Windows, and then you try to deploy that on your linux server, and holy crap:(, lots of exceptions when you start the crawler, then you start a long journey searching google, searching github, trying to find what the hack is wrong😰.
Here I will list some resources and quick fixes for how to run puppeteer on a liunx machine.
I will use CentOS as a example here, first of all, you need to install couple of dependences on your system, for CentOS_7:
`sudo yum install pango.x86_64 libXcomposite.x86_64 libXcursor.x86_64 libXdamage.x86_64 libXext.x86_64 libXi.x86_64 libXtst.x86_64 cups-libs.x86_64 libXScrnSaver.x86_64 libXrandr.x86_64 GConf2.x86_64 alsa-lib.x86_64 atk.x86_64 gtk3.x86_64 ipa-gothic-fonts xorg-x11-fonts-100dpi xorg-x11-fonts-75dpi xorg-x11-utils xorg-x11-fonts-cyrillic xorg-x11-fonts-Type1 xorg-x11-fonts-misc nss`  
Really a lots of stuff, but just do it!  
For a Debian(like Ubuntu) system, check out the [Puppeteer Troubleshooting wiki](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md)
After you install all the deps, and you are happy to try again, but couple of new error messages displayed on your console again:(
```
Failed to launch chrome!
[1013/165824.375714:FATAL:zygote_host_impl_linux.cc(123)] No usable sandbox! Update your kernel or see https://chromium.googlesource.com/chromium/src/+/master/docs/linux_suid_sandbox_development.md for more information on developing with the SUID sandbox. If you want to live dangerously and need an immediate workaround, you can try using --no-sandbox
``` 
As the message says, the headless chrome runs inside a sandbox to prevent security issue to your system, and here no usable sandbox available, but actually when you install puppeteer, the sandbox is also installed along with the headless chrome bundle, you just have to do some more configuration.  
But if you really want to run your crawler now, you can run with `--no-sandbox` option which put your system into a dangerous environment, which is highly discouraged:
```javascript
const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
```
So let's do a little more work to make your system less dangerous with sandbox enabled(*CentOS 7.3+ may not need this, but CentOS-7.2 needs those steps*):
1. go to your puppeteer installed dir(here puppeteer@0.12.0):
`cd ${project_root}/node_modules/puppeteer/.local-chromium/linux-508693/chrome-linux`  
2. change owner & privileges for `chrome_sandbox`:
`sudo chown root:root chrome_sandbox && sudo chmod 4755 chrome_sandbox`  
3. set `CHROME_DEVEL_SANDBOX` env, every time when puppeteer runs, this env should be available otherwise the sandbox cannot run, so it's better to set this into your `.bashrc` or your deploy script:
```bash
export CHROME_DEVEL_SANDBOX="$PWD/chrome_sandbox"
```
or with full path
```bash
export CHROME_DEVEL_SANDBOX="${project_root}/node_modules/puppeteer/.local-chromium/linux-508693/chrome-linux/chrome_sandbox"
```  

And that should fix the issue when running puppeteer in a linux system, cheers:).

### Conclusion

puppeteer has been released for only couple of weeks by the time this article was posted, but with the power of the most popular browser in the world, we can use all the latest features provided by Chrome to test our modern SPA applications, generate static html, crawling, and much more:)
Happy modern headless life with [puppeteer](https://github.com/GoogleChrome/puppeteer)😎
