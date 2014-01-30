/*
 * moodmap.js 1.0 -    JavaScript Moodmap Library
 *
 * Copyright (c) 2011, Patrick Wied (http://www.patrick-wied.at)
 * Dual-licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and the Beerware (http://en.wikipedia.org/wiki/Beerware) license.
 */

(function(w){
    // the moodmapFactory creates moodmap instances
    var moodmapFactory = (function(){

    // store object constructor
    // a moodmap contains a store
    // the store has to know about the moodmap in order to trigger moodmap updates when datapoints get added
    var store = function store(mmap){

        var _ = {
            // data is a two dimensional array
            // a datapoint gets saved as data[point-x-value][point-y-value]
            // the value at [point-x-value][point-y-value] is the occurrence of the datapoint
            data: [],
            // tight coupling of the moodmap object
            moodmap: mmap
        };
        // the max occurrence - the moodmaps radial gradient alpha transition is based on it
        this.max = mmap.get("max");
        this.min = mmap.get("min");

        this.get = function(key){
            return _[key];
        };
        this.set = function(key, value){
            _[key] = value;
        };
    }

    store.prototype = {
        // function for adding datapoints to the store
        // datapoints are usually defined by x and y but could also contain a third parameter which represents the occurrence
        addDataPoint: function(x, y, mood){
            var me = this,
                moodmap = me.get("moodmap"),
                data = me.get("data");

            if(!data[x])
                data[x] = [];

            if(!data[x][y])
                data[x][y] = 0;

            // if mood parameter is set increment by mood otherwise by 1
            data[x][y]+=(mood && mood != null) ? mood : 1;

            me.set("data", data);

            /* TODO: In the former days, we checked if there was a new
             * maximum at this point (see below). Maximums could only
             * grow and not shrink. If there was a new maximum, we redrew
             * all points.
             * If one does implement this feature again for `min` and
             * `max`, it would be freaking cool if the bounds would
             * (optionally) shrink again.
             */
            /* if(me.max < data[x][y]){
                // max changed, we need to redraw all existing(lower) datapoints
                moodmap.get(
                   "actx"
                ).clearRect(
                    0,
                    0,
                    moodmap.get("width"),
                    moodmap.get("height")
                );
                me.setDataSet({ max: data[x][y], data: data });
                return;
            } */

            moodmap.drawAlpha(x, y, data[x][y], true);
        },
        setDataSet: function(obj, internal){
            var me = this,
                moodmap = me.get("moodmap"),
                data = obj.data;

            // clear the moodmap before the data set gets drawn
            moodmap.clear();

            this.max = obj.max;
            this.min = obj.min;

            // if a legend is set, update it
            moodmap.legend && moodmap.legend.update();

            if(internal != null && internal){
                // internally, we expect data to be in data[x][y] format
                // already and already in store
                for(var x in data){
                    if(data[x] === undefined) continue;
                    for(var y in data[x]){
                        if(y === undefined) continue;
                        moodmap.drawAlpha(x, y, data[x][y], false);
                    }
                }
            }else{
                for(var i in data){
                    var point = data[i];
                    me.addDataPoint(point.x, point.y, point.mood)
                }
            }
            moodmap.colorize();
        },
        exportDataSet: function(){
            var me = this,
                data = me.get("data"),
                exportData = [];

            for(var one in data){
                // jump over undefined indexes
                if(one === undefined)
                    continue;
                for(var two in data[one]){
                    if(two === undefined)
                        continue;
                    // if both indexes are defined, push the values into the array
                    exportData.push({x: parseInt(one, 10), y: parseInt(two, 10), mood: data[one][two]});
                }
            }

            return { max: me.max, min: me.min, data: exportData };
        },
        generateRandomDataSet: function(points){
            var moodmap = this.get("moodmap"),
                w = moodmap.get("width"),
                h = moodmap.get("height"),
                max = moodmap.get("max"),
                min = moodmap.get("min"),
                range = Math.abs(min - max),
                randomset = {
                    min: min,
                    max: max
                },
                data = [];
            while(points--){
                data.push({
                    x: Math.floor(Math.random()*w+1),
                    y: Math.floor(Math.random()*h+1),
                    mood: Math.floor(
                        Math.random()*range
                    ) + min
                });
            }
            randomset.data = data;
            this.setDataSet(randomset);
        }
    };

    var legend = function legend(config){
        this.config = config;

        var _ = {
            element: null,
            labelsEl: null,
            gradientCfg: null,
            ctx: null
        };
        this.get = function(key){
            return _[key];
        };
        this.set = function(key, value){
            _[key] = value;
        };
        this.init();
    };
    legend.prototype = {
        init: function(){
            var me = this,
                config = me.config,
                title = config.title || "Legend",
                position = config.position,
                gconfig = config.gradient,
                labelsEl = document.createElement("ul"),
                labelsHtml = "",
                grad, element, gradient, positionCss = "";

            me.processGradientObject();

            // Positioning

            // top or bottom
            if(position['t'] > -1){
                positionCss += 'top:'+position['t']+'px;';
            }else{
                positionCss += 'bottom:'+position['b']+'px;';
            }

            // left or right
            if(position['l'] > -1){
                positionCss += 'left:'+position['l']+'px;';
            }else{
                positionCss += 'right:'+position['r']+'px;';
            }

            element = document.createElement("div");
            if(config.class) {
                element.className = config.class;
                element.style.cssText = positionCss;
            }
            else {
                element.style.cssText = "border-radius:5px;position:absolute;"+positionCss+"font-family:Helvetica; width:256px;z-index:10000000000; background:rgba(255,255,255,1);padding:10px;border:1px solid black;margin:0;";
            }
            element.innerHTML = "<h3 id='moodmap-legend-title' style='padding:0;margin:0;text-align:center;font-size:16px;'>"+title+"</h3>";
            // create gradient in canvas
            labelsEl.style.cssText = "position:relative;font-size:12px;display:block;list-style:none;list-style-type:none;margin:0;height:15px;";


            // create gradient element
            gradient = document.createElement("div");
            gradient.style.cssText = ["position:relative;display:block;width:256px;height:15px;border-bottom:1px solid black; background-image:url(",me.createGradientImage(),");"].join("");

            element.appendChild(labelsEl);
            element.appendChild(gradient);

            me.set("element", element);
            me.set("labelsEl", labelsEl);

            me.update(1);
        },
        processGradientObject: function(){
            // create array and sort it
            var me = this,
                gradientConfig = this.config.gradient,
                gradientArr = [];

            for(var key in gradientConfig){
                if(gradientConfig.hasOwnProperty(key)){
                    gradientArr.push({ stop: key, color: gradientConfig[key].color, tickLabel: gradientConfig[key].tickLabel });
                }
            }
            gradientArr.sort(function(a, b){
                return (a.stop - b.stop);
            });
            if(!gradientConfig.hasOwnProperty(0)){
                gradientArr.unshift({ stop: 0, color: 'rgba(0,0,0,0)' });
            }

            me.set("gradientArr", gradientArr);
        },
        createGradientImage: function(){
            var me = this,
                gradArr = me.get("gradientArr"),
                length = gradArr.length,
                canvas = document.createElement("canvas"),
                ctx = canvas.getContext("2d"),
                grad;
            // the gradient in the legend including the ticks will be 256x15px
            canvas.width = "256";
            canvas.height = "15";

            grad = ctx.createLinearGradient(0,5,256,10);

            for(var i = 0; i < length; i++){
                grad.addColorStop(1/(length-1) * i, gradArr[i].color);
            }

            ctx.fillStyle = grad;
            ctx.fillRect(0,5,256,10);
            ctx.strokeStyle = "black";
            ctx.beginPath();

            for(var i = 0; i < length; i++){
                ctx.moveTo(((1/(length-1)*i*256) >> 0)+.5, 0);
                ctx.lineTo(((1/(length-1)*i*256) >> 0)+.5, (i==0)?15:5);
            }
            ctx.moveTo(255.5, 0);
            ctx.lineTo(255.5, 15);
            ctx.moveTo(255.5, 4.5);
            ctx.lineTo(0, 4.5);

            ctx.stroke();

            // we re-use the context for measuring the legends label widths
            me.set("ctx", ctx);

            return canvas.toDataURL();
        },
        getElement: function(){
            return this.get("element");
        },
        update: function(){
            var me = this,
                gradient = me.get("gradientArr"),
                ctx = me.get("ctx"),
                labels = me.get("labelsEl"),
                labelText, labelsHtml = "", offset;


            var range = Math.abs(store.max - store.min);
            var rangeStep = range / gradient.length;
            for(var i = 0; i < gradient.length; i++){

                if(gradient[i].tickLabel) {
                    labelText = gradient[i].tickLabel;
                }
                else {
                    if(i == gradient.length - 1) {
                        labelText = Math.round(store.min * 10) / 10;
                    }
                    else {
                        labelText = Math.round((store.min + rangeStep * i) * 10) / 10;
                    }
                }
                offset = (ctx.measureText(labelText).width/2) >> 0;

                if(i == 0){
                    offset = 0;
                }
                if(i == gradient.length-1){
                    offset *= 2;
                }
                labelsHtml += '<li style="position:absolute;left:'+(((((1/(gradient.length-1)*i*256) || 0)) >> 0)-offset+.5)+'px">'+labelText+'</li>';
            }
            labels.innerHTML = labelsHtml;
        }
    };

    // moodmap object constructor
    var moodmap = function moodmap(config){
        // private variables
        var _ = {
            radius : 40,
            blur : 30, // hardness for intersection of points
            drawingOffset: 15000,
            margin: 20,
            element : {},
            canvas : {},
            acanvas: {},
            ctx : {},
            actx : {},
            visible : true,
            width : 0,
            height : 0,
            max : false,
            min : false,
            gradient : false,
            opacity: 180,
            premultiplyAlpha: false,
            bounds: {
                l: 1000,
                r: 0,
                t: 1000,
                b: 0
            },

            debug: false
        };

        //TODO: move this to _ and replace me.legend
        // (adapt access: me.legend -> me.get("legend"))
        this.legend = null;

        this.get = function(key){

            return _[key];
        };
        this.set = function(key, value){
            _[key] = value;
        };
        // configure the moodmap when an instance gets created
        this.configure(config);
        // and initialize it

        // moodmap store containing the datapoints and information about the maximum
        // accessible via instance.store
        this.store = new store(this);

        this.init();
    };

    // public functions
    moodmap.prototype = {
        configure: function(config){
                var me = this,
                    rout, rin;

                me.set("radius", config["radius"] || 40);
                me.set("blur", config["blur"] || 30);
                var realRadius = (me.get("blur")/2 + me.get("radius")) >> 0;
                me.set("margin", config["margin"] || realRadius);
                me.set("element", (config.element instanceof Object)?config.element:document.getElementById(config.element));
                me.set("visible", (config.visible != null)?config.visible:true);
                me.set("max", config.max || 1);
                me.set("min", config.min || 0);
                me.set("gradient", config.gradient || {
                    0.45: "rgb(0,0,255)",
                    0.55: "rgb(0,255,255)",
                    0.65: "rgb(0,255,0)",
                    0.95: "yellow",
                    1.00: "rgb(255,0,0)"
                });
                me.set("opacity", parseInt(255/(100/config.opacity), 10) || 180);
                me.set("width", config.width || 0);
                me.set("height", config.height || 0);
                me.set("debug", config.debug);

                if(config.legend){
                    var legendCfg = config.legend;
                    legendCfg.gradient = me.get("gradient");
                    me.legend = new legend(legendCfg);
                }

        },
        resize: function () {
                var me = this,
                    element = me.get("element"),
                    canvas = me.get("canvas"),
                    acanvas = me.get("acanvas");
                canvas.width = acanvas.width = me.get("width") || element.style.width.replace(/px/, "") || me.getWidth(element);
                this.set("width", canvas.width);
                canvas.height = acanvas.height = me.get("height") || element.style.height.replace(/px/, "") || me.getHeight(element);
                this.set("height", canvas.height);
        },

        init: function(){
                var me = this,
                    canvas = document.createElement("canvas"),
                    acanvas = document.createElement("canvas"),
                    ctx = canvas.getContext("2d"),
                    actx = acanvas.getContext("2d"),
                    offset = me.get("drawingOffset"),
                    blur = me.get("blur"),
                    element = me.get("element");


                me.initColorPalette();

                me.set("canvas", canvas);
                me.set("ctx", ctx);
                me.set("acanvas", acanvas);
                me.set("actx", actx);

                me.resize();
                canvas.style.cssText = acanvas.style.cssText = "position:absolute;top:0;left:0;";

                if(!me.get("visible"))
                    canvas.style.display = "none";

                element.appendChild(canvas);
                if(me.legend){
                    element.appendChild(me.legend.getElement());
                }

                // debugging purposes only
                if(me.get("debug"))
                    document.body.appendChild(acanvas);

                actx.shadowOffsetX = offset;
                actx.shadowOffsetY = offset;
                actx.shadowBlur = blur;
        },
        initColorPalette: function(){

            var me = this,
                canvas = document.createElement("canvas"),
                gradient = me.get("gradient"),
                ctx, grad, testData;

            canvas.width = "1";
            canvas.height = "256";
            ctx = canvas.getContext("2d");
            grad = ctx.createLinearGradient(0,0,1,256);

            // Test how the browser renders alpha by setting a partially transparent pixel
            // and reading the result.  A good browser will return a value reasonably close
            // to what was set.  Some browsers (e.g. on Android) will return a ridiculously wrong value.
            testData = ctx.getImageData(0,0,1,1);
            testData.data[0] = testData.data[3] = 64; // 25% red & alpha
            testData.data[1] = testData.data[2] = 0; // 0% blue & green
            ctx.putImageData(testData, 0, 0);
            testData = ctx.getImageData(0,0,1,1);
            me.set("premultiplyAlpha", (testData.data[0] < 60 || testData.data[0] > 70));

            for(var x in gradient){
                grad.addColorStop(x, gradient[x].color);
            }

            ctx.fillStyle = grad;
            ctx.fillRect(0,0,1,256);

            me.set("palette", ctx.getImageData(0,0,1,256).data);
        },
        getWidth: function(element){
            var width = element.offsetWidth;
            if(element.style.paddingLeft){
                width+=element.style.paddingLeft;
            }
            if(element.style.paddingRight){
                width+=element.style.paddingRight;
            }

            return width;
        },
        getHeight: function(element){
            var height = element.offsetHeight;
            if(element.style.paddingTop){
                height+=element.style.paddingTop;
            }
            if(element.style.paddingBottom){
                height+=element.style.paddingBottom;
            }

            return height;
        },
        colorize: function(x, y){
                // get the private variables
                var me = this,
                    width = me.get("width"),
                    radius = me.get("radius"),
                    blur = me.get("blur"),
                    height = me.get("height"),
                    actx = me.get("actx"),
                    ctx = me.get("ctx"),
                    realRadius = radius + blur,
                    premultiplyAlpha = me.get("premultiplyAlpha"),
                    palette = me.get("palette"),
                    opacity = me.get("opacity"),
                    bounds = me.get("bounds"),
                    max = me.store.max,
                    left, top, bottom, right,
                    image, imageData, length, alpha, offset, finalAlpha;

                var bounds = {}
                if(x != null && y != null){
                    bounds = this._getBoundsForCircleAtPoint(x, y);
                }else{
                    bounds = this._getBounds();
                }
                left = bounds.left;
                right = bounds.right;
                top = bounds.top;
                bottom = bounds.bottom;


                image = actx.getImageData(left, top, right-left, bottom-top);
                imageData = image.data;
                length = imageData.length;
                // loop thru the area
                for(var i=3; i < length; i+=4){

                    // [0] -> r, [1] -> g, [2] -> b, [3] -> alpha
                    alpha = imageData[i],
                    offset = alpha*4;

                    if(!offset)
                        continue;

                    offset = imageData[i-2] * 4;


                    // TODO: replace magic number 2 * finalAlpha --> increase visibility of circles

                    // we ve started with i=3
                    // set the new r, g and b values
                    finalAlpha = (alpha < opacity)?alpha:opacity;
                    finalAlpha = Math.min(255, Math.round(finalAlpha * 2));
                    imageData[i-3]=palette[offset];
                    imageData[i-2]=palette[offset+1];
                    imageData[i-1]=palette[offset+2];

                    if (premultiplyAlpha) {
                        // To fix browsers that premultiply incorrectly, we'll pass in a value scaled
                        // appropriately so when the multiplication happens the correct value will result.
                        imageData[i-3] /= 255/finalAlpha;
                        imageData[i-2] /= 255/finalAlpha;
                        imageData[i-1] /= 255/finalAlpha;
                    }

                    // we want the moodmap to have a gradient from transparent to the colors
                    // as long as alpha is lower than the defined opacity (maximum), we'll use the alpha value
                    imageData[i] = finalAlpha;
                }
                // the rgb data manipulation didn't affect the ImageData object(defined on the top)
                // after the manipulation process we have to set the manipulated data to the ImageData object
                image.data = imageData;
                ctx.putImageData(image, left, top);
        },
        _moodToRedGreen: function(mood) {
            var me = this,
                max = me.store.max,
                range = Math.abs(me.store.max - me.store.min),
                green = ((mood + max)/range)*255,
                red = 255 - green;
            return {
                red: this._sanitizeColorValue(red),
                green: this._sanitizeColorValue(green)
            }
        },
        _redGreenToMood: function(red, green) {
            var me = this,
                max = me.store.max,
                range = Math.abs(me.store.max - me.store.min);
            return ((green * range) / 255) - max;
        },
        _sanitizeColorValue: function(colorValue){
            return Math.max(
                0,
                Math.min(
                    255,
                    Math.round(colorValue)
                )
            )
        },
        drawCircle: function(context, x, y, color) {
            //draw circle outside of canvas and only show blured shadow
            var offset = this.get("drawingOffset"),
                radius = this.get("radius"),
                blur = this.get("blur");

            context.shadowBlur = blur;
            context.shadowOffsetX = offset;
            context.shadowOffsetY = offset;

            //set the shadow colour to that of the fill:
            context.shadowColor = color;

            context.beginPath();
            context.arc(x - offset,y - offset,radius,0,Math.PI*2,true);
            context.fill();
            context.closePath();
        },

        _getBoundsForCircleAtPoint: function(x, y){
            var me = this,
                width = me.get("width"),
                height = me.get("height"),
                blur = me.get("blur"),
                radius = me.get("radius"),
                realRadius = radius + blur;
            return {
                left:   Math.max(0,      x-realRadius),
                right:  Math.min(width,  x+realRadius),
                top:    Math.max(0,      y-realRadius),
                bottom: Math.min(height, y+realRadius),
            };
        },

        _getBounds: function(){
            var me = this,
                width = me.get("width"),
                height = me.get("height");
                bounds = me.get("bounds");
            return {
                left:   Math.max(0,      bounds['l']),
                right:  Math.min(width,  bounds['r']),
                top:    Math.max(0,      bounds['t']),
                bottom: Math.min(height, bounds['b'])
            };
        },

        /* because of the margin, x and y must be converted for drawing
         * using this ratios
         */
        getRealPositionToDrawingPositionRatios: function(x, y){
            var me = this,
                margin = me.get("margin"),
                width = me.get("width"),
                height = me.get("height"),
                drawingWidth = width - 2*margin,
                drawingHeight = height - 2*margin;
            return {
                x: drawingWidth / width,
                y: drawingHeight / height
            }
        },

        /* because of the margin, x and y cannot be used directly to draw
         * a point
         */
        getDrawingPosition: function(x, y){
            var ratios = this.getRealPositionToDrawingPositionRatios(x, y),
                margin = this.get("margin");
            return {
                x: ((x + margin) * ratios.x) >> 0,
                y: ((y + margin) * ratios.y) >> 0
            }
        },

        /* because of the margin, x and y in the canvas must be converted
         * to look them up in the original data
         */
        getOriginalPosition: function(drawingX, drawingY){
            var ratios = this.getRealPositionToDrawingPositionRatios(x, y),
                margin = this.get("margin");
            return {
                x: ((drawingX / ratios.x) - margin) >> 0,
                y: ((drawingY + ratios.y) - margin) >> 0
            }
        },

        drawAlpha: function(x, y, mood, redraw_colors){
                // storing the variables because they will be often used
                var me = this,
                    ctx = me.get("actx"),
                    drawingPosition = me.getDrawingPosition(x, y),
                    redGreen = me._moodToRedGreen(mood),
                    shadowColor = 'rgba(' +
                        redGreen.red + ',' +
                        redGreen.green + ',' +
                        0 + ',' +   // we are bicolor, no blue here
                        0.5 +       // treat all layers equally
                    ')';

                this.drawCircle(ctx, drawingPosition.x, drawingPosition.y, shadowColor);

                if(redraw_colors){
                    // finally colorize the area
                    me.colorize(drawingPosition.x, drawingPosition.y);
                }else{
                    // or update the boundaries for the area that then should be colorized
                    var bounds = me.get("bounds"),
                        radius = me.get("radius"),
                        blur = me.get("blur"),
                        realRadius = (radius + (blur/2))>>0,
                        left = drawingPosition.x - realRadius,
                        top = drawingPosition.y - realRadius,
                        right = drawingPosition.x + realRadius,
                        bottom = drawingPosition.y + realRadius;
                    if(left < bounds["l"]) bounds["l"] = left;
                    if(top < bounds["t"]) bounds["t"] = top;
                    if(right > bounds['r']) bounds['r'] = right;
                    if(bottom > bounds['b']) bounds['b'] = bottom;
                }
        },
        toggleDisplay: function(){
                var me = this,
                    visible = me.get("visible"),
                canvas = me.get("canvas");

                if(!visible)
                    canvas.style.display = "block";
                else
                    canvas.style.display = "none";

                me.set("visible", !visible);
        },
        // dataURL export
        getImageData: function(){
                return this.get("canvas").toDataURL();
        },
        clear: function(){
            var me = this,
                w = me.get("width"),
                h = me.get("height");

            me.store.set("data",[]);
            me.store.max = me.get("max");
            me.store.min = me.get("min");
            me.get("ctx").clearRect(0,0,w,h);
            me.get("actx").clearRect(0,0,w,h);
        },
        cleanup: function(){
            var me = this;
            me.get("element").removeChild(me.get("canvas"));
        }
    };

    return {
            create: function(config){
                return new moodmap(config);
            },
            util: {
                mousePosition: function(ev){
                    // this doesn't work right
                    // rather use
                    /*
                        // this = element to observe
                        var x = ev.pageX - this.offsetLeft;
                        var y = ev.pageY - this.offsetTop;

                    */
                    var x, y;

                    if (ev.layerX) { // Firefox
                        x = ev.layerX;
                        y = ev.layerY;
                    } else if (ev.offsetX) { // Opera
                        x = ev.offsetX;
                        y = ev.offsetY;
                    }
                    if(typeof(x)=='undefined')
                        return;

                    return [x,y];
                }
            }
        };
    })();
    w.moodmapFactory = moodmapFactory;
})(window);
