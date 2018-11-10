---
title: Tile Creation
---
# Tile Creation

## Requirements

* A Survex cave model, with a specified coordinate reference system (CRS). Currently the CRS of the model must be a standard [proj4](https://proj4.org/) definition. The site [spatialreference.org](http://spatialreference.org/) is useful for finding PROJ4 strings for any CRS. The CRS of a model is specified by using the Survex "*CS OUT" command in a .svx file.
* A Digital Terrain Model (DTM) covering the area of your cave model.
* **GRASS GIS**: An open source GIS package available at [grass.osgeo.org](https://grass.osgeo.org/). Tested with version 7.4.
* **Node.js**: An open source Javascript runtime available from [nodejs.org](https://nodejs.org/). Tested with version 10.13.
* The two scripts: [makeRasters.js](https://github.com/aardgoose/CaveView.js/blob/dev/tools/makeRasters.js) & [makeTiles.js](https://github.com/aardgoose/CaveView.js/blob/dev/tools/makeRasters.js).

## Procedure

1. Tile Set Definition.

To define a tile set, you must determine the specifications of the Slippy Map tiles that will cover your cave model, at a suitable zoom level. CaveView displays the tiles required to cover your model in the Javascript console as:

`load: [ zoom/x/y ] `, where zoom, x and y are the tile zoom level, x and y coordinates.

Example:
```
load: [  16/32432/21247 ] ...
load: [  16/32432/21248 ] ...
load: [  16/32433/21247 ] ...
load: [  16/32433/21248 ] ...
```

The tile set is specified in a file tileSet.json which has the following format:

```javascript
[
	{
		"title": "Peak District",
		"dtmMaxZoom": 14, // maximum zoom level for terrain tiles
		"maxZoom": 19, // maximum zoom level for image overlays 
		"minZoom": 11, // minimum zoom level for terrain tiles
		"divisions": 128, // default grid size
		"directory": "",
		"subdirectory": "<directory name", // directory containing tile files
		"dtmScale": 64,  // scaling factor between 16 bit integers and metres.
		"minX": 1013, // miminmum x tile coordinate ( at zoom level minZoom )
		"maxX": 1014, // maximum x tile coordinate ( at zoom level minZoom )
		"minY": 663, // miminmum y tile coordinate ( at zoom level minZoom )
		"maxY": 665, // maximum y tile coordinate ( at zoom level minZoom )
		"attributions": [ // text to display to credit the source of the DTM data if required
			"attribution of data line 1", 
			"attribution of data line 2" 
 		],
		"log": true // display load: [ z/x/y ] messages in console
	},
]
```



