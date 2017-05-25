import {
	InstancedBufferGeometry,
	InstancedBufferAttribute,
	Float32BufferAttribute,
	Mesh
} from '../../../../three.js/src/Three';


function GlyphStringGeometry ( text, glyphAtlas ) {

	InstancedBufferGeometry.call( this );

	this.type = 'GlyphStringGeometry';
	this.name = text;

	var index = [ 0, 2, 1, 0, 3, 2 ];

	if ( GlyphStringGeometry.positionAttribute === null ) {

		var positions = [ 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0 ];

		GlyphStringGeometry.positionAttribute = new Float32BufferAttribute( positions, 3 );

	}

	this.setIndex( index );
	this.addAttribute( 'position', GlyphStringGeometry.positionAttribute );

	var i, l, glyphData;
	var offset = 0;

	l = text.length;

	var uvs = new Float32Array( l * 2 );
	var widths = new Float32Array( l );
	var offsets = new Float32Array( l * 2 );

	for ( i = 0; i < l; i++ ) {

		glyphData = glyphAtlas.getGlyph( text[ i ] );

		uvs[ i * 2 ] = glyphData.column;
		uvs[ i * 2 + 1 ] = glyphData.row;

		widths[ i ] = glyphData.width;

		offsets[ i * 2 ] = offset;
		offsets[ i * 2 + 1 ] = 0;

		offset += glyphData.width; // FIXME need translating into correct space

	}

	this.addAttribute( 'instanceUvs', new InstancedBufferAttribute( uvs, 2, 1 ) );
	this.addAttribute( 'instanceOffsets', new InstancedBufferAttribute( offsets, 2, 1 ) );
	this.addAttribute( 'instanceWidths', new InstancedBufferAttribute( widths, 1, 1 ) );

}

GlyphStringGeometry.indexAttribute = null;
GlyphStringGeometry.positionAttribute = null;

GlyphStringGeometry.prototype = Object.assign( Object.create( InstancedBufferGeometry.prototype ), {

	constructor: GlyphStringGeometry

} );

function GlyphString ( text, glyphAtlas ) {

	var geometry = new GlyphStringGeometry( text, glyphAtlas );

	Mesh.call( this, geometry, glyphAtlas.getMaterial() );

	this.type = 'GlyphString';
//	this.frustumCulled = false;

}

GlyphString.prototype = Object.assign( Object.create( Mesh.prototype ), {

	constructor: GlyphString,

	isGlyphString: true

} );

export { GlyphString };

// EOF