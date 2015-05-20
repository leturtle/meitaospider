var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var urls = require('url');
var spawn = require('child_process').spawn
var log4js = require('log4js');

log4js.configure({
  appenders: [
    { type: 'console' },
    {
      type: 'file',
      filename: 'logs/access.log',
      maxLogSize: 1024,
      backups:3,
      category: 'normal'
    }
  ],
  replaceConsole: true
});
var logger = log4js.getLogger('normal');
logger.setLevel('INFO');

var app = express();
app.set('view engine', 'jade');
app.set('views', __dirname);

app.use(log4js.connectLogger(logger, {level:log4js.levels.INFO}));
app.use(app.router);

app.get('/', function(req, res){
  res.render('index');
});

app.get('/post', function(req, res){
  var url = req.query.url;
  var mytrakpaknumber = req.query.mytrakpaknumber;
  var parser = '';
  var body = '';

  pt = spawn('phantomjs', ['--load-images=false', 'phantompost.js', url, mytrakpaknumber]);

  pt.stdout.on('data', function (data) {
    body += data
  });
  
  pt.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });
  
  pt.on('close', function (code) {
    var $ = cheerio.load(body);
    var Parser = require("./parser/trackmytrakpak.js");
    var p = new Parser($);
    try {
      var j = p.getJSON();
    } catch (e) {
      console.log(e.message);
      var j = {'status':'001','msg':e.message};
    }

    res.set('Content-Type', 'application/json');
    res.send(j);
  });

});

app.get('/crawler', function(req, res) {
  var url = req.query.url;
  var parser = '';
  var body = '';

  pt = spawn('phantomjs', ['--load-images=false', 'phantom.js', url]);

  pt.stdout.on('data', function (data) {
    body += data
  });
  
  pt.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  pt.on('close', function(code) {
    var $ = cheerio.load(body);
    hostname = urls.parse(url).hostname;
    switch(hostname) {
      case "tb.cn":
      case "item.taobao.com":
        parser = './parser/taobao.js';
        break;
      case "h5.m.taobao.com":
        parser = './parser/h5mtaobao.js';
        break;
      case "detail.m.tmall.com":
        parser = './parser/mtmall.js';
        break;
      case "detail.tmall.com":
        parser = './parser/tmall.js';
        break;
      case "www.amazon.cn":
        parser = './parser/amazoncn.js';
        break;
      case "www.suning.com":
      case "product.suning.com":
      case "sale.suning.com":
        parser = './parser/suning.js';
        break;
      case "chaoshi.detail.tmall.com":
        parser = './parser/tmallchaoshi.js';
        break;
      case "detail.tmall.hk":
        parser = './parser/tmallhk.js';
        break;
      case "item.m.jd.com":
        parser = './parser/mjd.js';
        break;
      case "item.jd.com":
        parser = './parser/jd.js';
        break;
      default:
        console.log("parser not found "+url);
        res.set('Content-Type', 'application/json');
        res.send('{}');
        break;
    }
    if(parser != ""){
      var Parser = require(parser);
      var p = new Parser($);
      var j = p.getJSON();

      res.set('Content-Type', 'application/json');
      res.send(j);
    }
  });
});

app.get('/fetch', function(req, res){
  var url = req.query.url
  var parser = '';
  var body = '';
  pt = spawn('phantomjs', ['--load-images=false', 'phantom.js', url]);

  pt.stdout.on('data', function (data) {
    body += data;
  });

  pt.stderr.on('data', function (data) {
    console.log("error:" + data);
  });

  pt.on('close', function (code) {
    //console.log(body);
    var $ = cheerio.load(body);
    parser = '';
    hostname = urls.parse(url).hostname;
    console.log(hostname);
    switch(hostname){
      case "item.taobao.com":
        parser = './parser/taobao.js';
        break;
      case "detail.tmall.com":
        parser = './parser/tmall.js';
        break;
      case "detail.tmall.hk":
        parser = './parser/tmallhk.js';
        break;
      case "chaoshi.detail.tmall.com":
        parser = './parser/tmallchaoshi.js';
        break;
      case "item.jd.com":
        parser = './parser/jd.js';
        break;
      case "www.amazon.cn":
        parser = './parser/amazoncn.js';
        break;
      case "www.amazon.com":
        parser = './parser/amazon.js';
        break;
      case "www.drugstore.com":
        parser = './parser/drugstore.js';
        break;
      case "web1.sasa.com":
        parser = './parser/sasa.js';
        break;
      case "www.lookfantastic.com":
        parser = './parser/lookfantastic.js';
        break;
      case "www.mankind.co.uk":
        parser = './parser/mankind.js';
        break;
      case "www.hqhair.com":
        parser = './parser/hqhair.js';
        break;
      case "www.gilt.com":
        parser = './parser/gilt.js';
        break;
      case "www.thehut.com":
        parser = './parser/thehut.js';
        break;
      case "global.lotte.com":
        parser = './parser/lotte.js';
        break;
      case "www.ebay.com":
        parser = './parser/ebay.js';
        break;
      case "www.suning.com":
      case "product.suning.com":
      case "sale.suning.com":
        parser = './parser/suning.js';
        break;
      case "mall.jumei.com":
        parser = './parser/jumeimall.js';
        break;
      default:
        console.log("parser not found "+url);
        res.set('Content-Type', 'application/json');
        res.send('{}');
        break;
    }
    if(parser != ""){
      var Parser = require(parser);
      var p = new Parser($);
      var j = p.getJSON();

      res.set('Content-Type', 'application/json');
      res.send(j);
    }
  });

});

app.listen(3001, function(){
  console.log('Express is listing 3001');
});
