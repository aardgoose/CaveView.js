import { Materials } from '../materials/Materials';
import { CommonTerrain } from './CommonTerrain';
import { Tile } from './Tile';
import { WorkerPool } from '../core/WorkerPool';
import { Cfg } from '../core/lib';

import { EPSG4326TileSet } from './EPSG4326TileSet';
import { EPSG3857TileSet } from './EPSG3857TileSet';

import {
	Vector2, Frustum, Box2, Matrix4
} from '../Three';

function WebTerrain ( survey, onLoaded ) {

	CommonTerrain.call( this );

	this.name = 'WebTerrain';
	this.type = 'CV.WebTerrain';
	this.attributions = [];
	this.log = false;
	this.displayCRS = survey.displayCRS;
	this.surveyCRS = survey.CRS;

	const limits = survey.limits;

	this.limits = new Box2(
		new Vector2( limits.min.x, limits.min.y ),
		new Vector2( limits.max.x, limits.max.y )
	);

	this.flatZ = survey.modelLimits.max.z;

	this.offsets = survey.offsets;

	this.onLoaded        = onLoaded;
	this.childrenLoading = 0;
	this.childErrors     = 0;
	this.isLoaded        = false;
	this.material        = null;
	this.initialZoom     = null;
	this.currentZoom     = null;
	this.currentLimits   = null;
	this.dying = false;
	this.tilesLoading = 0;
	this.overlaysLoading = 0;
	this.debug = true;

	this.material = Materials.getCursorMaterial();
	this.canZoom = true;

}

WebTerrain.prototype = Object.create( CommonTerrain.prototype );

WebTerrain.prototype.isTiled = true;

WebTerrain.prototype.load = function () {

	// return indicates if sync coverage checking in progress

	const self = this;

	switch ( this.displayCRS ) {

	case 'EPSG:3857':

		this.TS = new EPSG3857TileSet( _tileSetReady );

		break;

	case 'EPSG:4326':
	case 'ORIGINAL':

		this.TS = new EPSG4326TileSet( _tileSetReady, this.surveyCRS );

		break;


	default:

		return false;

	}

	this.workerPool = new WorkerPool( this.TS.workerScript );

	return true;

	function _tileSetReady () {

		self.tileSets = self.TS.getTileSets();

		if ( self.hasCoverage() ) {

			self.tileArea( self.limits );
			return true;

		}

		return false;

	}

};

WebTerrain.prototype.hasCoverage = function () {

	// iterate through available tileSets and pick the first match

	const limits = this.limits;
	const baseDirectory = Cfg.value( 'terrainDirectory', '' );
	const tileSets = this.tileSets;

	for ( var i = 0, l = tileSets.length; i < l; i++ ) {

		const tileSet = tileSets[ i ];

		const coverage = this.TS.getCoverage( limits, tileSet.minZoom );

		if (
			coverage.min_x >= tileSet.minX &&
			coverage.max_x <= tileSet.maxX &&
			coverage.min_y >= tileSet.minY &&
			coverage.max_y <= tileSet.maxY
		) {

			tileSet.directory = baseDirectory + tileSet.subdirectory;

			this.TS.tileSet = tileSet;
			this.isFlat = tileSet.isFlat;
			this.log = tileSet.log === undefined ? false : tileSet.log;
			this.attributions = tileSet.attributions;

			console.log( 'selected tile set:', tileSet.title );

			return true;

		}

	}

	return false;

};

WebTerrain.prototype.pickCoverage = function ( limits ) {

	const tileSet = this.TS.tileSet;

	var zoom = tileSet.maxZoom + 1;
	var coverage;

	do {

		coverage = this.TS.getCoverage( limits, --zoom );

	} while ( coverage.count > 4 && zoom > tileSet.minZoom );

	return coverage;

};

WebTerrain.prototype.loadTile = function ( x, y, z, parentTile, existingTile ) {

	const self = this;

	const tileSpec = this.TS.getTileSpec( x, y, z, this.limits );

	if ( tileSpec === null || tileSpec.clipped ) return;

	tileSpec.offsets = this.offsets,
	tileSpec.flatZ = this.flatZ;

	if ( this.log ) console.log( 'load: [ ', z +'/' + x + '/' + y, ']' );

	++this.tilesLoading;

	// get Tile instance.

	const tile = existingTile ? existingTile : new Tile( x, y, z, tileSpec );

	tile.setPending( parentTile ); // tile load/reload pending

	this.workerPool.runWorker( tileSpec, _mapLoaded );

	return;

	function _mapLoaded ( event ) {

		const tileData = event.data;
		const worker = event.currentTarget;

		// return worker to pool

		self.workerPool.putWorker( worker );

		--self.tilesLoading;

		// the survey/region in the viewer may have changed while the height maps are being loaded.
		// bail out in this case to avoid errors

		if ( self.dying ) {

			self.dispatchEvent( { type: 'progress', name: 'end' } );
			return;

		}

		// error out early if we or other tiles have failed to load.

		if ( tileData.status !== 'ok' || tile.parent.childErrors !== 0 ) {

			tile.setFailed();

			self.dispatchEvent( { type: 'progress', name: 'end' } );

			// signal error to caller
			if ( self.tilesLoading === 0 ) self.onLoaded( self.childErrors );

			return;

		}

		self.dispatchEvent( { type: 'progress', name: 'add', value: self.progressInc } );

		tile.createFromBufferAttributes( tileData.index, tileData.attributes, tileData.boundingBox, self.material );

		self.dispatchEvent( { type: 'progress', name: 'add', value: self.progressInc } );

		if ( tile.setLoaded( self.activeOverlay, self.opacity, _loaded ) ) {

			self.dispatchEvent( { type: 'progress', name: 'end' } );

		}

	}

	function _loaded () {

		self.isLoaded = true;
		self.onLoaded();

	}

};

WebTerrain.prototype.tileArea = function ( limits ) {

	const coverage = this.pickCoverage( limits );
	const zoom = coverage.zoom;

	this.currentLimits = limits;
	this.initialZoom = zoom;

	for ( var x = coverage.min_x; x < coverage.max_x + 1; x++ ) {

		for ( var y = coverage.min_y; y < coverage.max_y + 1; y++ ) {

			this.loadTile( x, y, zoom, this );

		}

	}

	if ( this.tilesLoading > 0 ) {

		this.dispatchEvent( { type: 'progress', name: 'start' } );
		this.progressInc = 100 / ( this.tilesLoading * 2 );

	}

	this.currentZoom = zoom;

	return;

};

WebTerrain.prototype.zoomTile = function ( tile ) {

	const zoom = tile.zoom + 1;
	const x = tile.x * 2;
	const y = tile.y * 2;

	this.loadTile( x,     y,     zoom, tile );
	this.loadTile( x + 1, y,     zoom, tile );
	this.loadTile( x,     y + 1, zoom, tile );
	this.loadTile( x + 1, y + 1, zoom, tile );

	this.dispatchEvent( { type: 'progress', name: 'start' } );
	this.progressInc = 100 / 8;

	this.currentZoom = zoom;

	return;

};

WebTerrain.prototype.setOverlay = function ( overlay, overlayLoadedCallback ) {

	if ( this.tilesLoading > 0 ) return;

	const self = this;
	const currentOverlay = this.activeOverlay;

	if ( currentOverlay !== null ) {

		if ( currentOverlay === overlay ) {

			return;

		} else {

			currentOverlay.setInactive();

		}

	}

	overlay.setActive();

	this.activeOverlay = overlay;

	this.traverse( _setTileOverlays );

	return;

	function _setTileOverlays ( obj ) {

		if ( ! obj.isTile ) return;

		obj.setOverlay( overlay, self.opacity, _overlayLoaded );

		self.overlaysLoading++;

	}

	function _overlayLoaded ( tile ) {

		tile.setOpacity( self.opacity );

		if ( --self.overlaysLoading === 0 ) overlayLoadedCallback();

	}

};

WebTerrain.prototype.removed = function () {

	const self = this;

	this.dying = true;

	this.traverse( _disposeTileMesh );

	this.commonRemoved();

	return;

	function _disposeTileMesh ( obj ) {

		if ( obj !== self ) obj.removed( obj );

	}

};

WebTerrain.prototype.setMaterial = function ( material ) {

	if ( this.tilesLoading > 0 ) return;

	this.traverse( _setTileMeshMaterial );

	this.activeOverlay = null;

	// use for commmon material access for opacity

	material.opacity = this.opacity;
	material.needsUpdate = true;
	material.fog = false;

	this.material = material;

	return;

	function _setTileMeshMaterial ( obj ) {

		if ( ! obj.isTile ) return;

		obj.setMaterial( material );

	}

};

WebTerrain.prototype.setOpacity = function ( opacity ) {

	this.opacity = opacity;

	if ( this.activeOverlay === null ) {

		if ( this.material ) {

			this.material.opacity = opacity;
			this.material.needsUpdate = true;

		}

	} else {

		// each tile has its own material, therefore need setting separately
		this.traverse( _setTileOpacity );

	}

	return;

	function _setTileOpacity ( obj ) {

		if ( obj.isTile ) obj.setOpacity( opacity );

	}

};

WebTerrain.prototype.zoomCheck = function ( camera ) {

	const maxZoom     = this.TS.tileSet.maxZoom;
	const initialZoom = this.initialZoom;
	const self = this;

	const frustum = new Frustum();

	const candidateTiles      = [];
	const candidateEvictTiles = [];
	const resurrectTiles      = [];

	var retry = false;
	var total, tile, i;

	if ( this.tilesLoading > 0 ) return true;

	camera.updateMatrix(); // make sure camera's local matrix is updated
	camera.updateMatrixWorld(); // make sure camera's world matrix is updated
	camera.matrixWorldInverse.getInverse( camera.matrixWorld );

	frustum.setFromMatrix( new Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );

	// scan scene graph of terrain

	this.traverse( _scanTiles );

	const resurrectCount = resurrectTiles.length;
	const candidateCount = candidateTiles.length;

	_evictTiles();

	if ( resurrectCount !== 0 ) {

		this.dispatchEvent( { type: 'progress', name: 'start' } );

		for ( i = 0; i < resurrectCount; i++ ) {

			const tile = resurrectTiles[ i ];

			if ( tile.isMesh ) {

				console.warn( 'resurrecting the undead!' );
				return;

			}

			// reload tile (use exiting tile object to preserve canZoom).
			this.loadTile( tile.x, tile.y, tile.zoom, tile.parent, tile );

			retry = true;

		}

		this.progressInc = 100 / ( 2 * resurrectCount );

	} else if ( candidateCount !== 0 ) {

		total = candidateTiles.reduce( function ( a, b ) { return { area: a.area + b.area }; } );

		for ( i = 0; i < candidateCount; i++ ) {

			if ( candidateTiles[ i ].area / total.area > 0.3 ) { // FIXME - weight by tile resolution to balance view across all visible areas first.

				tile = candidateTiles[ i ].tile;
				if ( tile.zoom < maxZoom ) {

					this.zoomTile( tile );
					retry = true;

				}

			}

		}

	}

	return retry;

	function _scanTiles( tile ) {

		const parent = tile.parent;

		if ( tile === self || ! tile.isTile || parent.resurrectionPending || ! parent.canZoom ) return;

		if ( frustum.intersectsBox( tile.getWorldBoundingBox() ) ) {

			// this tile intersects the screen

			if ( tile.children.length === 0 ) {

				if ( ! tile.isMesh ) {

					// this tile is not loaded, but has been previously
					if ( tile.evicted ) {

						tile.resurrectionPending = true;
						resurrectTiles.push( tile );

					}

				} else {

					// this tile is loaded, maybe increase resolution?
					if ( tile.canZoom ) candidateTiles.push( { tile: tile, area: tile.projectedArea( camera ) } );

				}

			} else {

				if ( ! tile.isMesh && tile.evicted && ! this.parent.resurrectionPending ) {

					tile.resurrectionPending = true;
					resurrectTiles.push( tile );

				}

			}

		} else {

			// off screen tile
			if ( tile.isMesh ) candidateEvictTiles.push( tile );

		}

	}

	function _evictTiles() {

		const EVICT_PRESSURE = 5;
		const evictCount = candidateEvictTiles.length;

		var i;

		if ( evictCount !== 0 ) {

			candidateEvictTiles.sort( _sortByPressure );

			for ( i = 0; i < evictCount; i++ ) {

				const tile = candidateEvictTiles[ i ];

				// heuristics for evicting tiles - needs refinement

				const pressure = Tile.liveTiles / EVICT_PRESSURE;
				const tilePressure = tile.evictionCount * Math.pow( 2, initialZoom - tile.zoom );

				//console.log( 'ir', initialZoom, 'p: ', pressure, ' tp: ', tilePressure, ( pressure > tilePressure ? '*** EVICTING ***' : 'KEEP' ) );

				if ( pressure > tilePressure ) tile.evict();

			}

		}

		function _sortByPressure( tileA, tileB ) {

			return tileA.evictionCount / tileA.zoom - tileB.evictionCount / tileB.zoom;

		}

	}

};

export { WebTerrain };

// EOF