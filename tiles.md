---
title: Terrain Tiles
---

# Terrain Tiles

## Introduction

CaveView can display Digital Terrain Models (DTM) over a cave model. The terrain model can then be overlayed with mapping imagery from other sources. To minimize loading times and support high DTM resolutions the terrain is tiled in much the same way 2D maps are tiled in OpenStreetMap and similar products.

CaveView supports two DTM tile formats:

* Custom tiles
* Cesium&reg; terrain tiles

### Custom Tiles

The custom tile format supported uses the same [Slippy Map](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames) tiling scheme as OpenStreetMap. The default DTM resolution is tile size ( width or height ) / 127. By creating DTM Tiles for a range of zoom levels, high resolution terrains can be displayed efficiently. Note: because of the nature of the [Web Mercator](https://epsg.io/3857) projection used by Slippy Maps, the x and y resolutions vary by latitude.

#### Tile File Format

The tile format used is a simple sequence of 16 bit unsigned integers. The DTM height grid is in row major order. Heights ( in metres )  are multiplied by a scale factor ( by default 64 ) and rounded, to allow a vertical resolution better than 1m to be obtained.

#### Tile Creation

Tile can be created using a combination of open source GIS tools and simple node.js scripts in the CaveView git repository. The process is documented [here](tilecreation.html).

### Cesium&reg; Tiles

The Cesium World Terrain data is availble at no cost or low data requirements and non-commercial projects.  This data covers the entire globe at various resolutions, and uses a publically [documented](https://github.com/AnalyticalGraphicsInc/quantized-mesh) triangulated mesh format to provide simplified terrain tiles. Use of Cesium tiles is documented [here](cesiumtiles.html).

