import { FileLoader, Box2 } from '../Three';
import { Cfg } from '../core/lib';
import proj4 from 'proj4';

function EPSG4326TileSet( tileSetReady, crs ) {

	this.CRS = crs;
	this.transform = proj4( crs, 'EPSG:4326' );

	// survey limits

	this.transformedLimits = null;

	const self = this;

	const accessToken = Cfg.value( 'cesiumAccessToken', 'no access token' );
	const url = 'https://api.cesium.com/v1/assets/1/endpoint?access_token=' + accessToken;


	new FileLoader().setResponseType( 'text' ).load( url, _getEndpoint, function () {}, _apiError );

	function _getEndpoint ( text ) {

		const endpoint = JSON.parse( text );

		self.url = endpoint.url;
		self.accessToken = endpoint.accessToken;
		self.attributions = endpoint.attributions;

		tileSetReady();

	}

	function _apiError ( ) {

		console.warn( 'cesium api error' );

	}

}

EPSG4326TileSet.defaultTileSet = {
	title: 'Cesium',
	overlayMaxZoom: 16,
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

EPSG4326TileSet.prototype.getScreenAttribution = function () {

	const attributions = this.attributions;

	if ( attributions.length === 0 ) return null;

	const div = document.createElement( 'div' );

	div.classList.add( 'overlay-branding' );

	for ( var i = 0; i < attributions.length; i++ ) {

		const attribution = attributions[ i ];

		const a = document.createElement( 'a' );
		const img = document.createElement( 'img' );

		img.src = attribution.image;

		a.textContent = attribution.text;
		a.href = attribution.url;
		a.target = '_blank';

		a.appendChild( img );

		div.appendChild( a );

	}

	return div;

};

EPSG4326TileSet.prototype.getCoverage = function ( limits, zoom ) {

	const coverage = { zoom: zoom };

	const S = - 90;
	const W = - 180;

	if ( this.transformedLimits === null ) {

		this.transformedLimits = new Box2();

	}

	const transformedLimits = this.transformedLimits;

	const min = transformedLimits.min;
	const max = transformedLimits.max;

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


EPSG4326TileSet.prototype.getTileSpec = function ( x, y, z, limits ) {

	const tileBox = new Box2();

	const S = - 90;
	const W = - 180;

	// ensure tile is within survey limits

	const tileSize = 180 / Math.pow( 2, z ); // tileSize

	tileBox.min.x = W + x * tileSize;
	tileBox.min.y = S + y * tileSize;

	tileBox.max.x = W + ( x + 1) * tileSize;
	tileBox.max.y = S + ( y + 1 ) * tileSize;

	if ( ! this.transformedLimits.intersectsBox( tileBox ) ) return null;

	return {
		tileSet: this.tileSet,
		divisions: 1,
		resolution: tileSize,
		x: x,
		y: y,
		z: z,
		clip: limits,
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