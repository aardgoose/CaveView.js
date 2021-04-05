import { FEATURE_TERRAIN } from '../core/constants';

import {
	Vector3, Triangle, Box3, BufferGeometry,
	Float32BufferAttribute, Uint16BufferAttribute, Mesh
} from '../Three';

// preallocated for projected area calculations

const __a = new Vector3();
const __b = new Vector3();
const __c = new Vector3();
const __d = new Vector3();

const __t1 = new Triangle( __a, __b, __c );
const __t2 = new Triangle( __a, __c, __d );

class Tile extends Mesh {

	constructor ( ctx, x, y, zoom, tileSpec ) {

		super( new BufferGeometry(), ctx.materials.getSurfaceMaterial() );

		this.x = x;
		this.y = y;

		this.zoom    = zoom;
		this.tileSet = tileSpec.tileSet;
		this.clip    = tileSpec.clip;
		this.clippedFraction = tileSpec.clippedFraction;

		this.canZoom  = ( zoom < tileSpec.tileSet.overlayMaxZoom );
		this.evicted  = false;
		this.replaced = false;
		this.evictionCount = 0;
		this.lastFrame = 0;
		this.childrenLoading = 0;
		this.childErrors = 0;
		this.area = 0;

		this.boundingBox = null;
		this.worldBoundingBox = null;

		this.type = 'Tile';
		this.isTile = false;

	}

}

Tile.liveTiles = 0;

Tile.prototype.onBeforeRender = function ( renderer ) {

	this.lastFrame = renderer.info.render.frame;

};

Tile.prototype.createFromTileData = function ( tileData, material ) {

	const attributes = tileData.attributes;
	const index = tileData.index;
	const boundingBox = tileData.boundingBox;

	var attributeName;
	var attribute;
	var bufferGeometry = this.geometry;

	// assemble BufferGeometry from binary buffer objects transfered from worker

	for ( attributeName in attributes ) {

		attribute = attributes[ attributeName ];
		bufferGeometry.setAttribute( attributeName, new Float32BufferAttribute( attribute.array, attribute.itemSize ) );

	}

	bufferGeometry.setIndex( new Uint16BufferAttribute( index, 1 ) );

	// use precalculated bounding box rather than recalculating it here.

	bufferGeometry.boundingBox = new Box3(
		new Vector3( boundingBox.min.x, boundingBox.min.y, boundingBox.min.z ),
		new Vector3( boundingBox.max.x, boundingBox.max.y, boundingBox.max.z )
	);

	this.boundingBox = bufferGeometry.boundingBox;

	// discard javascript attribute buffers after upload to GPU
	this.dropBuffers();

	this.layers.set( FEATURE_TERRAIN );

	this.material = material;
	this.isTile = true;

	// handle specific tile data (Cesium has leaf status tiles)
	this.canZoom = tileData.canZoom && this.canZoom;

	// this is safe, we are already in the scene graph from .setPending()
	if ( this.worldBoundingBox === null ) {

		this.updateWorldMatrix( true, false );
		this.worldBoundingBox = this.boundingBox.clone().applyMatrix4( this.matrixWorld );

	}

	return this;

};

Tile.prototype.empty = function () {

	this.isMesh = false;

	if ( this.geometry ) {

		this.geometry.dispose();
		this.geometry = new BufferGeometry();

	}

	--Tile.liveTiles;

};

Tile.prototype.evict = function () {

	this.evicted = true;
	this.replaced = false;
	this.evictionCount = 0;

	this.children.forEach( tile => tile.evict() );
	this.empty();

};

Tile.prototype.setReplaced = function () {

	this.evicted = false;
	this.replaced = true;

	this.empty();

};

Tile.prototype.setSkipped = function () {

	this.parent.childrenLoading--;

	this.evicted = false;
	this.replaced = true;

};

Tile.prototype.setPending = function ( parentTile ) {

	if ( parentTile && this.parent === null ) {

		parentTile.addStatic( this );

	}

	this.parent.childrenLoading++;

	this.isMesh = false;
	this.evicted = false;
	this.replaced = false;
	this.evictionCount = 0;

};

Tile.prototype.setFailed = function () {

	const parent = this.parent;

	parent.childErrors++;
	parent.childrenLoading--;
	parent.canZoom = false;

	parent.remove( this );

};

Tile.prototype.setLoaded = function ( overlay, renderCallback ) {

	const parent = this.parent;

	var tilesWaiting = 0;

	if ( --parent.childrenLoading === 0 ) { // this tile and all siblings loaded

		if ( parent.childErrors === 0 ) { // all loaded without error

			if ( parent.isTile ) parent.setReplaced();

			parent.children.forEach( sibling => {

				if ( sibling.replaced || sibling.evicted ) return;

				if ( overlay === null ) {

					sibling.isMesh = true;
					Tile.liveTiles++;

				} else {

					// delay finalising until overlays loaded - avoids flash of raw surface
					tilesWaiting++;

					sibling
						.setOverlay( overlay )
						.then( tile => {

							tile.isMesh = true;
							Tile.liveTiles++;

							if ( --tilesWaiting === 0 ) renderCallback( this.canZoom );
							return;

						} );

				}

			} );

			if ( tilesWaiting === 0 ) renderCallback( false ); // we have no overlay so don't encourage zooming

			return;

		} else {

			parent.remove( this );

		}

	}

	renderCallback( false );

};

Tile.prototype.removed = function () {

	if ( this.geometry ) this.geometry.dispose();

};

Tile.prototype.setMaterial = function ( material ) {

	this.material = material;

};

Tile.prototype.setThroughMode = function ( mode ) {

	if ( ! this.isTile || ! this.isMesh ) return;

	this.material.setThroughMode( mode );

};

Tile.prototype.setOverlay = function ( overlay ) {

	return overlay
		.getTile( this.x, this.y, this.zoom )
		.then( material => {

			if ( material !== null ) {

				this.material = material;
				material.setThroughMode( overlay.throughMode );

			}

			return this;

		} );

};

Tile.prototype.computeProjectedArea = function ( camera ) {

	const boundingBox = this.worldBoundingBox;
	const z = boundingBox.max.z;

	__a.copy( boundingBox.min ).setZ( z );
	__c.copy( boundingBox.max );

	__b.set( __a.x, __c.y, z );
	__d.set( __c.x, __a.y, z );

	// clamping reduces accuracy of area but stops offscreen area contributing to zoom pressure
	// .clampScalar( -1, 1 );

	__a.project( camera );
	__b.project( camera );
	__c.project( camera );
	__d.project( camera );

	this.area = ( __t1.getArea() + __t2.getArea() ) / this.clippedFraction;

	return this;

};

export { Tile };