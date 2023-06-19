import { CanvasTexture, LinearFilter } from '../Three';

class GlyphAtlas {

	constructor ( type, gCtx ) {

		const cfg = gCtx.cfg;
		const atlasSize = 512;
		const fontSize = 18;
		const cellSize = 32;

		const divisions = atlasSize / cellSize;
		const canvas = document.createElement( 'canvas' );
		const glyphs = '\u202f\u00B0\u2610 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%,.-_/()[]\'"';
		const map = {};

		let glyphCount = glyphs.length;

		this.cellScale = cellSize / atlasSize;
		this.cellSize = cellSize;

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
		ctx.fillStyle = cfg.themeColorCSS( `${type}.background`, 'rgba( 0, 0, 0, 0 )' );
		ctx.fillRect( 0, 0, atlasSize, atlasSize );

		// set up text settings
		ctx.textAlign = 'left';
		ctx.font = fontSize + 'px ' + cfg.themeValue( `${type}.font` );
		ctx.fillStyle = cfg.themeColorCSS( `${type}.color`, '#ffffff' );

		for ( let i = 0; i < glyphCount; i++ ) {

			addGlyphToCanvas( glyphs.charAt( i ), i );

		}

		const texture = new CanvasTexture( canvas );

		texture.minFilter = LinearFilter;
		this.generateMipmaps = false;

		function addGlyphToCanvas ( glyph, i ) {

			const glyphWidth = ctx.measureText( glyph ).width / cellSize;

			const row = Math.floor( i / divisions ) + 1;
			const column = i % divisions;

			const glyphData = {
				row: ( divisions - row ) / divisions,
				column: column / divisions,
				width: glyphWidth
			};

			map[ glyph ] = glyphData;

			ctx.fillText( glyph, cellSize * column, cellSize * row - 7 );

			return glyphData;

		}

		this.getTexture = function () {

			return texture;

		};

		this.getGlyph = function ( glyph ) {

			let glyphData = map[ glyph ];

			if ( glyphData === undefined ) {

				if ( glyphCount + 1 > divisions * divisions ) {

					console.warn( `too many glyphs for atlas when adding [${glyph}]` );
					return;

				}

				glyphData = addGlyphToCanvas( glyph, glyphCount++ );

				texture.needsUpdate = true;

			}

			return glyphData;

		};

	}

}

export { GlyphAtlas };