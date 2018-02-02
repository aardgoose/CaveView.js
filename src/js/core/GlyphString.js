import {
	InstancedBufferGeometry,
	InstancedBufferAttribute,
	Float32BufferAttribute,
	Uint16BufferAttribute,
	Mesh
} from '../Three';

function onUploadDropBuffer() {

	// call back from BufferAttribute to drop JS buffers after data has been transfered to GPU
	this.array = null;

}

GlyphString.cache = new Map();

function GlyphStringGeometryCache ( material ) {

	this.material = material;
	this.cache = {};

}

GlyphStringGeometryCache.prototype.getGeometry = function ( text ) {

	var entry = this.cache[ text ];

	if ( entry === undefined ) {

		entry = new GlyphStringGeometry( text, this.material.getAtlas() );
		this.cache[ text ] = entry;

	}

	return entry;

};

function GlyphStringGeometry ( text, glyphAtlas ) {

	InstancedBufferGeometry.call( this );

	this.type = 'GlyphStringGeometry';
	this.name = text;
	this.width = 0;

	const indexAttribute = new Uint16BufferAttribute( [ 0, 2, 1, 0, 3, 2 ], 1 );

	// unit square
	const positions = [
		0, 0, 0,
		0, 1, 0,
		1, 1, 0,
		1, 0, 0
	];

	var positionAttribute = new Float32BufferAttribute( positions, 3 );

	this.setIndex( indexAttribute );
	this.addAttribute( 'position', positionAttribute );

	const l = text.length;

	const uvs = new Float32Array( l * 2 );
	const widths = new Float32Array( l );
	const offsets = new Float32Array( l );

	this.glyphAtlas = glyphAtlas;

	this.width = this.setStringAttributes( text, uvs, offsets, widths );

	this.addAttribute( 'instanceUvs', new InstancedBufferAttribute( uvs, 2, 1 ) );
	this.addAttribute( 'instanceOffsets', new InstancedBufferAttribute( offsets, 1, 1 ) );
	this.addAttribute( 'instanceWidths', new InstancedBufferAttribute( widths, 1, 1 ) );

	this.computeBoundingSphere();

}

GlyphStringGeometry.indexAttribute = null;
GlyphStringGeometry.positionAttribute = null;

GlyphStringGeometry.prototype = Object.assign( Object.create( InstancedBufferGeometry.prototype ), {

	constructor: GlyphStringGeometry

} );

GlyphStringGeometry.prototype.replaceString = function ( text ) {

	const l = this.name.length;

	const uvs = new Float32Array( l * 2 );
	const widths = new Float32Array( l );
	const offsets = new Float32Array( l );

	this.width = this.setStringAttributes( text, uvs, offsets, widths );

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

	return offset;

};

function GlyphString ( text, glyphMaterial ) {

	var geometry;

	if ( this.isMutableGlyphString ) {

		geometry = new GlyphStringGeometry( text, glyphMaterial.getAtlas() );

	} else {

		let cache = GlyphString.cache.get( glyphMaterial );

		if ( cache === undefined ) {

			cache = new GlyphStringGeometryCache( glyphMaterial );
			GlyphString.cache.set( glyphMaterial, cache );

		}

		geometry = cache.getGeometry( text );

	}

	Mesh.call( this, geometry, glyphMaterial );

	this.name = text;
	this.frustumCulled = false;

	const attributes = geometry.attributes;

	if ( ! this.isMutableGlyphString ) {

		for ( var name in attributes ) attributes[ name ].onUpload( onUploadDropBuffer );

	}

}

GlyphString.prototype = Object.assign( Object.create( Mesh.prototype ), {

	constructor: GlyphString,

	isGlyphString: true,

	getWidth: function () {

		return this.geometry.width;

	}

} );

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