import { CommonTerrain } from './CommonTerrain';
import { Tile } from './Tile';

import { EPSG4326TileSet } from './EPSG4326TileSet';
import { EPSG3857TileSet } from './EPSG3857TileSet';

import { Frustum, Matrix4 } from '../Three';
import { dataURL } from '../core/lib';

const __frustum = new Frustum();
const __matrix4 = new Matrix4();

const __startEvent = { type: 'progress', name: 'start' };
const __endEvent = { type: 'progress', name: 'end' };

function __sortTilesByPressure( tileA, tileB ) {

	const zoomDiff = tileB.zoom - tileA.zoom;

	if ( zoomDiff !== 0 ) {

		return zoomDiff;

	}

	const frameDiff = tileA.lastFrame - tileB.lastFrame;

	if ( frameDiff !== 0 ) {

		return frameDiff;

	}

	const xDiff = tileA.x - tileB.x;

	return ( xDiff !== 0 ) ? xDiff : tileA.y - tileB.y;

}

class WebTerrain extends CommonTerrain {

	constructor ( ctx, survey, onLoaded ) {

		super( ctx );

		this.name = 'WebTerrain';
		this.type = 'CV.WebTerrain';
		this.attributions = [];
		this.log = false;
		this.ctx = ctx;

		this.displayCRS = survey.displayCRS;
		this.surveyCRS = survey.CRS;
		this.limits = survey.limits;
		this.flatZ = survey.modelLimits.max.z;
		this.offsets = survey.offsets;

		this.onLoaded        = onLoaded;
		this.childrenLoading = 0;
		this.childErrors     = 0;
		this.isLoaded        = false;
		this.material        = null;
		this.initialZoom     = null;
		this.dying = false;
		this.tilesLoading = 0;
		this.maxTilesLoading = 0;
		this.overlaysLoading = 0;
		this.debug = true;
		this.coverage = null;
		this.TS = null;
		this.maxTiles = ctx.cfg.value( 'maxTiles', 128 );

		// tile zoom properties
		this.retile_timeout = 80;
		this.retileScaler = 4;
		this.lastActivityTime = 0;
		this.timerId = null;

		this.material = ctx.materials.getCursorMaterial();
		this.canZoom = true;

		this.watcher = this.scheduleRetile.bind( this );
		this.updateFunc = WebTerrain.prototype.zoomCheck.bind( this );

		let promise;

		switch ( this.displayCRS ) {

		case 'EPSG:3857':

			promise = new EPSG3857TileSet( ctx );
			break;

		case 'EPSG:4326':
		case 'ORIGINAL':

			promise = new EPSG4326TileSet( ctx, this.surveyCRS );
			break;

		default:

			onLoaded( this );
			return;

		}

		promise.then( TS => {

			this.workerPool = ctx.workerPools.getPool( TS.workerScript() );
			this.TS = TS;
			this.tileSets = TS.getTileSets();
			this.screenAttribution = TS.getScreenAttribution();

			if ( this.hasCoverage() ) {

				this.tileArea( this.limits );

			} else {

				console.log( 'no terrain found' );
				onLoaded( this );

			}

		} ).catch( () => {

			console.log( 'error loading tile set' );

		} );

		return;

	}

}

WebTerrain.prototype.isTiled = true;

WebTerrain.prototype.hasCoverage = function () {

	// iterate through available tileSets and pick the first match

	const limits = this.limits;
	const baseDirectory = this.ctx.cfg.value( 'terrainDirectory', '' );
	const tileSets = this.tileSets;
	const TS = this.TS;

	for ( let i = 0, l = tileSets.length; i < l; i++ ) {

		const tileSet = tileSets[ i ];

		if ( tileSet.valid === false ) continue;

		const coverage = TS.getCoverage( limits, tileSet.minZoom );

		if (
			coverage.minX >= tileSet.minX &&
			coverage.maxX <= tileSet.maxX &&
			coverage.minY >= tileSet.minY &&
			coverage.maxY <= tileSet.maxY
		) {

			tileSet.directory = baseDirectory + tileSet.subdirectory;

			TS.tileSet = tileSet;

			this.isFlat = tileSet.isFlat;
			this.log = tileSet.log === undefined ? false : tileSet.log;
			this.attributions = tileSet.attributions;

			console.log( 'selected tile set:', tileSet.title );

			return true;

		}

	}

	return false;

};

WebTerrain.prototype.loadTile = function ( x, y, z, parentTile, existingTile ) {

	if ( existingTile === undefined ) {

		existingTile = parentTile.children.find( function ( tile ) {
			return ( tile.x === x && tile.y === y && tile.zoom === z );
		} );

	}

	const self = this;
	const tileSpec = this.TS.getTileSpec( x, y, z, this.limits );

	if ( tileSpec === null ) return;

	tileSpec.offsets = this.offsets,
	tileSpec.flatZ = this.flatZ;

	if ( this.tilesLoading === 0 ) {

		this.dispatchEvent( __startEvent );
		this.maxTilesLoading = 0;

	}

	this.maxTilesLoading = Math.max( this.maxTilesLoading, ++this.tilesLoading );

	if ( this.log ) console.log( 'load: [ ', z +'/' + x + '/' + y, ']', this.tilesLoading );

	// get Tile instance.

	const tile = existingTile ? existingTile : new Tile( this.ctx, x, y, z, tileSpec );

	tile.setPending( parentTile ); // tile load/reload pending

	this.workerPool.runWorker( tileSpec, _mapLoaded );

	return;

	function _mapLoaded ( tileData ) {

		--self.tilesLoading;

		// the survey/region in the viewer may have changed while the height maps are being loaded.
		// bail out in this case to avoid errors

		if ( self.dying ) {

			self.dispatchEvent( __endEvent );
			return;

		}

		if ( tileData.status === 'zoom' ) {

			tile.setSkipped();
			self.zoomTile( tile, tile.parent );

			return;

		}

		// error out early if we or other tiles have failed to load.

		if ( tileData.status !== 'ok' || tile.parent.childErrors !== 0 ) {

			tile.setFailed();

			// signal error to caller
			if ( self.tilesLoading === 0 && ! self.isLoaded ) {

				self.onLoaded( self );

			}

			self.dispatchEvent( __endEvent );

			return;

		}

		tile.createFromTileData( tileData, self.material );

		self.dispatchEvent( { type: 'progress', name: 'set', progress: 100 * ( self.maxTilesLoading - self.tilesLoading ) / self.maxTilesLoading } );

		tile.setLoaded( self.activeOverlay, _loaded );

	}

	function _loaded ( canZoom ) {

		if ( canZoom && self.activeOverlay !== null && tile.zoom < self.activeOverlay.getMinZoom() ) {

			self.zoomTile( tile );

		}

		if ( self.tilesLoading !== 0 ) return;

		self.dispatchEvent( __endEvent );

		if ( ! self.isLoaded ) {

			self.isLoaded = true;
			self.onLoaded( self );

		}

	}

};

WebTerrain.prototype.tileArea = function ( limits ) {

	const tileSet = this.TS.tileSet;

	let zoom = tileSet.initialZoom || tileSet.overlayMaxZoom + 1;
	let coverage;

	do {

		coverage = this.TS.getCoverage( limits, --zoom );

	} while ( coverage.count > 4 && zoom > tileSet.minZoom );


	this.initialZoom = zoom;
	this.coverage = coverage;

	for ( let x = coverage.minX; x < coverage.maxX + 1; x++ ) {

		for ( let y = coverage.minY; y < coverage.maxY + 1; y++ ) {

			this.loadTile( x, y, zoom, this );

		}

	}

};

WebTerrain.prototype.tileSet = function () {

	const tileSet = Object.assign( {}, EPSG3857TileSet.defaultTileSet );
	const coverage = this.coverage;

	delete tileSet.isFlat;
	delete tileSet.directory;

	tileSet.title = 'new tile set';
	tileSet.subdirectory = 'new_tile_set';

	tileSet.minZoom = coverage.zoom;

	tileSet.minX = coverage.minX;
	tileSet.maxX = coverage.maxX;
	tileSet.minY = coverage.minY;
	tileSet.maxY = coverage.maxY;

	return dataURL( tileSet );

};

WebTerrain.prototype.zoomTile = function ( tile, parent = tile ) {

	const zoom = tile.zoom + 1;
	const x = tile.x * 2;
	const y = tile.y * 2;

	this.loadTile( x,     y,     zoom, parent );
	this.loadTile( x + 1, y,     zoom, parent );
	this.loadTile( x,     y + 1, zoom, parent );
	this.loadTile( x + 1, y + 1, zoom, parent );

};

WebTerrain.prototype.setOverlay = function ( overlay, overlayLoadedCallback ) {

	if ( this.tilesLoading > 0 ) return;

	const currentOverlay = this.activeOverlay;
	const throughMode = overlay.throughMode;

	if ( currentOverlay !== null ) {

		if ( currentOverlay === overlay ) {

			this.traverse( tile => tile.setThroughMode( throughMode ) );

			return;

		} else {

			currentOverlay.setInactive();

		}

	}

	overlay.setActive();

	this.activeOverlay = overlay;

	const overlayMinZoom = overlay.getMinZoom();

	this.traverse( tile => {

		if ( ! tile.isTile || ! tile.isMesh ) return;

		if ( tile.zoom < overlayMinZoom ) {

			// no overlay for this zoom layer, zoom to next level
			this.zoomTile( tile );

		} else {

			this.overlaysLoading++;
			tile
				.setOverlay( overlay )
				.then(
					() => { if ( --this.overlaysLoading === 0 ) overlayLoadedCallback(); }
				);

		}

	} );

};

WebTerrain.prototype.removed = function () {

	this.dying = true;

	this.traverse( obj => { if ( obj !== this ) obj.removed( obj ); } );

	this.commonRemoved();

};

WebTerrain.prototype.setMaterial = function ( material ) {

	if ( this.tilesLoading > 0 ) return;

	this.traverse( obj => { if ( obj.isTile ) obj.setMaterial( material ); } );

	this.activeOverlay = null;

	material.needsUpdate = true;
	material.fog = false;

	this.material = material;

};


WebTerrain.prototype.zoomCheck = function ( cameraManager ) {

	if ( performance.now() - this.lastActivityTime < this.retile_timeout ) return;
	if ( this.tilesLoading > 0 ) return true;

	const self = this;
	const frustum = __frustum;
	const camera = cameraManager.activeCamera;
	const lastFrame = cameraManager.getLastFrame();

	const candidateTiles      = [];
	const candidateEvictTiles = [];
	const resurrectTiles      = [];

	let retry = false;

	frustum.setFromProjectionMatrix( __matrix4.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );

	// scan scene graph of terrain

	this.traverse( _scanTiles );

	const resurrectCount = resurrectTiles.length;
	const candidateCount = candidateTiles.length;
	const candidateEvictionCount = candidateEvictTiles.length;

	// evict offsreen tiles

	let evictTarget = Tile.liveTiles - self.maxTiles;

	if ( Math.min( candidateEvictionCount, evictTarget ) > 0 ) {

		candidateEvictTiles.sort( __sortTilesByPressure );

		const now = performance.now();
		const l = candidateEvictTiles.length;

		for ( let i = 0; i < l; i++ ) {

			const tile = candidateEvictTiles[ i ];

			if ( tile.evictionCount === 0 ) {

				tile.evictionCount = now;

			} else if ( now - tile.evictionCount > 1000 ) {

				tile.evict();
				if ( --evictTarget ) break;

			}

		}

	}

	if ( resurrectCount !== 0 ) {

		// resurrect old tiles

		for ( let i = 0; i < resurrectCount; i++ ) {

			const tile = resurrectTiles[ i ];

			// reload tile (use exiting tile object to preserve canZoom).
			this.loadTile( tile.x, tile.y, tile.zoom, tile.parent, tile );

		}

		retry = true;

	} else if ( candidateCount !== 0 ) {

		// or zoom into area

		for ( let i = 0; i < candidateCount; i++ ) {

			this.zoomTile( candidateTiles[ i ] );

		}

		retry = true;

	}

	if ( retry ) {

		this.timerId = setTimeout( this.updateFunc, this.retile_timeout * this.retileScaler, cameraManager );
		this.retileScaler *= 2;

	}

	return;

	function _scanTiles( tile ) {

		const parent = tile.parent;

		if ( ! tile.isTile || ! parent.canZoom ) return;

		if ( tile.isMesh && tile.canZoom && tile.lastFrame === lastFrame ) {

			// this tile intersects the screen

			// this tile is loaded, maybe increase resolution?
			// now safe if tile has evicted children or not

			tile.computeProjectedArea( camera );
			if ( tile.area / 4 > 0.81 ) candidateTiles.push( tile );

		} else if ( ! parent.isMesh && tile.evicted && frustum.intersectsBox( tile.worldBoundingBox ) ) {

			// this tile is not loaded, but has been previously

			// flag subtiles to prevent premature resurrection
			// and indicate replaced by superior

			tile.traverse( function ( subtile ) {

				if ( subtile === tile ) return; // ignore this tile
				subtile.evicted = false;
				subtile.replaced = true;

			} );

			resurrectTiles.push( tile );

		} else {

			// off screen tile
			if ( tile.isMesh && tile.lastFrame !== lastFrame ) candidateEvictTiles.push( tile );

		}

	}

};

WebTerrain.prototype.getHeights = function ( points, callback ) {

	const tileSet = this.TS;
	const tileSpecs = {};
	const results = [];

	// sort points in to requests per tile

	points.forEach( function ( point, i ) {

		const tileSpec = tileSet.findTile( point );
		const key = tileSpec.x + ':' + tileSpec.y + ':' + tileSpec.z;
		// index used to map point height results with starting points.
		point.index = i;

		if ( tileSpecs[ key ] === undefined ) {

			// new tile query
			tileSpecs[ key ] = tileSpec;

		} else {

			// merge requested point with existing query
			tileSpecs[ key ].dataOffsets.push( tileSpec.dataOffsets[ 0 ] );
			tileSpecs[ key ].points.push( tileSpec.points[ 0 ] );

		}

	} );

	// dispatch requests

	let requestCount = 0;

	for ( const key in tileSpecs ) {

		this.workerPool.runWorker( tileSpecs[ key ], _mapLoaded );
		requestCount++;

	}

	return;

	function _mapLoaded ( data ) {

		// return worker to pool

		const resultPoints = data.points;

		resultPoints.forEach( point => results[ point.index ] = point );

		if ( --requestCount === 0 ) {

			callback( results );

		}

	}

};

WebTerrain.prototype.fitSurface = function ( modelPoints, offsets ) {

	if ( this.TS.findTile === undefined ) {

		this._fitSurface( modelPoints );
		return;

	}

	// adjust to geographical values
	const points = modelPoints.map( point => point.clone().add( offsets) );

	this.getHeights( points, ret => {

		let n = 0, s1 = 0, s2 = 0;

		ret.forEach( a => {

			const v = points[ a.index ].z - a.z;
			s1 += v;
			s2 += v * v;
			n++;

		} );

		const sd = Math.sqrt( s2 / n - Math.pow( s1 / n, 2 ) );

		// simple average
		this.datumShift = s1 / n;

		console.log( 'Adjustmenting terrain height by:', this.datumShift, 'sd:', sd );

	} );

};

WebTerrain.prototype.scheduleRetile = function ( event ) {

	if ( ! this.visible ) return;

	if ( this.timerId !== null ) clearTimeout( this.timerId );

	this.retileScaler = 4;
	this.lastActivityTime = performance.now();
	this.timerId = setTimeout( this.updateFunc, this.retile_timeout, event.cameraManager );

};


WebTerrain.prototype.watch = function ( obj ) {

	obj.addEventListener( 'moved', this.watcher );

};

WebTerrain.prototype.unwatch = function ( obj ) {

	obj.removeEventListener( 'moved', this.watcher );

};

export { WebTerrain };