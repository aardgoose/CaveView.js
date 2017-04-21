
import { FEATURE_TERRAIN } from '../core/constants';

import {
	Vector3, Triangle, Box3,
	BufferGeometry,
	Float32BufferAttribute,
	Uint16BufferAttribute,
	Mesh
} from '../../../../three.js/src/Three';

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

	this.boundingBox = null;
	this.worldBoundingBox = null;

	Mesh.call( this );

	this.type = 'Tile';

	return this;

}

Tile.prototype = Object.create( Mesh.prototype );

Tile.prototype.constructor = Tile;

Tile.liveTiles = 0;
Tile.overlayImages = new Map();

Tile.prototype.create = function ( terrainTileGeometry ) {

	terrainTileGeometry.computeBoundingBox();

	this.geometry = terrainTileGeometry;

	this.createCommon();

	return this;

};

Tile.prototype.createCommon = function () {

	var attributes = this.geometry.attributes;

	// discard javascript attribute buffers after upload to GPU
	for ( var name in attributes ) attributes[ name ].onUpload( onUploadDropBuffer );

	this.layers.set( FEATURE_TERRAIN );

};

Tile.prototype.createFromBufferAttributes = function ( index, attributes, boundingBox ) {

	var attributeName;
	var attribute;
	var bufferGeometry = new BufferGeometry();

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

	this.geometry = bufferGeometry;

	this.createCommon();

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

Tile.prototype.evict = function () {

	this.evictionCount++; 
	this.evicted  = true;
	this.replaced = false;
	this.isMesh   = false;

	if ( ! this.boundingBox ) {

		console.warn( 'FIXUP :', this.x, this.y );
		this.getWorldBoundingBox();

	}

	this.geometry.dispose();

	--Tile.liveTiles;

};

Tile.prototype.setReplaced = function () {

	this.evicted = false;
	this.replaced = true;
	this.isMesh = false;

	if ( this.geometry ) this.geometry.dispose();

	if ( ! this.boundingBox ) {

		console.warn( 'FIXUP :', this.x, this.y );
		this.getWorldBoundingBox();

	}

	--Tile.liveTiles;

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

		imageLoadedCallback();

	}

};

Tile.prototype.getParent = function () {

	return this.parent;

};

Tile.prototype.projectedArea = function ( camera ) {

	var boundingBox = this.getWorldBoundingBox();

	var v1 = boundingBox.min.clone();
	var v3 = boundingBox.max.clone();

	v1.z = 0;
	v3.z = 0;

	var v2 = new Vector3( v3.x, v1.y, 0 );
	var v4 = new Vector3( v1.x, v3.y, 0 );

	// clamping reduces accuracy of area but stops offscreen area contributing to zoom pressure

	v1.project( camera ).clampScalar( -1, 1 );
	v2.project( camera ).clampScalar( -1, 1 );
	v3.project( camera ).clampScalar( -1, 1 );
	v4.project( camera ).clampScalar( -1, 1 );

	var t1 = new Triangle( v1, v3, v4 );
	var t2 = new Triangle( v1, v2, v3 );

	return t1.area() + t2.area();

};

export { Tile };

// EOF