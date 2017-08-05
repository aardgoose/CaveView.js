
import { FEATURE_TERRAIN } from '../core/constants';
import { terrainLib } from './terrainLib';
import { Materials } from '../materials/Materials';

import {
	Vector3, Triangle, Box3,
	BufferGeometry,
	Float32BufferAttribute,
	Uint16BufferAttribute,
	Mesh
} from '../../../../three.js/src/Three';


// preallocated for projected area calculations

var A = new Vector3();
var B = new Vector3();
var C = new Vector3();
var D = new Vector3();

var T1 = new Triangle( A, B, C );
var T2 = new Triangle( A, C, D );

function onUploadDropBuffer() {

	// call back from BufferAttribute to drop JS buffers after data has been transfered to GPU
	this.array = null;

}

function Tile ( x, y, zoom, tileSet, clip ) {

	this.x = x;
	this.y = y;

	this.zoom    = zoom;
	this.tileSet = tileSet;
	this.clip    = clip;

	this.canZoom       = true;
	this.evicted       = false;
	this.replaced      = false;
	this.evictionCount = 1;
	this.resurrectionPending = false;
	this.childrenLoading = 0;
	this.childErrors     = 0;

	this.boundingBox = null;
	this.worldBoundingBox = null;

	Mesh.call( this, new BufferGeometry(), Materials.getSurfaceMaterial() );

	this.onBeforeRender = terrainLib.onBeforeRender;
	this.onAfterRender = terrainLib.onAfterRender;

	return this;

}

Tile.liveTiles = 0;

Tile.prototype = Object.create( Mesh.prototype );

Tile.prototype.constructor = Tile;

Tile.prototype.type = 'Tile';
Tile.prototype.isTile = true;

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

	var boundingBox;

	if ( this.worldBoundingBox === null ) {

		this.updateMatrixWorld();

		boundingBox = this.getBoundingBox().clone();
		boundingBox.applyMatrix4( this.matrixWorld );

		this.worldBoundingBox = boundingBox;

	}

	return this.worldBoundingBox;

};

Tile.prototype.getBoundingBox = function () {

	var boundingBox;

	if ( this.boundingBox === null ) {

		boundingBox = this.geometry.boundingBox.clone();

		var adj = 5; // adjust to cope with overlaps // FIXME - was resolution

		boundingBox.min.x += adj;
		boundingBox.min.y += adj;
		boundingBox.max.x -= adj;
		boundingBox.max.y -= adj;

		this.boundingBox = boundingBox;

	}

	return this.boundingBox;

};

Tile.prototype.empty = function () {

	this.isMesh = false;

	if ( ! this.boundingBox ) {

		console.warn( 'FIXUP :', this.x, this.y );
		this.getWorldBoundingBox();

	}

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

		parentTile.add( this );

	}

	this.parent.childrenLoading++;

	this.isMesh = false;
	this.evicted = false;

};

Tile.prototype.setFailed = function () {

	var parent = this.parent;

	parent.childErrors++;
	parent.childrenLoading--;
	parent.canZoom = false;

	parent.remove( this );

};

Tile.prototype.setLoaded = function ( overlay, opacity, renderCallback ) {

	var parent = this.parent;
	var tilesWaiting = 0;

	if ( --parent.childrenLoading === 0 ) { // this tile and all siblings loaded

		if ( parent.childErrors === 0 ) { // all loaded without error

			if ( parent.isTile ) parent.setReplaced();

			var siblings = parent.children;

			for ( var i = 0, l = siblings.length; i < l; i++ ) {

				var sibling = siblings[ i ];

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

			if ( tilesWaiting === 0 ) renderCallback();

			return true;

		} else {

			parent.remove( this );

		}

	}

	return false;

	function _completed( tile ) {

		tile.isMesh = true;
		Tile.liveTiles++;

		if ( --tilesWaiting === 0 ) renderCallback();

	}

};

Tile.prototype.removed = function () {

	if ( this.geometry ) this.geometry.dispose();

};

Tile.prototype.setMaterial = function ( material ) {

	this.material = material;

};

Tile.prototype.setOpacity = function ( opacity ) {

	var material = this.material;

	material.opacity = opacity;
	material.needsUpdate = true;

};

Tile.prototype.setOverlay = function ( overlay, opacity, imageLoadedCallback ) {

	var self = this;

	overlay.getTile( this.x, this.y, this.zoom, opacity, _overlayLoaded );

	return;

	function _overlayLoaded ( material ) {

		self.material = material;
		imageLoadedCallback( self );

	}

};

Tile.prototype.projectedArea = function ( camera ) {

	var boundingBox = this.getWorldBoundingBox();

	var z = boundingBox.max.z;

	A.copy( boundingBox.min ).setZ( z );
	C.copy( boundingBox.max );

	B.set( A.x, C.y, z );
	D.set( C.x, A.y, z );

// clamping reduces accuracy of area but stops offscreen area contributing to zoom pressure
// .clampScalar( -1, 1 );

	A.project( camera );
	B.project( camera );
	C.project( camera );
	D.project( camera );


	return T1.area() + T2.area();

};

export { Tile };

// EOF