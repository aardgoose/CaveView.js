import { CanvasTexture } from '../../../../three.js/src/Three';

function GlyphAtlas ( glyphAtlasSpec ) {

	const atlasSize = 512;
	const cellSize = 32;
	const fontSize = 20;
	const divisions = atlasSize / cellSize;

	const canvas = document.createElement( 'canvas' );
	const map = {};

	const glyphs = '\u2610 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%,.-_/()\'';
	const glyphCount = glyphs.length;

	if ( glyphCount > divisions * divisions ) {

		console.error( 'too many glyphs for atlas' );
		return;

	}

	if ( ! canvas ) console.error( 'creating canvas for glyph atlas failed' );

	canvas.width  = atlasSize;
	canvas.height = atlasSize;

	const ctx = canvas.getContext( '2d' );

	if ( ! ctx ) console.error( 'cannot obtain 2D canvas' );

	// set background
	ctx.fillStyle = glyphAtlasSpec.background || '#000000';

	ctx.fillRect( 0, 0, atlasSize, atlasSize );

	// populate with glyphs

	ctx.textAlign = 'left';
	ctx.font = fontSize + 'px ' + glyphAtlasSpec.font;
	ctx.fillStyle = glyphAtlasSpec.color || '#ffffff';

	var row, column, glyph;

	for ( var i = 0; i < glyphCount; i++ ) {

		glyph = glyphs.charAt( i );

		let glyphWidth = ctx.measureText( glyph ).width / cellSize;

		row = Math.floor( i / divisions ) + 1;
		column = i % divisions;

		map[ glyph ] = { row: ( divisions - row ) / divisions, column: column / divisions, width: glyphWidth };

		ctx.fillText( glyph, cellSize * column, cellSize * row - 6 );

	}

	this.texture = new CanvasTexture( canvas );
	this.map = map;
	this.cellScale = cellSize / atlasSize;

}

GlyphAtlas.prototype.constructor = GlyphAtlas;

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