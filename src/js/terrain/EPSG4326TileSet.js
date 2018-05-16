
function EPSG4326TileSet( crs ) {

	this.CRS = crs;
	this.transform = proj4( crs, 'EPSG:4326' ); // eslint-disable-line no-undef

}

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

EPSG4326TileSet.prototype.workerScript = 'webMeshWorker.js';

EPSG4326TileSet.prototype.getCoverage = function ( limits, zoom ) {

	const coverage = { zoom: zoom };

	const S = - 90;
	const W = - 180;

	const min = limits.min.clone();
	const max = limits.max.clone();

	min.copy( this.transform.forward( min ) );
	max.copy( this.transform.forward( max ) );

	//console.log( min );
	//console.log( max );

	const tileCount = Math.pow( 2, zoom ) / 180; // tile count per degree

	coverage.min_x = Math.floor( ( min.x - W ) * tileCount );
	coverage.max_x = Math.floor( ( max.x - W ) * tileCount );

	coverage.min_y = Math.floor( ( min.y - S ) * tileCount );
	coverage.max_y = Math.floor( ( max.y - S ) * tileCount );

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
		flatZ: null,
		displayCRS: this.CRS
	};

};


export { EPSG4326TileSet };

// EOF