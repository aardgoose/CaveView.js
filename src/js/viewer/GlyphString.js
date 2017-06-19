import {
	InstancedBufferGeometry,
	InstancedBufferAttribute,
	Float32BufferAttribute,
	Uint16BufferAttribute,
	Mesh
} from '../../../../three.js/src/Three';


function GlyphStringGeometry ( text, glyphAtlas ) {

	InstancedBufferGeometry.call( this );

	this.type = 'GlyphStringGeometry';
	this.name = text;
	this.width = 0;

	var indexAttribute = new Uint16BufferAttribute( [ 0, 2, 1, 0, 3, 2 ], 1 );

	// unit square 
	var positions = [
		0, 0, 0,
		0, 1, 0,
		1, 1, 0,
		1, 0, 0
	];

	var positionAttribute = new Float32BufferAttribute( positions, 3 );

	this.setIndex( indexAttribute );
	this.addAttribute( 'position', positionAttribute );

	var i, l, glyphData;
	var offset = 0;

	l = text.length;

	var uvs = new Float32Array( l * 2 );
	var widths = new Float32Array( l );
	var offsets = new Float32Array( l );

	for ( i = 0; i < l; i++ ) {

		if ( text.charCodeAt() === 0 ) continue; // skip null characters

		glyphData = glyphAtlas.getGlyph( text[ i ] );

		uvs[ i * 2 ] = glyphData.column;
		uvs[ i * 2 + 1 ] = glyphData.row;

		widths[ i ] = glyphData.width;

		offsets[ i ] = offset;

		offset += glyphData.width;

	}

	this.width = offset;

	this.addAttribute( 'instanceUvs', new InstancedBufferAttribute( uvs, 2, 1 ) );
	this.addAttribute( 'instanceOffsets', new InstancedBufferAttribute( offsets, 1, 1 ) );
	this.addAttribute( 'instanceWidths', new InstancedBufferAttribute( widths, 1, 1 ) );

}

GlyphStringGeometry.indexAttribute = null;
GlyphStringGeometry.positionAttribute = null;

GlyphStringGeometry.prototype = Object.assign( Object.create( InstancedBufferGeometry.prototype ), {

	constructor: GlyphStringGeometry

} );


function GlyphString ( text, glyphMaterial ) {

	var geometry = new GlyphStringGeometry( text, glyphMaterial.getAtlas() );

	Mesh.call( this, geometry, glyphMaterial );

	this.type = 'GlyphString';
	this.name = text;
	this.frustumCulled = false;

}

GlyphString.prototype = Object.assign( Object.create( Mesh.prototype ), {

	constructor: GlyphString,

	isGlyphString: true,

	getWidth: function () {

		return this.geometry.width;

	}

} );

export { GlyphString };

// EOF