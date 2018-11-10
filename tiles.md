# Terrain Tiling

## Introduction

CaveView can display Digital Terrain Models (DTM) over a cave model. The terrain model can then be overlayed with mapping imagery from other sources. To minimize loading times and support high DTM resolutions the terrain is tiled in much the same way 2D maps are tiled in OpenStreetMap and similar products.

CaveView supports two DTM tile formats:

* Custom tiles
* Cesium&reg; terrain tiles.

### Custom Tiles

The custom tile format supported uses the same [Slippy Map](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames) tiling scheme as OpenStreetMap. The default DTM resolution is 
