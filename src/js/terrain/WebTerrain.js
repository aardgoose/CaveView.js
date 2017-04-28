import { CommonTerrain } from './CommonTerrain';
import { Tile } from './Tile';
//import { Box3Helper } from '../core/Box3';
import { HUD } from '../hud/HUD';
import { WorkerPool } from '../workers/WorkerPool';
import { SHADING_OVERLAY, getEnvironmentValue } from '../core/constants';

import {
	Vector2, Frustum, Box2, Matrix4, FileLoader
} from '../../../../three.js/src/Three';


var halfMapExtent = 6378137 * Math.PI; // from EPSG:3875 definition

function WebTerrain ( limits3, onReady, onLoaded, overlayLoadedCallback ) {

	CommonTerrain.call( this );

	this.name = 'WebTerrain';
	this.type = 'CV.WebTerrain';

	this.limits = new Box2(
		new Vector2( limits3.min.x, limits3.min.y ),
		new Vector2( limits3.max.x, limits3.max.y )
	);

	this.tile = null;

	this.onLoaded        = onLoaded;
	this.tilesLoading    = 0;
	this.loadedTiles     = [];
	this.errors          = 0;
	this.terrainLoaded   = false;
	this.replaceTileMesh = null;
	this.activeOverlay   = null;
	this.material        = null;
	this.initialZoom     = null;
	this.currentZoom     = null;
	this.currentLimits;
	this.dying = false;
	this.overlayLoadedCallback = overlayLoadedCallback;
	this.overlaysLoading = 0;
	this.debug = true;

	this.workerPool = new WorkerPool( 'webTileWorker.js' );

	if ( HUD !== undefined ) {

		this.progressDial = HUD.getProgressDial();

	}

	var self = this;

	new FileLoader().setResponseType( 'json' ).load( getEnvironmentValue( 'terrainDirectory', '' ) + '/' + 'tileSets.json', _tileSetLoaded );

	function _tileSetLoaded( json ) {

		self.tileSets = json;

		onReady( self ); // call handler

	}

}

WebTerrain.prototype = Object.create( CommonTerrain.prototype );

WebTerrain.prototype.constructor = WebTerrain;

WebTerrain.prototype.isTiled = true;

WebTerrain.prototype.isLoaded = function () {

	return this.terrainLoaded;

};

WebTerrain.prototype.hasCoverage = function () {

	var limits  = this.limits;
	var tileSets = this.tileSets;
	var tileSet;
	var coverage;

	// iterate through available tileSets and pick the first match
	var baseDirectory = getEnvironmentValue( 'terrainDirectory', '' );

	for ( var i = 0, l = tileSets.length; i < l; i++ ) {

		tileSet = tileSets[ i ];

		coverage = this.getCoverage( limits, tileSet.minZoom );

		if ( ( coverage.min_x >= tileSet.minX && coverage.max_x <= tileSet.maxX )
				&& (
			( coverage.min_y >= tileSet.minY && coverage.max_y <= tileSet.maxY ) ) ) {

			tileSet.directory = baseDirectory + tileSet.subdirectory;
			this.tileSet = tileSet;
			return true;

		}

	}

	return false;

};

WebTerrain.prototype.getCoverage = function ( limits, zoom ) {

	var coverage = { zoom: zoom };

	var N =  halfMapExtent;
	var W = -halfMapExtent;

	var tileCount = Math.pow( 2, zoom - 1 ) / halfMapExtent; // tile count per metre

	coverage.min_x = Math.floor( ( limits.min.x - W ) * tileCount );
	coverage.max_x = Math.floor( ( limits.max.x - W ) * tileCount );

	coverage.max_y = Math.floor( ( N - limits.min.y ) * tileCount );
	coverage.min_y = Math.floor( ( N - limits.max.y ) * tileCount );

	coverage.count = ( coverage.max_x - coverage.min_x + 1 ) * ( coverage.max_y - coverage.min_y + 1 );

	return coverage;

};

WebTerrain.prototype.pickCoverage = function ( limits, zoom ) {

	var tileSet = this.tileSet;
	var coverage;

	zoom = zoom || tileSet.maxZoom;
	zoom++;

	do {

		--zoom;
		coverage = this.getCoverage( limits, zoom );

	} while ( coverage.count > 4 && zoom > tileSet.minZoom );

	return coverage;

};

WebTerrain.prototype.loadTile = function ( x, y, z, oldTileIn ) {

	// account for limits of DTM resolution

	var tileSet = this.tileSet;
	var scale = ( z > tileSet.dtmMaxZoom ) ? Math.pow( 2, tileSet.dtmMaxZoom - z ) : 1; 

	// don't zoom in with no overlay - no improvement of terrain rendering in this case

	if ( scale !== 1 && this.activeOverlay === null && this.currentZoom !== null ) return;

	console.log( 'load: [ ', z +'/' +  x + '/' +  y, ']' );

	var self = this;
	var oldTile = oldTileIn;

	var limits    = this.limits;
	var tileWidth = halfMapExtent / Math.pow( 2, z - 1 );
	var clip      = { top: 0, bottom: 0, left: 0, right: 0 };

	var tileMinX = tileWidth * x - halfMapExtent;
	var tileMaxX = tileMinX + tileWidth;

	var tileMaxY = halfMapExtent - tileWidth * y;
	var tileMinY = tileMaxY - tileWidth;

	var divisions = ( tileSet.divisions ) * scale ;
	var resolution = tileWidth / divisions;

	++this.tilesLoading;

	// trim excess off sides of tile where overlapping with region

	if ( tileMaxY > limits.max.y ) clip.top = Math.floor( ( tileMaxY - limits.max.y ) / resolution );

	if ( tileMinY < limits.min.y ) clip.bottom = Math.floor( ( limits.min.y - tileMinY ) / resolution );

	if ( tileMinX < limits.min.x ) clip.left = Math.floor( ( limits.min.x - tileMinX ) / resolution );

	if ( tileMaxX > limits.max.x ) clip.right = Math.floor( ( tileMaxX - limits.max.x ) / resolution );


	// get a web worker from the pool and create new geometry in it

	var tileLoader = this.workerPool.getWorker();

	tileLoader.onmessage = _mapLoaded;

	tileLoader.postMessage( {
		tileSet: tileSet,
		divisions: divisions,
		resolution: resolution,
		x: x,
		y: y,
		z: z,
		clip: clip
	} );

	return;

	function _mapLoaded ( event ) {

		var tileData = event.data;

		// return worker to pool

		self.workerPool.putWorker( tileLoader );

		// the survey/region in the viewer may have changed while the height maps are being loaded.
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

		var tile =  oldTile ? oldTile : new Tile( x, y, z, self.tileSet, clip );

		if ( self.progressDial ) self.progressDial.add( self.progressInc );

		tile.createFromBufferAttributes( tileData.index, tileData.attributes, tileData.boundingBox );

//		self.add( new Box3Helper( tile.getBoundingBox() ) );

		if ( self.activeOverlay !== null && self.shadingMode === SHADING_OVERLAY ) {

			tile.setOverlay( self.activeOverlay, self.opacity, _overlayLoaded );
			self.overlaysLoading++;

		}

		if ( self.progressDial ) self.progressDial.add( self.progressInc );

		self.endLoad( tile );

	}

	function _overlayLoaded () {

		if ( --self.overlaysLoading === 0 ) self.overlayLoadedCallback();

	}

};

WebTerrain.prototype.endLoad = function ( tile ) {

	if ( tile !== undefined ) this.loadedTiles.push( tile );

	if ( --this.tilesLoading === 0 ) {

		var loadedTiles = this.loadedTiles;
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

				if ( ! loadedTile.parent ) parent.add( loadedTile );

				loadedTile.replaced = false;
				loadedTile.evicted = false;
				loadedTile.isMesh = true;

				loadedTile.liveTiles++;

			}

			if ( replaceTileMesh ) replaceTileMesh.setReplaced();

			this.terrainLoaded = true;

		} else {

			if ( this.currentZoom === this.initialZoom ) {

				console.warn( 'oops' );
				return;

			}

			// mark this tile so we don't continually try to reload

			if ( replaceTileMesh ) replaceTileMesh.canZoom = false;

		}

		this.errors = 0;
		this.replaceTileMesh = null;
		this.loadedTiles = [];

		this.onLoaded();
		this.progressDial.end();

	}

};

WebTerrain.prototype.resurrectTile = function ( tile ) {

	if ( tile.isMesh ) {

		console.log( 'resurrecting the undead!' );
		return;

	}

	// reload tile (use exiting tile object to preserve canZoom).
	this.loadTile( tile.x, tile.y, tile.z, tile );

};

WebTerrain.prototype.tileArea = function ( limits, tile, maxZoom ) {

	var coverage = this.pickCoverage( limits, maxZoom );
	var zoom = coverage.zoom;

	if ( tile && tile.zoom == zoom ) {

		console.error( 'ERROR - looping on tile replacement' );
		return;

	}

	this.replaceTileMesh = tile;
	this.currentLimits = limits;

	if ( this.initialZoom === null ) {

		this.initialZoom = zoom;

	}

	for ( var x = coverage.min_x; x < coverage.max_x + 1; x++ ) {

		for ( var y = coverage.min_y; y < coverage.max_y + 1; y++ ) {

			this.loadTile( x, y, zoom );

		}

	}

	if ( this.tilesLoading > 0 && this.progressDial !== undefined ) {
 
		this.progressDial.start( 'Loading '  + this.tilesLoading + ' terrain tiles' );
		this.progressInc = 100 / ( this.tilesLoading * 2 );

	}

	this.currentZoom = zoom;

	return;

};

WebTerrain.prototype.setDefaultOverlay = function ( overlay ) {

	this.activeOverlay = overlay;

};

WebTerrain.prototype.setOverlay = function ( overlay ) {

	if ( this.tilesLoading > 0 ) return;

	var self = this;

	this.activeOverlay = overlay;

	this.traverse( _setTileOverlays );

	return;

	function _setTileOverlays ( obj ) {

		if ( ! obj.isTile ) return;

		obj.setOverlay( overlay, self.opacity, _overlayLoaded );
		self.overlaysLoading++;

	}

	function _overlayLoaded () {

		if ( --self.overlaysLoading === 0 ) self.overlayLoadedCallback();

	}

};

WebTerrain.prototype.removed = function () {

	this.dying = true;

	if ( this.tilesLoading > 0 ) return;

	var self = this;

	this.traverse( _disposeTileMesh );

	return;

	function _disposeTileMesh ( obj ) {

		if ( obj !== self ) obj.removed( obj );

	}

};

WebTerrain.prototype.setMaterial = function ( material ) {

	if ( this.tilesLoading > 0 ) return;

	this.traverse( _setTileMeshMaterial );

	material.opacity = this.opacity;
	material.needsUpdate = true;

	// use for commmon material access for opacity

	this.material = material;

	return;

	function _setTileMeshMaterial ( obj ) {

		if ( obj.isTile ) obj.setMaterial( material );

	}

};

WebTerrain.prototype.setOpacity = function ( opacity ) {

	if ( this.shadingMode === SHADING_OVERLAY ) {

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

		if ( obj.isTile ) obj.setOpacity( opacity );

	}

};

WebTerrain.prototype.zoomCheck = function ( camera ) {

	var maxZoom     = this.tileSet.maxZoom;
	var initialZoom = this.initialZoom;
	var self = this;

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

			if ( candidateTiles[ i ].area / total.area > 0.7 ) {
				console.log( 'candidate', i );

				tile = candidateTiles[ i ].tile;

				if ( tile.zoom < maxZoom ) this.tileArea( tile.getBoundingBox(), tile );

			}

		}

	}

	return;

	function _scanTiles( tile ) {

		if ( tile === self || ! tile.isTile) return;

		if ( frustum.intersectsBox( tile.getWorldBoundingBox() ) ) {

			// this tile intersects the screen

			if ( tile.children.length === 0 ) {

				if ( ! tile.isMesh  ) {

					// this tile is not loaded, but has been previously
					resurrectTiles.push( tile );

				} else {

					// this tile is loaded, maybe increase resolution?
					if ( tile.canZoom ) candidateTiles.push( { tile: tile, area: tile.projectedArea( camera ) } );

				}

			} else {

				if ( ! tile.isMesh && tile.evicted && ! this.parent.resurrectionPending ) {

					tile.resurrectionPending = true;
					resurrectTiles.push( tile );

				}

				if ( tile.parent.ResurrectionPending && this.isMesh ) {

					// remove tile - will be replaced with parent
					console.warn( ' should not get here' );

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

				var tile = candidateEvictTiles[ i  ];

				// heuristics for evicting tiles - needs refinement

				var pressure = Tile.liveTiles / EVICT_PRESSURE;
				var tilePressure = tile.evictionCount * initialZoom / tile.zoom; // FIXME

				// console.log( 'ir', initialZoom, 'p: ', pressure, ' tp: ', tilePressure );

				if ( pressure > tilePressure ) tile.evict();
 
			}

		}

		function _sortByPressure( tileA, tileB ) {

			return tileA.evictionCount / tileA.zoom - tileB.evictionCount / tileB.zoom; // FIXME was by resoution ie 2^zoom

		}

	}

};

export { WebTerrain };

// EOF