import {
	InstancedBufferGeometry,
	InstancedBufferAttribute,
	Mesh, Vector3, Triangle,
	Object3D
} from '../Three';

import { CommonAttributes } from './CommonAttributes';

function onUploadDropBuffer() {

	// call back from BufferAttribute to drop JS buffers after data has been transfered to GPU
	this.array = null;

}

const glyphStringCache = new Map();

function GlyphStringGeometryCache ( material ) {

	this.material = material;
	this.cache = {};

}

const __v0 = new Vector3();
const __v1 = new Vector3();
const __v2 = new Vector3();
const __v3 = new Vector3();
const __v4 = new Vector3();

const __triangle1 = new Triangle();
const __triangle2 = new Triangle();

GlyphStringGeometryCache.prototype.getGeometry = function ( text ) {

	var entry = this.cache[ text ];

	if ( entry === undefined ) {

		entry = new GlyphStringGeometry( text, this.material.getAtlas() );
		this.cache[ text ] = entry;
		entry.isCached = true;

	}

	return entry;

};

function GlyphStringGeometry ( text, glyphAtlas ) {

	InstancedBufferGeometry.call( this );

	this.type = 'GlyphStringGeometry';
	this.name = text;
	this.width = 0;

	this.setIndex( CommonAttributes.index );
	this.addAttribute( 'position', CommonAttributes.position );

	const l = text.length;

	const uvs = new Float32Array( l * 2 );
	const widths = new Float32Array( l );
	const offsets = new Float32Array( l );

	this.glyphAtlas = glyphAtlas;

	this.setStringAttributes( text, uvs, offsets, widths );

	this.addAttribute( 'instanceUvs', new InstancedBufferAttribute( uvs, 2, false, 1 ) );
	this.addAttribute( 'instanceOffsets', new InstancedBufferAttribute( offsets, 1, false, 1 ) );
	this.addAttribute( 'instanceWidths', new InstancedBufferAttribute( widths, 1, false, 1 ) );

	this.computeBoundingSphere();

}

GlyphStringGeometry.prototype = Object.assign( Object.create( InstancedBufferGeometry.prototype ), {

	constructor: GlyphStringGeometry

} );

GlyphStringGeometry.prototype.replaceString = function ( text ) {

	const l = this.name.length;

	const uvs = new Float32Array( l * 2 );
	const widths = new Float32Array( l );
	const offsets = new Float32Array( l );

	this.setStringAttributes( text, uvs, offsets, widths );

	const instanceUvs = this.getAttribute( 'instanceUvs' );
	const instanceOffsets = this.getAttribute( 'instanceOffsets' );
	const instanceWidths = this.getAttribute( 'instanceWidths' );

	instanceUvs.copyArray( uvs );
	instanceOffsets.copyArray( offsets );
	instanceWidths.copyArray( widths );

	instanceUvs.needsUpdate = true;
	instanceOffsets.needsUpdate = true;
	instanceWidths.needsUpdate = true;

};

GlyphStringGeometry.prototype.setStringAttributes = function ( text, uvs, offsets, widths ) {

	const l = text.length, glyphAtlas = this.glyphAtlas;

	var i, offset = 0;

	for ( i = 0; i < l; i++ ) {

		if ( text.charCodeAt() === 0 ) continue; // skip null characters

		const glyphData = glyphAtlas.getGlyph( text[ i ] );

		uvs[ i * 2 ] = glyphData.column;
		uvs[ i * 2 + 1 ] = glyphData.row;

		widths[ i ] = glyphData.width;

		offsets[ i ] = offset;

		offset += glyphData.width;

	}

	this.width = offset;

};

GlyphStringGeometry.prototype.dispose = function () {

	if ( this.isCached ) return;

	InstancedBufferGeometry.prototype.dispose.call( this );

};

function GlyphString ( text, glyphMaterial ) {

	var geometry;

	if ( this.isMutableGlyphString ) {

		geometry = new GlyphStringGeometry( text, glyphMaterial.getAtlas() );

	} else {

		let cache = glyphStringCache.get( glyphMaterial );

		if ( cache === undefined ) {

			// create material cache
			cache = new GlyphStringGeometryCache( glyphMaterial );
			glyphStringCache.set( glyphMaterial, cache );

		}

		geometry = cache.getGeometry( text );

	}

	Mesh.call( this, geometry, glyphMaterial );

	this.name = text;

	if ( ! this.isMutableGlyphString ) {

		geometry.getAttribute( 'instanceUvs' ).onUpload( onUploadDropBuffer );
		geometry.getAttribute( 'instanceOffsets' ).onUpload( onUploadDropBuffer );
		geometry.getAttribute( 'instanceWidths' ).onUpload( onUploadDropBuffer );

	}

}

GlyphString.prototype = Object.create( Mesh.prototype );

GlyphString.prototype.isGlyphString = true;

GlyphString.prototype.getWidth = function () {

	return this.geometry.width * this.material.scaleFactor;

};

GlyphString.prototype.getHeight = function () {

	return this.material.scaleFactor;

};

GlyphString.prototype.intersects = function ( position, camera, scale ) {

	if ( ! this.visible ) return false;

	const width = this.getWidth() / scale.x;
	const height = this.getHeight() / scale.y;
	const rotation = this.material.rotation;

	// mouse position in NDC
	__v0.set( position.x, position.y, 0 );

	// label bottom left in NDC
	__v1.setFromMatrixPosition( this.modelViewMatrix );
	__v1.applyMatrix4( camera.projectionMatrix );

	this.depth = __v1.z;

	__v1.z = 0;

	if ( isNaN( __v1.x ) ) return;

	// remaining vertices of label
	__v2.set( width, 0, 0 ).applyAxisAngle( Object3D.DefaultUp, rotation );
	__v3.set( width, height, 0 ).applyAxisAngle( Object3D.DefaultUp, rotation );
	__v4.set( 0, height, 0 ).applyAxisAngle( Object3D.DefaultUp, rotation );

	// adjust for aspect ratio
	__v2.y *= scale.x / scale.y;
	__v3.y *= scale.x / scale.y;
	__v4.y *= scale.x / scale.y;

	__v2.add( __v1 );
	__v3.add( __v1 );
	__v4.add( __v1 );

	__triangle1.set( __v1, __v2, __v3 );
	__triangle2.set( __v1, __v3, __v4 );

	return (
		( __triangle1.containsPoint( __v0 ) ) ||
		( __triangle2.containsPoint( __v0 ) )
	);

};

function MutableGlyphString ( text, material ) {

	GlyphString.call( this, text, material );

}

MutableGlyphString.prototype = Object.create( GlyphString.prototype );

MutableGlyphString.prototype.isMutableGlyphString = true;

MutableGlyphString.prototype.replaceString = function ( newstring ) {

	if ( newstring.length !== this.name.length ) {

		console.warn( 'new string has invalid length', newstring, this.name.length, newstring.length );
		return;

	}

	this.geometry.replaceString( newstring );

};

export { GlyphString, MutableGlyphString };

// EOF