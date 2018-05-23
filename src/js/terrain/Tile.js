
import { FEATURE_TERRAIN } from '../core/constants';
import { StencilLib } from '../core/StencilLib';
import { Materials } from '../materials/Materials';

import {
	Vector3, Triangle, Box3,
	BufferGeometry,
	Float32BufferAttribute,
	Uint16BufferAttribute,
	Mesh
} from '../Three';


// preallocated for projected area calculations

const __a = new Vector3();
const __b = new Vector3();
const __c = new Vector3();
const __d = new Vector3();

const __t1 = new Triangle( __a, __b, __c );
const __t2 = new Triangle( __a, __c, __d );

function onUploadDropBuffer() {

	// call back from BufferAttribute to drop JS buffers after data has been transfered to GPU
	this.array = null;

}

function Tile ( x, y, zoom, tileSpec ) {

	this.x = x;
	this.y = y;

	this.zoom    = zoom;
	this.tileSet = tileSpec.tileSet;
	this.clip    = tileSpec.clip;
	this.clippedFraction = tileSpec.clippedFraction;

	this.canZoom  = true;
	this.evicted  = false;
	this.replaced = false;
	this.evictionCount = 1;
	this.resurrectionPending = false;
	this.childrenLoading = 0;
	this.childErrors = 0;
	this.area = 0;

	this.boundingBox = null;
	this.worldBoundingBox = null;

	Mesh.call( this, new BufferGeometry(), Materials.getCursorMaterial() );

	this.type = 'Tile';
	this.isTile = true;

	return this;

}

Tile.liveTiles = 0;

Tile.prototype = Object.create( Mesh.prototype );

Tile.prototype.onBeforeRender = StencilLib.terrainOnBeforeRender;
Tile.prototype.onAfterRender = StencilLib.terrainOnAfterRender;

Tile.prototype.createFromBufferAttributes = function ( index, attributes, boundingBox, material ) {

	var attributeName;
	var attribute;
	var bufferGeometry = this.geometry;

	// assemble BufferGeometry from binary buffer objects transfered from worker

	for ( attributeName in attributes ) {

		attribute = attributes[ attributeName ];
		bufferGeometry.addAttribute( attributeName, new Float32BufferAttribute( attribute.array, attribute.itemSize ) );

	}

	bufferGeometry.setIndex( new Uint16BufferAttribute( index, 1 ) );

	// use precalculated bounding box rather than recalculating it here.

	bufferGeometry.boundingBox = new Box3(
		new Vector3( boundingBox.min.x, boundingBox.min.y, boundingBox.min.z ),
		new Vector3( boundingBox.max.x, boundingBox.max.y, boundingBox.max.z )
	);

	attributes = bufferGeometry.attributes;

	// discard javascript attribute buffers after upload to GPU

	for ( var name in attributes ) attributes[ name ].onUpload( onUploadDropBuffer );

	this.geometry.index.onUpload( onUploadDropBuffer );

	this.layers.set( FEATURE_TERRAIN );

	this.material = material;

	return this;

};

Tile.prototype.getWorldBoundingBox = function () {

	if ( this.worldBoundingBox === null ) {

		this.updateMatrixWorld();

		const boundingBox = this.geometry.boundingBox.clone();

		boundingBox.applyMatrix4( this.matrixWorld );

		this.worldBoundingBox = boundingBox;

	}

	return this.worldBoundingBox;

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

	this.evictionCount++;
	this.evicted = true;
	this.replaced = false;

	this.empty();

};

Tile.prototype.setReplaced = function () {

	this.evicted = false;
	this.replaced = true;

	this.empty();

};


Tile.prototype.setPending = function ( parentTile ) {

	if ( parentTile && this.parent === null ) {

		parentTile.addStatic( this );

	}

	this.parent.childrenLoading++;

	this.isMesh = false;
	this.evicted = false;

};

Tile.prototype.setFailed = function () {

	const parent = this.parent;

	parent.childErrors++;
	parent.childrenLoading--;
	parent.canZoom = false;

	parent.remove( this );

};

Tile.prototype.setLoaded = function ( overlay, opacity, renderCallback ) {

	const parent = this.parent;

	var tilesWaiting = 0;

	if ( --parent.childrenLoading === 0 ) { // this tile and all siblings loaded

		if ( parent.childErrors === 0 ) { // all loaded without error

			if ( parent.isTile ) parent.setReplaced();

			const siblings = parent.children;

			for ( var i = 0, l = siblings.length; i < l; i++ ) {

				const sibling = siblings[ i ];

				if ( sibling.replaced || sibling.evicted ) continue;

				if ( overlay === null ) {

					sibling.isMesh = true;
					Tile.liveTiles++;

				} else {

					// delay finalising until overlays loaded - avoids flash of raw surface
					sibling.setOverlay( overlay, opacity, _completed );
					tilesWaiting++;

				}

			}

			if ( tilesWaiting === 0 ) renderCallback( parent.childErrors );

			return true;

		} else {

			parent.remove( this );

		}

	}

	return false;

	function _completed( tile ) {

		tile.isMesh = true;
		Tile.liveTiles++;

		if ( --tilesWaiting === 0 ) renderCallback( parent.childErrors );

	}

};

Tile.prototype.removed = function () {

	if ( this.geometry ) this.geometry.dispose();

};

Tile.prototype.setMaterial = function ( material ) {

	this.material = material;

};

Tile.prototype.setOpacity = function ( opacity ) {

	const material = this.material;

	material.opacity = opacity;
	material.needsUpdate = true;

};

Tile.prototype.setOverlay = function ( overlay, opacity, imageLoadedCallback ) {

	const self = this;

	overlay.getTile( this.x, this.y, this.zoom, opacity, _overlayLoaded );

	return;

	function _overlayLoaded ( material ) {

		if ( material !== null ) self.material = material;

		imageLoadedCallback( self );

	}

};

Tile.prototype.computeProjectedArea = function ( camera ) {

	const boundingBox = this.getWorldBoundingBox();
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

// EOF