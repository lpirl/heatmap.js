# heatmap.js
heatmap.js is a JavaScript library that can be used to generate web heatmaps with the html5canvas element based on your data.

## How it works
Heatmap instances contain a store in order to colorize the heatmap based on relative data, which means if you're adding only a single datapoint to the store it will be displayed as the hottest(red) spot, then adding another point with a higher count, it will dynamically recalculate.
The heatmaps are fully customizable - you're welcome to choose your own color gradient, change its opacity, datapoint radius and many more.

## How to use it
Just add heatmap.js to your webpage and it will create one global object called **heatmapFactory** which you also can access as **h337**.
This global object has a function **create** that takes one argument **config** (Object) and returns a heatmap instance.
At the configuration object you can specify the following properties in order to customize your heatmap instance:

- **radius** (optional) Number. That's the radius of a single datapoint in the heatmap** (measured in pixels). Default is 40
- **element** (required) String|HTMLelement. Either provide an element's id or the element itself which should contain the heatmap.
- **visible** (optional) Boolean. Whether the heatmap is visible or not. Default is true
- **gradient** (optional) Object. An object which contains colorstops from 0 to 1. Default is the standard heatmap gradient.
- **opacity** (optional) Number [0-100]. Opacity of the heatmap measured in percent.

Here is an example instanciation:

```javascript
var config = {
    "radius": 30,
    "element": "heatmapEl",
    "visible": true,
    "opacity": 40,
    "gradient": { 0.45: "rgb(0,0,255)", 0.55: "rgb(0,255,255)", 0.65: "rgb(0,255,0)", 0.95: "yellow", 1.0: "rgb(255,0,0)" }
};

var heatmap = heatmapFactory.create(config);
```

After creating the heatmap object you can set a dataset (import), add single datapoints and export the datapoints:

```javascript
// set a dataset
heatmap.store.setDataSet({
    max: 10,
    min: -10,
    data: [{x: 10, y: 20, count: 5}, ...]
});

// add a single datapoint
heatmap.store.addDataPoint(10, 20);

// export the dataset
var dataSet = heatmap.store.exportDataSet();
```

As you can see a heatmap instance contains a store which stores its datapoints.
A store has the following functions:

- **setDataSet(Object)** void. This initializes the heatmap with a dataset. The dataset object has to have the following structure: {max: <maximum count>, min: <minimum count>, data:[{x: <dataPointX>, y: <dataPointY>, count: <valueAtXY>},...]}
- **addDataPoint(Number, Number, [Number])** void. Adds a single datapoint to the store. First parameter is x, second parameter is y. Third parameter is the value, if not specified 1 will be used.
- **exportdataSet()** Object. Returns the store's data as an object with the same structure that the import object at setDataSet has.

## About min and max

This fork of heatmap.js does not automatically grow the bounds for the
data points.
The values specified as `min` and `max` will always be honored
for drawing the points, however, internally the data points will be
calculated accurately (may be exceeding `min` or `max`).

Suppose you configured your heatmap with `{max: 20, …}` and you do twice
a `addDataPoint(100, 100, 15)`. What will be drawn is a data point just
like you would have done `addDataPoint(100, 100, 20)` (because of the `max`).
*But* if you now do a `addDataPoint(100, 100, -15)`, a point just like a
`addDataPoint(100, 100, 15)` will be drawn.

## License
heatmap.js is dual-licensed under the MIT and the Beerware license, feel free to use it in your projects.

## Questions?
Feel free to contact me:
on my website [patrick-wied.at](http://www.patrick-wied.at "")
via twitter [@patrickwied](http://twitter.com/#!/patrickwied "")
or email [contact@patrick-wied.at](mailto:contact@patrick-wied.at "")
