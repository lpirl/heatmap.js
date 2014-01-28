# moodmap.js
moodmap.js is a JavaScript library that can be used to generate web heatmaps with the html5canvas element based on your data.
In addition to convetional heatmaps,
the moodmap can deal with negative values as well.

## How it works
Heatmap instances contain a store in order to colorize the moodmap based on relative data, which means if you're adding only a single datapoint to the store it will be displayed as the hottest(red) spot, then adding another point with a higher count, it will dynamically recalculate.
The moodmaps are fully customizable - you're welcome to choose your own color gradient, change its opacity, datapoint radius and many more.

## How to use it
Just add moodmap.js to your webpage and it will create one global object called **moodmapFactory**..
This global object has a function **create** that takes one argument **config** (Object) and returns a moodmap instance.
At the configuration object you can specify the following properties in order to customize your moodmap instance:

- **radius** (optional) Number. That's the radius of a single datapoint in the moodmap** (measured in pixels). Default is 40
- **element** (required) String|HTMLelement. Either provide an element's id or the element itself which should contain the moodmap.
- **visible** (optional) Boolean. Whether the moodmap is visible or not. Default is true
- **gradient** (optional) Object. An object which contains colorstops from 0 to 1. Default is the standard moodmap gradient.
- **opacity** (optional) Number [0-100]. Opacity of the moodmap measured in percent.

Here is an example instanciation:

```javascript
var config = {
    "radius": 30,
    "element": "moodmapEl",
    "visible": true,
    "opacity": 40,
    "gradient": { 0.45: "rgb(0,0,255)", 0.55: "rgb(0,255,255)", 0.65: "rgb(0,255,0)", 0.95: "yellow", 1.0: "rgb(255,0,0)" }
};

var moodmap = moodmapFactory.create(config);
```

After creating the moodmap object you can set a dataset (import), add single datapoints and export the datapoints:

```javascript
// set a dataset
moodmap.store.setDataSet({
    max: 10,
    min: -10,
    data: [{x: 10, y: 20, count: 5}, ...]
});

// add a single datapoint
moodmap.store.addDataPoint(10, 20);

// export the dataset
var dataSet = moodmap.store.exportDataSet();
```

As you can see a moodmap instance contains a store which stores its datapoints.
A store has the following functions:

- **setDataSet(Object)** void. This initializes the moodmap with a dataset. The dataset object has to have the following structure: {max: <maximum count>, min: <minimum count>, data:[{x: <dataPointX>, y: <dataPointY>, count: <valueAtXY>},...]}
- **addDataPoint(Number, Number, [Number])** void. Adds a single datapoint to the store. First parameter is x, second parameter is y. Third parameter is the value, if not specified 1 will be used.
- **exportdataSet()** Object. Returns the store's data as an object with the same structure that the import object at setDataSet has.

## About min and max

This fork of heatmap.js does not automatically grow the bounds for the
data points.
The values specified as `min` and `max` will always be honored
for drawing the points, however, internally the data points will be
calculated accurately (may be exceeding `min` or `max`).

Suppose you configured your moodmap with `{max: 20, …}` and you do twice
a `addDataPoint(100, 100, 15)`. What will be drawn is a data point just
like you would have done `addDataPoint(100, 100, 20)` (because of the `max`).
*But* if you now do a `addDataPoint(100, 100, -15)`, a point just like a
`addDataPoint(100, 100, 15)` will be drawn.

## License
moodmap.js is dual-licensed under the MIT and the Beerware license, feel free to use it in your projects.

## Questions?
Feel free to contact me.
