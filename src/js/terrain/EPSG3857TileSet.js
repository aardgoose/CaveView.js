const halfMapExtent = 6378137 * Math.PI; // from EPSG:3875 definition

let tileSets;

class EPSG3857TileSet {

	static workerScript = 'webTileWorker.js';
	static defaultTileSet = {
		isFlat: true,
		title: 'flat',
		overlayMaxZoom: 18,
		maxZoom: 18,
		minZoom: 10,
		divisions: 128,
		subdirectory: null,
		dtmScale: 64,
		minX: 0,
		maxX: 1023,
		minY: 0,
		maxY: 1023,
		attributions: [],
		log: true
	};

	constructor ( ctx ) {

		tileSets = [ EPSG3857TileSet.defaultTileSet ];

		return fetch( ctx.cfg.value('terrainDirectory', '') + '/' + 'tileSets.json' )
			.then( response => {
				return response.ok ? response.json() : [];
			} ).then( ts => {
				tileSets = ts.concat( tileSets );
				return this;
			}, () => { return this; } );

	}

	workerScript () {

		return EPSG3857TileSet.workerScript;

	}

	getTileSets () {

		return tileSets;

	}

	getScreenAttribution () {

		return null;

	}

	getCoverage ( limits, zoom ) {

		const coverage = { zoom: zoom };

		const N = halfMapExtent;
		const W = -halfMapExtent;

		const tileCount = Math.pow( 2, zoom - 1 ) / halfMapExtent; // tile count per metre

		coverage.minX = Math.floor( ( limits.min.x - W ) * tileCount);
		coverage.maxX = Math.floor( ( limits.max.x - W ) * tileCount);

		coverage.maxY = Math.floor( ( N - limits.min.y ) * tileCount);
		coverage.minY = Math.floor( ( N - limits.max.y ) * tileCount);

		coverage.count = ( coverage.maxX - coverage.minX + 1 ) * ( coverage.maxY - coverage.minY + 1 );

		return coverage;

	}

	getTileSpec ( x, y, z, limits ) {

		const tileSet = this.tileSet;
		const scale = ( z > tileSet.maxZoom ) ? Math.pow( 2, tileSet.maxZoom - z ) : 1;

		// don't zoom in with no overlay - no improvement of terrain rendering in this case

		if ( scale !== 1 && this.activeOverlay === null ) return null;

		if ( this.log ) console.log('load: [ ', z + '/' + x + '/' + y, ']');

		const tileWidth = halfMapExtent / Math.pow( 2, z - 1 );

		const clip = { top: 0, bottom: 0, left: 0, right: 0 };

		const tileMinX = tileWidth * x - halfMapExtent;
		const tileMaxX = tileMinX + tileWidth;

		const tileMaxY = halfMapExtent - tileWidth * y;
		const tileMinY = tileMaxY - tileWidth;

		const divisions = ( tileSet.divisions ) * scale;
		const resolution = tileWidth / divisions;

		// trim excess off sides of tile where overlapping with region

		if ( tileMaxY > limits.max.y ) clip.top = Math.floor( ( tileMaxY - limits.max.y ) / resolution);

		if ( tileMinY < limits.min.y ) clip.bottom = Math.floor( ( limits.min.y - tileMinY ) / resolution);

		if ( tileMinX < limits.min.x ) clip.left = Math.floor( ( limits.min.x - tileMinX ) / resolution);

		if ( tileMaxX > limits.max.x ) clip.right = Math.floor( ( tileMaxX - limits.max.x ) / resolution);

		if ( clip.top >= divisions || clip.bottom >= divisions || clip.left >= divisions || clip.right >= divisions ) return null;

		const clippedFraction = ( divisions - clip.top - clip.bottom ) * ( divisions - clip.left - clip.right ) / (divisions * divisions );

		return {
			tileSet: tileSet,
			divisions: divisions,
			resolution: resolution,
			x: x,
			y: y,
			z: z,
			clip: clip,
			offsets: null,
			flatZ: null,
			clippedFraction: clippedFraction,
			request: 'tile'
		};

	}

	findTile ( point ) {

		const tileSet = this.tileSet;

		const tileWidth = halfMapExtent / Math.pow( 2, tileSet.maxZoom - 1 );

		const xTc = ( point.x + halfMapExtent ) / tileWidth;
		const yTc = ( halfMapExtent - point.y ) / tileWidth;

		const tileX = Math.floor( xTc );
		const tileY = Math.floor( yTc );
		const tileZ = tileSet.maxZoom;

		const offsetX = xTc - tileX;
		const offsetY = yTc - tileY;
		const samples = tileSet.divisions + 1;

		const dataOffset = Math.floor( samples * offsetX ) + samples * Math.floor( samples * offsetY );

		// construct a tileSpec for passing to web worker
		return {
			x: tileX,
			y: tileY,
			z: tileZ,
			tileSet: tileSet,
			dataOffsets: [ dataOffset ],
			points: [ point ],
			request: 'height',
			clip: {}
		};

	}

}

export { EPSG3857TileSet };