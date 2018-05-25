import { FileLoader, Vector2 } from '../Three';
import { Cfg } from '../core/lib';

function EPSG4326TileSet( tileSetReady, crs ) {

	this.CRS = crs;
	this.transform = proj4( crs, 'EPSG:4326' ); // eslint-disable-line no-undef

	const self = this;

	const accessToken = Cfg.value( 'cesiumAccessToken', 'no access token' );
	const url = 'https://api.cesium.com/v1/assets/1/endpoint?access_token=' + accessToken;

	new FileLoader().setResponseType( 'text' ).load( url, _getEndpoint, function () {}, _apiError );

	function _getEndpoint ( text ) {

		const endpoint = JSON.parse( text );

		self.url = endpoint.url;
		self.accessToken = endpoint.accessToken;

		tileSetReady();

	}

	function _apiError ( ) {

		console.warn( 'cesium api error' );

	}

}

EPSG4326TileSet.defaultTileSet = {
	title: 'Cesium',
	dtmMaxZoom: 16,
	maxZoom: 16,
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

EPSG4326TileSet.prototype.getTileSets = function () {

	return [ EPSG4326TileSet.defaultTileSet ];

};

EPSG4326TileSet.prototype.getCoverage = function () {

	const min = new Vector2();
	const max = new Vector2();

	return function getCoverage ( limits, zoom ) {

		this.limits = limits;

		const coverage = { zoom: zoom };

		const S = - 90;
		const W = - 180;

		min.copy( limits.min );
		max.copy( limits.max );

		min.copy( this.transform.forward( min ) );
		max.copy( this.transform.forward( max ) );

		const tileCount = Math.pow( 2, zoom ) / 180; // tile count per degree

		coverage.min_x = Math.floor( ( min.x - W ) * tileCount );
		coverage.max_x = Math.floor( ( max.x - W ) * tileCount );

		coverage.min_y = Math.floor( ( min.y - S ) * tileCount );
		coverage.max_y = Math.floor( ( max.y - S ) * tileCount );

		coverage.count = ( coverage.max_x - coverage.min_x + 1 ) * ( coverage.max_y - coverage.min_y + 1 );

		return coverage;

	};

}();

EPSG4326TileSet.prototype.getTileSpec = function ( x, y, z /* limits */ ) {

	// trim excess off sides of tile where overlapping with region

	return {
		tileSet: this.tileSet,
		divisions: 1,
		resolution: 180 / Math.pow( 2, z ),
		x: x,
		y: y,
		z: z,
		clip: this.limits,
		offsets: null,
		flatZ: null,
		displayCRS: this.CRS,
		url: this.url,
		accessToken: this.accessToken,
		clippedFraction: 1
	};

};


export { EPSG4326TileSet };

// EOF