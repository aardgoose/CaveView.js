
function EPSG4326TileSet( ) {}

EPSG4326TileSet.defaultTileSet = {
	title: 'Cesium',
	dtmMaxZoom: 14,
	maxZoom: 14,
	minZoom: 10,
	divisions: 1,
	directory: null,
	subdirectory: null,
	dtmScale: 64,
	minX: 0,
	maxX: 1023,
	minY: 0,
	maxY: 1023,
	attributions: [],
	log: true
};

EPSG4326TileSet.prototype.getCoverage = function ( limits, zoom ) {

	const coverage = { zoom: zoom };

	const S =  -90;
	const W = -180;

	const tileCount = Math.pow( 2, zoom ) / 180; // tile count per degree

	coverage.min_x = Math.floor( ( limits.min.x - W ) * tileCount );
	coverage.max_x = Math.floor( ( limits.max.x - W ) * tileCount );

	coverage.min_y = Math.floor( ( limits.min.y - S ) * tileCount );
	coverage.max_y = Math.floor( ( limits.max.y - S ) * tileCount );

	coverage.count = ( coverage.max_x - coverage.min_x + 1 ) * ( coverage.max_y - coverage.min_y + 1 );

	return coverage;

};

EPSG4326TileSet.prototype.getTileSpec = function ( x, y, z /* limits */ ) {

	// trim excess off sides of tile where overlapping with region

	return {
		tileSet: this.tileSet,
		divisions: 1,
		resolution: 180 / Math.pow( 2, z ),
		x: x,
		y: y,
		z: z,
		clip: { top: 0, bottom: 0, left: 0, right: 0 },
		offsets: null,
		flatZ: null
	};

};


export { EPSG4326TileSet };

// EOF