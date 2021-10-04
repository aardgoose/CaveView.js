import { FileLoader, Box2, Vector2 } from '../Three';
import proj4 from 'proj4';

class EPSG4326TileSet {

	static workerScript = 'webMeshWorker.js';
	static defaultTileSet = {
		title: 'Cesium',
		initialZoom: 12,
		overlayMaxZoom: 16,
		maxZoom: 17,
		minZoom: 10,
		divisions: 1,
		subdirectory: null,
		dtmScale: 64,
		minX: 0,
		maxX: 2048,
		minY: 0,
		maxY: 1023,
		attributions: [],
		log: true,
		valid: false
	};

	constructor ( ctx, crs ) {

		this.CRS = crs;
		this.transform = proj4( crs, 'EPSG:4326' );

		// survey limits

		this.transformedLimits = null;

		const accessToken = ctx.cfg.value( 'cesiumAccessToken', 'no access token' );
		const url = 'https://api.cesium.com/v1/assets/1/endpoint?access_token=' + accessToken;

		return new Promise( ( resolve, reject ) => {

			new FileLoader().setResponseType( 'text' ).load(
				url,
				// success handler
				text => {

					const endpoint = JSON.parse( text );

					this.url = endpoint.url;
					this.accessToken = endpoint.accessToken;
					this.attributions = endpoint.attributions;

					EPSG4326TileSet.defaultTileSet.valid = true;
					resolve( this );

				},
				// progress handler
				function () {},
				// error handler
				() => { console.warn( 'cesium api error' ); reject( this ); }
			);

		} );

	}

	workerScript () {

		return EPSG4326TileSet.workerScript;

	}

	getTileSets () {

		return [ EPSG4326TileSet.defaultTileSet ];

	}

	getScreenAttribution () {

		const attributions = this.attributions;

		if ( attributions.length === 0 ) return null;

		const div = document.createElement( 'div' );

		div.classList.add( 'overlay-branding' );

		for ( let i = 0; i < attributions.length; i++ ) {

			const attribution = attributions[ i ];

			div.innerHTML = attribution.html;
			break;

		}

		return div;

	}

	getCoverage ( limits, zoom ) {

		const coverage = { zoom: zoom };

		const S = - 90;
		const W = - 180;

		if ( this.transformedLimits === null ) {

			this.transformedLimits = new Box2();

		}

		const transformedLimits = this.transformedLimits;

		transformedLimits.expandByPoint( this.transform.forward( limits.min.clone() ) );
		transformedLimits.expandByPoint( this.transform.forward( limits.max.clone() ) );

		const min = transformedLimits.min;
		const max = transformedLimits.max;

		const tileCount = Math.pow( 2, zoom ) / 180; // tile count per degree

		coverage.minX = Math.floor( ( min.x - W ) * tileCount );
		coverage.maxX = Math.floor( ( max.x - W ) * tileCount );

		coverage.minY = Math.floor( ( min.y - S ) * tileCount );
		coverage.maxY = Math.floor( ( max.y - S ) * tileCount );

		coverage.count = ( coverage.maxX - coverage.minX + 1 ) * ( coverage.maxY - coverage.minY + 1 );

		return coverage;

	}

	getTileSpec ( x, y, z, limits ) {

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

		const clippedSize = new Vector2();

		tileBox.clone().intersect( this.transformedLimits ).getSize( clippedSize );

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
			clippedFraction: clippedSize.x * clippedSize.y / tileSize * tileSize,
			request: 'tile'
		};

	}

}

export { EPSG4326TileSet };