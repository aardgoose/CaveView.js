import { CanvasTexture } from '../../../../three.js/src/Three';

import { GlyphMaterial } from '../materials/GlyphMaterial';

function GlyphAtlas ( container, rotation ) {

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

	var glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.-_';

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

	var texture = new CanvasTexture( canvas );

	this.map = map;
	this.material = new GlyphMaterial( texture, cellSize / atlasSize, container, rotation );

}

GlyphAtlas.prototype.getMaterial = function () {

	return this.material;

};

GlyphAtlas.prototype.getGlyph = function ( glyph ) {

	var glyphData = this.map[ glyph ];

	if ( glyphData === undefined ) {

		console.warn( 'unavailable glyph' );
		glyphData = {}; // FIXME add placeholder to atlas.

	}

	return glyphData;

};

GlyphAtlas.prototype.constructor = GlyphAtlas;


export { GlyphAtlas };

// EOF