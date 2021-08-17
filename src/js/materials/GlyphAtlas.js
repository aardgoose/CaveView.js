import { CanvasTexture, LinearFilter } from '../Three';

function GlyphAtlas ( glyphAtlasSpec ) {

	const atlasSize = 512;
	const fontSize = 28;
	const cellSize = 32;

	const divisions = atlasSize / cellSize;

	const canvas = document.createElement( 'canvas' );

	const glyphs = '\u202f\u00B0\u2610 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%,.-_/()[]\'"';
	const glyphCount = glyphs.length;

	this.cellScale = cellSize / atlasSize;
	this.cellSize = cellSize;
	this.glyphCount = glyphCount;
	this.divisions = divisions;

	this.map = {};

	if ( glyphCount > divisions * divisions ) {

		console.error( 'too many glyphs for atlas' );
		return;

	}

	if ( ! canvas ) console.error( 'creating canvas for glyph atlas failed' );

	canvas.width = atlasSize;
	canvas.height = atlasSize;

	const ctx = canvas.getContext( '2d' );

	if ( ! ctx ) console.error( 'cannot obtain 2D canvas' );

	// set background
	ctx.fillStyle = glyphAtlasSpec.background || 'rgba( 0, 0, 0, 0 )';
	ctx.fillRect( 0, 0, atlasSize, atlasSize );

	// set up text settings
	ctx.textAlign = 'left';
	ctx.font = fontSize + 'px ' + glyphAtlasSpec.font;
	ctx.fillStyle = glyphAtlasSpec.color || '#ffffff';

	this.ctx = ctx;

	for ( let i = 0; i < glyphCount; i++ ) {

		this.addGlyphToCanvas( glyphs.charAt( i ), i );

	}

	this.texture = new CanvasTexture( canvas );
	this.texture.minFilter = LinearFilter;
	this.generateMipmaps = false;

}

GlyphAtlas.prototype.addGlyphToCanvas = function ( glyph, i ) {

	const divisions = this.divisions;
	const ctx = this.ctx;
	const cellSize = this.cellSize;

	const glyphWidth = ctx.measureText( glyph ).width / cellSize;

	const row = Math.floor( i / divisions ) + 1;
	const column = i % divisions;

	const glyphData = {
		row: ( divisions - row ) / divisions,
		column: column / divisions,
		width: glyphWidth
	};

	this.map[ glyph ] = glyphData;

	ctx.fillText( glyph, cellSize * column, cellSize * row - 7 );

	return glyphData;

};

GlyphAtlas.prototype.getTexture = function () {

	return this.texture;

};

GlyphAtlas.prototype.getGlyph = function ( glyph ) {

	let glyphData = this.map[ glyph ];

	if ( glyphData === undefined ) {

		if ( this.glyphCount + 1 > this.divisions * this.divisions ) {

			console.warn( 'too many glyphs for atlas when adding [' + glyph + ']' );
			return;

		}

		glyphData = this.addGlyphToCanvas( glyph, this.glyphCount++ );

		this.texture.needsUpdate = true;

	}

	return glyphData;

};

function GlyphAtlasCache () {

	const atlasCache = [];

	this.getAtlas = function ( glyphAtlasSpec ) {

		const key = JSON.stringify( glyphAtlasSpec );

		let atlas = atlasCache[ key ];

		if ( atlas === undefined ) {

			atlas = new GlyphAtlas( glyphAtlasSpec );
			atlasCache[ key ] = atlas;

		}

		return atlas;

	};

}

export { GlyphAtlasCache };