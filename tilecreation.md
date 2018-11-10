---
title: Tile Creation
---
# Tile Creation

## Requirements

Grass GIS: An open source GIS package available at [https://grass.osgeo.org/]. Tested with version 7.4.
Node.js: An open source Javascript runtime available from [https://nodejs.org/]. Tested with version 10.13.

The two scripts:

[makeRasters.js](https://github.com/aardgoose/CaveView.js/blob/dev/tools/makeRasters.js)
[makeTiles.js](https://github.com/aardgoose/CaveView.js/blob/dev/tools/makeRasters.js)

A Survex cave model, with a specified coordinate reference system (CRS). Currently the CRS of the model must be a standard [proj4](https://proj4.org/) definition. The site [http://spatialreference.org/] is useful for finding PROJ4 strings for any CRS.
The CRS of a model is specified by using the Survex "*CS OUT" command in a .svx file.



