import { CanvasTexture } from '../../../../three.js/src/Three';

function GlyphAtlas ( glyphAtlasSpec ) {

	var atlasSize = 512;
	var cellSize = 32;

	var canvas = document.createElement( 'canvas' );
	var map = {};

	if ( ! canvas ) console.error( 'creating canvas for glyph atlas failed' );

	canvas.width  = atlasSize;
	canvas.height = atlasSize;

//	document.body.appendChild( canvas ); // FIXME debug code

	var ctx = canvas.getContext( '2d' );

	if ( ! ctx ) console.error( 'cannot obtain 2D canvas' );

	// set background

	ctx.fillStyle = 'rgba( 0, 0, 0, 1 )';
	ctx.fillRect( 0, 0, atlasSize, atlasSize );

	// populate with glyphs

	var glyphs = ' ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.-_';

	var divisions = atlasSize / cellSize;

	var glyphCount = glyphs.length;

	if ( glyphCount > divisions * divisions ) {

		console.error( 'too many glyphs for atlas' );
		return;

	}

	var glyph;
	var fontSize = 20;

	ctx.textAlign = 'left';
	ctx.font = 'normal ' + fontSize + 'px helvetica,sans-serif';
	ctx.fillStyle = '#ffffff';

	var row, column;

	for ( var i = 0; i < glyphCount; i++ ) {

		glyph = glyphs.charAt( i );

		var glyphWidth = ctx.measureText( glyph ).width / cellSize;

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
		glyphData = {}; // FIXME add placeholder to atlas.

	}

	return glyphData;

};


var atlasCache = {};
var AtlasFactory = {};

AtlasFactory.getAtlas = function ( glyphAtlasSpec ) {

	var atlas = atlasCache[ glyphAtlasSpec ];

	if ( atlas === undefined ) {

		atlas = new GlyphAtlas( glyphAtlasSpec );
		atlasCache[ glyphAtlasSpec ] = atlas;

	}

	return atlas;

};

export { GlyphAtlas, AtlasFactory };

// EOF