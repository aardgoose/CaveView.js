import { CanvasTexture } from '../Three';

function GlyphAtlas ( glyphAtlasSpec ) {

	const atlasSize = 512;
	const cellSize = 32;
	const fontSize = 32;
	const divisions = atlasSize / cellSize;

	const canvas = document.createElement( 'canvas' );
	const map = {};

	const glyphs = '\u202f\u00B0\u2610 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%,.-_/()\'';
	const glyphCount = glyphs.length;

	if ( glyphCount > divisions * divisions ) {

		console.error( 'too many glyphs for atlas' );
		return;

	}

	if ( ! canvas ) console.error( 'creating canvas for glyph atlas failed' );

	canvas.width  = atlasSize;
	canvas.height = atlasSize;

	var d = document.getElementById( 'scratch' );

	d.appendChild( canvas );

	const ctx = canvas.getContext( '2d' );

	if ( ! ctx ) console.error( 'cannot obtain 2D canvas' );

	// set background
	ctx.fillStyle = glyphAtlasSpec.background || 'rgba( 0, 0, 0, 0 )';

	ctx.fillRect( 0, 0, atlasSize, atlasSize );

	// populate with glyphs

	ctx.textAlign = 'left';
	ctx.font = fontSize + 'px ' + glyphAtlasSpec.font;
	ctx.fillStyle = glyphAtlasSpec.color || '#ffffff';

	for ( var i = 0; i < glyphCount; i++ ) {

		const glyph = glyphs.charAt( i );
		const glyphWidth = ctx.measureText( glyph ).width / cellSize;

		const row = Math.floor( i / divisions ) + 1;
		const column = i % divisions;

		map[ glyph ] = { row: ( divisions - row ) / divisions, column: column / divisions, width: glyphWidth };

		ctx.fillText( glyph, cellSize * column, cellSize * row - 5 );

	}

	this.texture = new CanvasTexture( canvas );

	this.texture.onUpdate = function _dropCanvas ( texture ) { texture.image = null; };

	this.map = map;
	this.cellScale = cellSize / atlasSize;
	this.cellSize = cellSize;

}

GlyphAtlas.prototype.getTexture = function () {

	return this.texture;

};

GlyphAtlas.prototype.getCellScale = function () {

	return this.cellScale;

};

GlyphAtlas.prototype.getGlyph = function ( glyph ) {

	var glyphData = this.map[ glyph ];

	if ( glyphData === undefined ) {

		console.warn( 'unavailable glyph [' + glyph + ']', glyph.codePointAt() );
		glyphData = this.map[ '\u2610' ];  // substitute empty box

	}

	return glyphData;

};


var atlasCache = {};
var AtlasFactory = {};

AtlasFactory.getAtlas = function ( glyphAtlasSpec ) {

	const key = JSON.stringify( glyphAtlasSpec );

	var atlas = atlasCache[ key ];

	if ( atlas === undefined ) {

		atlas = new GlyphAtlas( glyphAtlasSpec );
		atlasCache[ key ] = atlas;

	}

	return atlas;

};

export { GlyphAtlas, AtlasFactory };

// EOF