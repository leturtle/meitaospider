var casper = require('casper').create({
    pageSettings: {
        loadImages:  false,
        loadPlugins: false
    },
    timeout: 300000 //MS 5mins
});
var utils = require("utils");
var system = require('system');
var args = casper.cli.args;
var cartesianProduct = require('cartesian-product');

var url = args[0];

//casper.on("remote.message", function(message) {
//  this.echo("remote console.log: " + message);
//});
//
//casper.on('page.error', function (msg, trace) {
//  this.echo( 'Error: ' + msg, 'ERROR' );
//});

var retData = {};

casper.start(url);

casper.then(function() {
    var properties = [], stocks = [], propertiesAry = [];

    var retColor = this.evaluate(function() {
        function parseMoney(amount) {
            return amount ? (amount.replace(/[^0-9\.]+/g,"")) : 0;
        }

        var primitivePriceCurrency = "USD";
        var colorID = "colorSelectBox";
        var colorName = "color";

        var colorOptions = document.querySelectorAll("."+colorID+" option");
        var color = {};
        color['name'] = colorName;
        color['id'] = colorID;
        color['data'] = {};

        var colors = [];

        for (var i = 0; i < colorOptions.length; i++) {
            var tmpOption = colorOptions[i];

            if (tmpOption.value == "") continue;

            var tmpDesc = tmpOption.innerText;
            var tmpSample = document.querySelector(".product-thumbnail").src;
            var tmpDemo = document.querySelector(".product-thumbnail").dataset.mainUrl;
            var tmpPrice = document.querySelector("[itemprop='price']").innerText.trim();
            var tmpID = tmpOption.value;

            var tmpObject = {
                desc: tmpDesc
                , demo: tmpDemo
                , sample: tmpSample
                , primitive_price: parseMoney(tmpPrice)
                , primitive_price_currency: primitivePriceCurrency
                , exID: tmpID
            };

            color['data'][tmpID] = tmpObject;
            colors.push(tmpID);
        }

        return {color:color, colors:colors};
    });

    var retSize = this.evaluate(function() {
        var primitivePriceCurrency = "USD";
        var sizeID = "sizeSelectBox";
        var sizeName = "size";

        var sizeOptions = document.querySelectorAll("."+sizeID+" option");

        var size = {};
        size['name'] = sizeName;
        size['id'] = sizeID;
        size['data'] = {};

        var sizes = [];

        for (var i = 0; i < sizeOptions.length; i++) {
            var tmpOption = sizeOptions[i];

            if (tmpOption.value == "") continue;

            var tmpDesc = tmpOption.innerText;
            var tmpSample = "", tmpDemo = "";
            var tmpID = tmpOption.value;

            var tmpObject = {
                desc: tmpDesc
                , demo: tmpDemo
                , sample: tmpSample
                , primitive_price: 0
                , primitive_price_currency: primitivePriceCurrency
                , exID: tmpID
            };

            size['data'][tmpID] = tmpObject;
            sizes.push(tmpID);
        }

        return {size:size, sizes:sizes};
    });

    properties.push(retColor['color']);
    properties.push(retSize['size']);
    propertiesAry.push(retColor['colors']);
    propertiesAry.push(retSize['sizes']);

    var stockMapping = cartesianProduct(propertiesAry);
    for (var x in stockMapping) {
        var tmpRow = stockMapping[x];
        var tmpStock = {};
        for (var y in tmpRow) {
            var selectValue = String(tmpRow[y]);
            var selector = properties[y].id;
            tmpStock[selector] = selectValue;
        }
        tmpStock['soldout'] = 1;
        stocks.push(tmpStock);
    }

    var tmpStock, stockValue, tmpTarget;
    for (var x in stocks) {
        tmpStock = stocks[x];
        for (var m in tmpStock) {
            if (m == 'soldout') continue;
            tmpTarget = tmpStock[m];
            this.evaluate(function setProperties(id, value) {
                var selector = document.querySelector("."+id);
                var option = selector.querySelector("option[value='"+value+"']");
                selector.selectedIndex = option.index;
            }, m, tmpTarget);
        }
        //this.capture('runtime/screenshot_'+x+'.png');
        stockValue = this.evaluate(function getStockStatus() {
            var stockStr = document.querySelector(".product-status").innerText;
            return stockStr == "In Stock" ? true : false;
        });
        if (stockValue) {
            stocks[x].soldout = 0;
        } else {
            stocks[x].soldout = 1;
        }
    }

    retData = {
        "properties": properties
        , "stocks": stocks
    };
});

casper.run(function() {
    utils.dump(retData);
    this.exit();
});