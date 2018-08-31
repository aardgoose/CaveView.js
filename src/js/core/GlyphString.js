import {
	InstancedBufferGeometry,
	InstancedBufferAttribute,
	Mesh
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
	this.frustumCulled = false;

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