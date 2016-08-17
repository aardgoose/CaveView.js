import { CommonTerrain } from './CommonTerrain.js';
import { Tile } from './Tile.js';
import { TileSet } from './TileSet.js';
import { Tree } from '../core/Tree.js';
import { HUD } from '../HUD.js';
import { SHADING_OVERLAY, getEnvironmentValue } from '../core/constants.js';

function TiledTerrain ( limits3, onLoaded ) {

	THREE.Group.call( this );

	this.name = "TiledTerrain";

	this.limits = new THREE.Box2(

		new THREE.Vector2( limits3.min.x, limits3.min.y ),
		new THREE.Vector2( limits3.max.x, limits3.max.y )

	);

	this.tileSet       = Object.assign( {}, TileSet);
	this.tileTree      = new Tree();

	this.onLoaded      = onLoaded;
	this.tilesLoading  = 0;
	this.loadedTiles   = [];
	this.errors        = 0;
	this.terrainLoaded = false;
	this.replaceTile   = null;
	this.activeOverlay = null;
	this.material      = null;
	this.initialResolution;
	this.currentLimits;
	this.dying = false;

	if ( HUD !== undefined ) {

		this.progressDial = HUD.getProgressDial();

	}

	 this.tileSet.BASEDIR = getEnvironmentValue( "terrainDirectory", "" ) + this.tileSet.BASEDIR;
	 this.tileSet.OVERLAYDIR = getEnvironmentValue( "terrainDirectory", "" ) + this.tileSet.OVERLAYDIR;

}

TiledTerrain.prototype = Object.create( THREE.Group.prototype );

Object.assign( TiledTerrain.prototype, CommonTerrain.prototype );

TiledTerrain.prototype.constructor = TiledTerrain;

TiledTerrain.prototype.isTiled = function () {

	return true;

}

TiledTerrain.prototype.isLoaded = function () {

	return this.terrainLoaded;

}

TiledTerrain.prototype.hasCoverage = function () {

	var limits  = this.limits;
	var tileSet = this.tileSet;

	return ( (limits.min.x >= tileSet.W && limits.min.x <= tileSet.E) || 
	         (limits.max.x >= tileSet.W && limits.max.x <= tileSet.E) ) &&
		   ( (limits.min.y >= tileSet.S && limits.min.y <= tileSet.N) ||
		     (limits.max.y >= tileSet.S && limits.max.y <= tileSet.N));

}

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

}

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

}

TiledTerrain.prototype.loadTile = function ( x, y, resolutionIn, oldTileIn ) {

	console.log("load ", resolutionIn, ": [ ", x, ",", y, "]" );

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

	var bottomLeft = new THREE.Vector2( W + tileWidth * x,          N - tileWidth * ( y + 1 ) );
	var topRight   = new THREE.Vector2( W + tileWidth * ( x + 1 ) , N - tileWidth * y );

	var tileLimits = new THREE.Box2( bottomLeft, topRight );

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
	}

	// start web worker and create new geometry in it.

	var tileLoader = new Worker( getEnvironmentValue( "cvDirectory", "" ) + "CaveView/js/workers/tileWorker.js" );

	tileLoader.onmessage = _mapLoaded;

	tileLoader.postMessage( tileSpec );

	return;

	function _mapLoaded ( event ) {

		var tileData = event.data;

		// the survey/region in the viewer may have changed while the height maos are being loaded.
		// bail out in this case to avoid errors

		if ( self.dying ) {

			this.progressDial.end();
			return;

		}

		if ( tileData.status !== "ok" ) ++self.errors;

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

		if (!oldTile) {

			tile = new Tile( x, y, resolution, self.tileSet, clip );

		} else {

			tile = oldTile;

		}

		if ( self.progressDial ) self.progressDial.add( self.progressInc );

		tile.createFromBufferGeometryJSON( tileData.json, tileData.boundingBox );

		if ( self.activeOverlay ) {

			tile.setOverlay( self.activeOverlay, self.opacity );

		}

		if ( self.progressDial ) self.progressDial.add( self.progressInc );

		self.endLoad( tile );

	}

}

TiledTerrain.prototype.endLoad = function ( tile ) {

	if ( tile !== undefined ) this.loadedTiles.push( tile );

	if ( --this.tilesLoading === 0 ) {

		var loadedTiles = this.loadedTiles;
		var replaceTile = this.replaceTile;

		if ( this.errors === 0 ) {

			// display loaded tiles and add to tileTree

			var tileTree = this.tileTree;
			var parentId;

			if ( replaceTile ) {

				parentId = replaceTile.id;

			} else if ( tile.parentId === null ) {

				parentId = tileTree.getRootId();

			}

			for ( var i = 0, l = loadedTiles.length; i < l; i++ ) {

				tile = loadedTiles[ i ];

				tile.attach( this );

				if (!tile.id) {

					// only add new tiles to tree, ignore resurrected tiles
					tile.id = tileTree.addNode( tile, parentId );
					tile.parentId = parentId;

				}

			}

			if ( replaceTile ) replaceTile.remove( false );

			this.terrainLoaded = true;

		} else {

			// mark this tile so we don't continually try to reload
			if ( this.resolution === this.initialResolution ) {

				console.log("oops");
				this.tileArea(  this.currentLimits, null, resolution * 2 );

			}

			if ( replaceTile ) replaceTile.canZoom = false;

		}

		this.errors = 0;
		this.replaceTile = null;
		this.loadedTiles = [];

		this.onLoaded();
		this.progressDial.end();

	}

}

TiledTerrain.prototype.resurrectTile = function ( tile ) {

	if ( tile.mesh ) {

		console.log( "resurrecting the undead!" );
		return;

	}

	// reload tile (use exiting tile object to preserve canZoom).
	this.loadTile( tile.x, tile.y, tile.resolution, tile );

}

TiledTerrain.prototype.tileArea = function ( limits, tile, maxResolution ) {

	var coverage   = this.pickCoverage( limits, maxResolution );
	var resolution = coverage.resolution;

	if ( tile && tile.resolution == resolution ) {

		console.log("BOING!");
		return;

	}

	this.replaceTile   = tile;
	this.currentLimits = limits;

	if ( this.initialResolution === undefined ) {

		this.initialResolution = resolution;

	}

	for ( var x = coverage.min_x; x < coverage.max_x; x++ ) {

		for ( var y = coverage.min_y; y < coverage.max_y; y++ ) {

			this.loadTile( x, y, resolution );

		}

	}

	if ( this.tilesLoading > 0 && this.progressDial !== undefined ) {
 
		this.progressDial.start( "Loading "  + this.tilesLoading + " terrain tiles" );
		this.progressInc = 100 / ( this.tilesLoading * 2 );

	}

	return;

}

TiledTerrain.prototype.getOverlays = function () {

	return this.tileSet.OVERLAYS;

}

TiledTerrain.prototype.setOverlay = function ( overlay ) {

	var self = this;
	var tileTree = this.tileTree;

	if ( this.tilesLoading > 0 ) return;

	this.activeOverlay = overlay;

	_setTileOverlays( tileTree.getRootId() );

	return;

	function _setTileOverlays ( id ) {

		var nodes = tileTree.getChildData( id );
		var node;
		var tile;

		for ( var i = 0, l = nodes.length; i < l; i++ ) {

			node = nodes[ i ];
			tile = node.name;

			tile.setOverlay( overlay, self.opacity );

			_setTileOverlays( node.id );

		}

	}

}

TiledTerrain.prototype.getOverlay = function () {

	if (this.activeOverlay) {

		return this.activeOverlay;

	} else {

		return "OS"; // FIXME

	}

}

TiledTerrain.prototype.setMaterial = function ( material ) {

	var self = this;
	var tileTree = this.tileTree;

	if ( this.tilesLoading > 0 ) return;

	this.activeOverlay = null;

	_setTileMaterial( tileTree.getRootId() );

	material.opacity = this.opacity;
	material.needsUpdate = true;

	this.material = material;

	return;

	function _setTileMaterial ( id ) {

		// FIXME this needs fixing by a tree method

		var nodes = tileTree.getChildData( id );
		var node;
		var tile;

		for ( var i = 0, l = nodes.length; i < l; i++ ) {

			node = nodes[ i ];
			tile = node.name;

			tile.setMaterial( material );

			_setTileMaterial( node.id );

		}

	}

}

TiledTerrain.prototype.zoomCheck = function ( camera ) {

	var maxResolution     = this.tileSet.RESOLUTION_MIN;
	var initialResolution = this.initialResolution;
	var tileTree          = this.tileTree;
	var self              = this;

	var frustum  = new THREE.Frustum();

	var candidateTiles      = [];
	var candidateEvictTiles = [];
	var resurrectTiles      = [];

	var total, tile, i;

	if ( this.tilesLoading > 0 ) return;

	camera.updateMatrix(); // make sure camera's local matrix is updated
	camera.updateMatrixWorld(); // make sure camera's world matrix is updated
	camera.matrixWorldInverse.getInverse( camera.matrixWorld );

	frustum.setFromMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );

	_searchTileTree( tileTree.getRootId() );

	var evictCount     = candidateEvictTiles.length;
	var resurrectCount = resurrectTiles.length;
	var candidateCount = candidateTiles.length;

	var EVICT_PRESSURE = 5;

	if ( evictCount !== 0 ) {

		candidateEvictTiles.sort( _sortByPressure );

		for ( i = 0; i < evictCount; i++ ) {

			var tile = candidateEvictTiles[i];

			// heuristics for evicting tiles

			var pressure = Tile.liveTiles / EVICT_PRESSURE;
			var tilePressure = tile.evictionCount * tile.resolution / initialResolution;

//			console.log( "ir", initialResolution, "p: ", pressure, " tp: ", tilePressure );

			if ( pressure > tilePressure ) tile.remove( true );

		}

	}

	if ( resurrectCount !== 0 ) {

		if ( this.progressDial ) this.progressDial.start( "Resurrecting tiles" );

		for ( i = 0; i < resurrectCount; i++ ) {

			this.resurrectTile( resurrectTiles[ i ] );

		}

		this.progressInc = 100 / ( 2 * resurrectCount );

	} else if ( candidateCount !== 0 ) {

		total = candidateTiles.reduce( function ( a, b ) { return { area: a.area + b.area }; } );

		for ( i = 0; i < candidateCount; i++ ) {

			if ( candidateTiles[ i ].area/total.area > 0.7 ) {

				tile = candidateTiles[ i ].tile;

				if ( tile.canZoom && tile.resolution > maxResolution ) {

					this.tileArea( tile.getBoundingBox(), tile );

				}

			}

		}

	}

	return;

	function _sortByPressure( tileA, tileB ) {

		return tileA.evictionCount * tileA.resolution - tileB.evictionCount * tileB.resolution;

	}

	function _searchTileTree ( id ) {

		var nodes = tileTree.getChildData( id );
		var node;
		var tile;

		for ( var i = 0, l = nodes.length; i < l; i++ ) {

			node = nodes[i];
			tile = node.name;

			if ( frustum.intersectsBox( tile.getWorldBoundingBox() ) ) {

				if ( node.noChildren === 0 ) {

					if (!tile.mesh ) {

						resurrectTiles.push( tile );

					} else {

						// this tile is live, consider subdividing
						candidateTiles.push( { tile: tile, area: tile.projectedArea( camera ) } );

					}

				} else {

					// resurrect existing tiles if possible

					if (!tile.mesh && tile.evicted ) {

						_flushTiles( node.id );
						resurrectTiles.push( tile );

					} else {

						// do a full search for new tiles to add
						_searchTileTree( node.id );
					}

				}

			} else {

				_searchTileTree( node.id );

				candidateEvictTiles.push( tile );

			}

		}

	}

	function _flushTiles ( id ) {

		tileTree.removeNodes( function ( x ) { x.name.remove(); }, tileTree.findById( id ) );

	}

}

TiledTerrain.prototype.setOpacity = function ( opacity ) {

	var self = this;
	var tileTree = this.tileTree;

	if ( this.shadingMode === SHADING_OVERLAY ) {

		// each tile has its own material, therefore need setting separately
		_setTileOpacity( tileTree.getRootId() );

	} else {

		if ( this.material ) {

			this.material.opacity = opacity;
			this.material.needsUpdate = true;

		}

	}

	this.opacity = opacity;

	return;

	function _setTileOpacity ( id ) {

		// FIXME this needs fixing by a tree method

		var nodes = tileTree.getChildData( id );
		var node;
		var tile;

		for ( var i = 0, l = nodes.length; i < l; i++ ) {

			node = nodes[ i ];
			tile = node.name;

			tile.setOpacity( opacity );

			_setTileOpacity( node.id );

		}

	}

}

export { TiledTerrain };

// EOF