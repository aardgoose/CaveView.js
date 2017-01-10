import { CommonTerrain } from './CommonTerrain';
import { Tile } from './Tile';
import { TileSet } from './TileSet';
import { HUD } from '../hud/HUD';
import { WorkerPool } from '../workers/WorkerPool';
import { SHADING_OVERLAY, getEnvironmentValue } from '../core/constants';

import {
	Vector2, Frustum, Box2, Matrix4
} from '../../../../three.js/src/Three';

function TiledTerrain ( limits3, onLoaded ) {

	CommonTerrain.call( this );

	this.name = 'TiledTerrain';
	this.type = 'CV.TiledTerrain';

	this.limits = new Box2(

		new Vector2( limits3.min.x, limits3.min.y ),
		new Vector2( limits3.max.x, limits3.max.y )

	);

	this.tileSet         = Object.assign( {}, TileSet);
	this.tile        = null;

	this.onLoaded        = onLoaded;
	this.tilesLoading    = 0;
	this.loadedTiles     = [];
	this.errors          = 0;
	this.terrainLoaded   = false;
	this.replaceTileMesh = null;
	this.activeOverlay   = null;
	this.material        = null;
	this.initialResolution;
	this.currentLimits;
	this.dying = false;

	this.workerPool = new WorkerPool( 'tileWorker.js' );

	if ( HUD !== undefined ) {

		this.progressDial = HUD.getProgressDial();

	}

	this.tileSet.BASEDIR = getEnvironmentValue( 'terrainDirectory', '' ) + this.tileSet.BASEDIR;
	this.tileSet.OVERLAYDIR = getEnvironmentValue( 'terrainDirectory', '' ) + this.tileSet.OVERLAYDIR;

}

TiledTerrain.prototype = Object.create( CommonTerrain.prototype );

TiledTerrain.prototype.constructor = TiledTerrain;

TiledTerrain.prototype.isTiled = function () {

	return true;

};

TiledTerrain.prototype.isLoaded = function () {

	return this.terrainLoaded;

};

TiledTerrain.prototype.hasCoverage = function () {

	var limits  = this.limits;
	var tileSet = this.tileSet;

	return ( (limits.min.x >= tileSet.W && limits.min.x <= tileSet.E) || 
		(limits.max.x >= tileSet.W && limits.max.x <= tileSet.E) ) &&
		( (limits.min.y >= tileSet.S && limits.min.y <= tileSet.N) ||
		(limits.max.y >= tileSet.S && limits.max.y <= tileSet.N));

};

TiledTerrain.prototype.getCoverage = function ( limits, resolution ) {

	var tileSet  = this.tileSet;
	var coverage = { resolution: resolution };

	var N = tileSet.N;
	var W = tileSet.W;

	var tileWidth = ( tileSet.TILESIZE - 1 ) * resolution; 

	coverage.min_x = Math.max( Math.floor( ( limits.min.x - W ) / tileWidth ), 0 );
	coverage.max_x = Math.floor( ( limits.max.x - W ) / tileWidth ) + 1;
 
	coverage.max_y = Math.floor( ( N - limits.min.y ) / tileWidth ) + 1;
	coverage.min_y = Math.max( Math.floor( ( N - limits.max.y ) / tileWidth ), 0 );

	coverage.count = ( coverage.max_x - coverage.min_x ) * ( coverage.max_y - coverage.min_y );

	return coverage;

};

TiledTerrain.prototype.pickCoverage = function ( limits, maxResolution ) {

	var tileSet = this.tileSet;
	var resolution = maxResolution || tileSet.RESOLUTION_MIN;
	var coverage;

	resolution = resolution / 2;

	do {

		resolution *= 2;
		coverage = this.getCoverage( limits, resolution );

	} while ( coverage.count > 4 && resolution < tileSet.RESOLUTION_MAX );

	return coverage;

};

TiledTerrain.prototype.loadTile = function ( x, y, resolutionIn, oldTileIn ) {

	console.log('load ', resolutionIn, ': [ ', x, ',', y, ']' );

	var self       = this;
	var resolution = resolutionIn;
	var oldTile    = oldTileIn;

	++this.tilesLoading;

	var limits    = this.limits;
	var tileSet   = this.tileSet;
	var tileWidth = (tileSet.TILESIZE - 1 ) * resolution;
	var clip      = { top: 0, bottom: 0, left: 0, right: 0 };

	var N = tileSet.N;
	var W = tileSet.W;

	var bottomLeft = new Vector2( W + tileWidth * x,          N - tileWidth * ( y + 1 ) );
	var topRight   = new Vector2( W + tileWidth * ( x + 1 ) , N - tileWidth * y );

	var tileLimits = new Box2( bottomLeft, topRight );

	// trim excess off sides of tile where overlapping with region

	if ( tileLimits.max.y > limits.max.y ) clip.top = Math.floor( ( tileLimits.max.y - limits.max.y ) / resolution );

	if ( tileLimits.min.y < limits.min.y ) clip.bottom = Math.floor( ( limits.min.y - tileLimits.min.y ) / resolution );

	if ( tileLimits.min.x < limits.min.x ) clip.left = Math.floor( ( limits.min.x - tileLimits.min.x ) / resolution );

	if ( tileLimits.max.x > limits.max.x ) clip.right = Math.floor( ( tileLimits.max.x - limits.max.x ) / resolution );

	var tileSpec = {
		tileSet: tileSet,
		resolution: resolution,
		tileX: x,
		tileY: y,
		clip: clip
	};

	// get a web worker from the pool and create new geometry in it

	var tileLoader = this.workerPool.getWorker();

	tileLoader.onmessage = _mapLoaded;

	tileLoader.postMessage( tileSpec );

	return;

	function _mapLoaded ( event ) {

		var tileData = event.data;

		// return worker to pool

		self.workerPool.putWorker( tileLoader );

		// the survey/region in the viewer may have changed while the height maos are being loaded.
		// bail out in this case to avoid errors

		if ( self.dying ) {

			self.progressDial.end();
			return;

		}

		if ( tileData.status !== 'ok' ) ++self.errors;

		if ( self.errors ) {

			// error out early if we or other tiles have failed to load.

			self.endLoad();
			return;

		}

		var attributes = tileData.json.data.attributes;

		// large arrays in source were translated to ArrayBuffers to allow transferable objects to 
		// be used, to decrease execution time for this handler.

		// retype and move arrays back to useable format
		// note: the standard JSON bufferGeometry format uses Array but accepts TypedArray
		// Float32 is the target type so functionality is equivalent

		for ( var attributeName in attributes ) {

			var attribute = attributes[ attributeName ];

			if ( attribute.arrayBuffer !== undefined ) {

				attribute.array = new Float32Array( attribute.arrayBuffer );
				attribute.arrayBuffer = null;

			}

		}

		var tile;

		if ( !oldTile ) {

			tile = new Tile( x, y, resolution, self.tileSet, clip );

		} else {

			tile = oldTile;

		}

		if ( self.progressDial ) self.progressDial.add( self.progressInc );

		tile.createFromBufferGeometryJSON( tileData.json, tileData.boundingBox );

		if ( self.activeOverlay ) tile.setOverlay( self.activeOverlay, self.opacity );

		if ( self.progressDial ) self.progressDial.add( self.progressInc );

		self.endLoad( tile );

	}

};

TiledTerrain.prototype.endLoad = function ( tile ) {

	if ( tile !== undefined ) this.loadedTiles.push( tile );

	if ( --this.tilesLoading === 0 ) {

		var loadedTiles     = this.loadedTiles;
		var replaceTileMesh = this.replaceTileMesh;
		var parent = null;

		if ( this.errors === 0 ) {

			// display loaded tiles and add to tileTree

			if ( replaceTileMesh ) {

				parent = replaceTileMesh;

			} else if ( tile.parent === null ) {

				parent = this;

			}

			for ( var i = 0, l = loadedTiles.length; i < l; i++ ) {

				var loadedTile = loadedTiles[ i ];

				if ( ! tile.parent ) parent.add( tile );

				loadedTile.replaced = false;
				loadedTile.evicted = false;
				loadedTile.isMesh = true;

				loadedTile.liveTiles++;

			}

			if ( replaceTileMesh ) replaceTileMesh.setReplaced();

			this.terrainLoaded = true;

		} else {

			// mark this tile so we don't continually try to reload
			if ( this.resolution === this.initialResolution ) {

				console.log('oops');
				this.tileArea(  this.currentLimits, null, resolution * 2 );

			}

			if ( replaceTileMesh ) replaceTileMesh.canZoom = false;

		}

		this.errors = 0;
		this.replaceTileMesh = null;
		this.loadedTiles = [];

		this.onLoaded();
		this.progressDial.end();

	}

};

TiledTerrain.prototype.resurrectTile = function ( tile ) {

	if ( tile.isMesh ) {

		console.log( 'resurrecting the undead!' );
		return;

	}

	// reload tile (use exiting tile object to preserve canZoom).
	this.loadTile( tile.x, tile.y, tile.resolution, tile );

};

TiledTerrain.prototype.tileArea = function ( limits, tile, maxResolution ) {

	var coverage   = this.pickCoverage( limits, maxResolution );
	var resolution = coverage.resolution;

	if ( tile && tile.resolution == resolution ) {

		console.log('BOING!');
		return;

	}

	this.replaceTileMesh = tile;
	this.currentLimits   = limits;

	if ( this.initialResolution === undefined ) {

		this.initialResolution = resolution;

	}

	for ( var x = coverage.min_x; x < coverage.max_x; x++ ) {

		for ( var y = coverage.min_y; y < coverage.max_y; y++ ) {

			this.loadTile( x, y, resolution );

		}

	}

	if ( this.tilesLoading > 0 && this.progressDial !== undefined ) {
 
		this.progressDial.start( 'Loading '  + this.tilesLoading + ' terrain tiles' );
		this.progressInc = 100 / ( this.tilesLoading * 2 );

	}

	return;

};

TiledTerrain.prototype.getOverlays = function () {

	return this.tileSet.OVERLAYS;

};

TiledTerrain.prototype.setOverlay = function ( overlay, imageLoadedCallback ) {

	var self = this;

	if ( this.tilesLoading > 0 ) return;

	this.activeOverlay = overlay;

	this.traverse( _setTileOverlays );

	return;

	function _setTileOverlays ( obj ) {

		if ( obj !== self ) obj.setOverlay( overlay, self.opacity, imageLoadedCallback );

	}

};

TiledTerrain.prototype.getOverlay = function () {

	if ( this.activeOverlay ) {

		return this.activeOverlay;

	} else {

		return 'OS'; // FIXME

	}

};

TiledTerrain.prototype.removed = function () {

	this.dying = true;

	if ( this.tilesLoading > 0 ) return;

	var self = this;

	this.traverse( _disposeTileMesh );

	return;

	function _disposeTileMesh ( obj) {

		if ( obj !== self ) obj.removed( obj );

	}

};

TiledTerrain.prototype.setMaterial = function ( material ) {

	if ( this.tilesLoading > 0 ) return;

	var self = this;

	this.activeOverlay = null;

	this.traverse( _setTileMeshMaterial );

	material.opacity = this.opacity;
	material.needsUpdate = true;

	// use for commmon material access for opacity

	this.material = material;

	return;

	function _setTileMeshMaterial ( obj ) {

		if ( obj !== self ) obj.setMaterial( material );

	}

};

TiledTerrain.prototype.setOpacity = function ( opacity ) {

	if ( this.shadingMode === SHADING_OVERLAY ) {

		var self = this;

		// each tile has its own material, therefore need setting separately
		this.traverse( _setTileOpacity );

	} else {

		if ( this.material ) {

			this.material.opacity = opacity;
			this.material.needsUpdate = true;

		}

	}

	this.opacity = opacity;

	return;

	function _setTileOpacity ( obj ) {

		if ( obj !== self ) obj.setOpacity( opacity );

	}

};

TiledTerrain.prototype.zoomCheck = function ( camera ) {

	var maxResolution     = this.tileSet.RESOLUTION_MIN;
	var initialResolution = this.initialResolution;
	var self              = this;

	var frustum  = new Frustum();

	var candidateTiles      = [];
	var candidateEvictTiles = [];
	var resurrectTiles      = [];

	var total, tile, i;

	if ( this.tilesLoading > 0 ) return;

	camera.updateMatrix(); // make sure camera's local matrix is updated
	camera.updateMatrixWorld(); // make sure camera's world matrix is updated
	camera.matrixWorldInverse.getInverse( camera.matrixWorld );

	frustum.setFromMatrix( new Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );

	// scan scene graph of terrain

	this.traverse( _scanTiles );

	var resurrectCount = resurrectTiles.length;
	var candidateCount = candidateTiles.length;

	_evictTiles();

	if ( resurrectCount !== 0 ) {

		if ( this.progressDial ) this.progressDial.start( 'Resurrecting tiles' );

		for ( i = 0; i < resurrectCount; i++ ) {

			this.resurrectTile( resurrectTiles[ i ] );

		}

		this.progressInc = 100 / ( 2 * resurrectCount );

	} else if ( candidateCount !== 0 ) {

		total = candidateTiles.reduce( function ( a, b ) { return { area: a.area + b.area }; } );

		for ( i = 0; i < candidateCount; i++ ) {

			if ( candidateTiles[ i ].area/total.area > 0.7 ) {

				tile = candidateTiles[ i ].tile;

				if ( tile.resolution > maxResolution ) this.tileArea( tile.getBoundingBox(), tile );

			}

		}

	}

	return;

	function _scanTiles( tile ) {

		if ( tile === self ) return;

		if ( frustum.intersectsBox( tile.getWorldBoundingBox() ) ) {

			// this tile intersects the screen

			if ( tile.children.length === 0 ) {

				if ( !tile.isMesh  ) { 

					// this tile is not loaded, but has been previously
					resurrectTiles.push( tile );

				} else {

					// this tile is loaded, maybe increase resolution?
					if ( tile.canZoom ) candidateTiles.push( { tile: tile, area: tile.projectedArea( camera ) } );

				}

			} else {

				if ( !tile.isMesh && tile.evicted && !this.parent.resurrectionPending ) {

					tile.resurrectionPending = true;
					resurrectTiles.push( tile );

				}

				if ( tile.parent.ResurrectionPending && this.isMesh ) {

					// remove tile - will be replaced with parent
					console.log(' should not get here');

				}

			}

		} else {

			// off screen tile
			if ( tile.isMesh ) candidateEvictTiles.push( tile );

		}

	}

	function _evictTiles() {

		var EVICT_PRESSURE = 5;
		var evictCount = candidateEvictTiles.length;
		var i;

		if ( evictCount !== 0 ) {

			candidateEvictTiles.sort( _sortByPressure );

			for ( i = 0; i < evictCount; i++ ) {

				var tile = candidateEvictTiles[i];

				// heuristics for evicting tiles - needs refinement

				var pressure = Tile.liveTiles / EVICT_PRESSURE;
				var tilePressure = tile.evictionCount * tile.resolution / initialResolution;

				// console.log( 'ir', initialResolution, 'p: ', pressure, ' tp: ', tilePressure );

				if ( pressure > tilePressure ) tile.evict();
 
			}

		}

		function _sortByPressure( tileA, tileB ) {

			return tileA.evictionCount * tileA.resolution - tileB.evictionCount * tileB.resolution;

		}

	}

};

export { TiledTerrain };

// EOF