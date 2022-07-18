import { Scale } from './Scale';
import { MutableGlyphString } from '../core/GlyphString';
import { LineSegments2 } from '../core/LineSegments2';
import { LineSegmentsGeometry } from '../core/LineSegmentsGeometry';
import { Line2Material } from '../materials/Line2Material';

import { MeshBasicMaterial, PlaneGeometry } from '../Three';

class CursorScale extends Scale {

	constructor ( hudObject, container ) {

		const ctx = hudObject.ctx;
		const cfg = ctx.cfg;
		const materials = ctx.materials;
		const geometry = new PlaneGeometry();

		super( hudObject, container, geometry, new MeshBasicMaterial( { color: 0x676767 } ) );

		this.name = 'CV.CursorScale';

		const barWidth = this.barWidth;
		const barHeight = this.barHeight;

		geometry.scale( barWidth, barHeight, 1 );

		// make cursor line

		const cursorGeometry = new LineSegmentsGeometry();

		cursorGeometry.setPositions( [
			barWidth / 2, -barHeight / 2, 10,
			-barWidth / 2, -barHeight / 2, 10
		] );

		const cursor = new LineSegments2( cursorGeometry, new Line2Material( ctx, { color: cfg.themeColor( 'hud.cursor' ) } ) );

		const atlasSpec = {
			color: cfg.themeColorCSS( 'hud.cursor' ),
			background: '#444444',
			font: 'bold helvetica,sans-serif'
		};

		const material = materials.getGlyphMaterial( atlasSpec, 0 );

		const cursorLabel = new MutableGlyphString( '      ', material );

		cursorLabel.translateY( - barHeight / 2 - cursorLabel.getHeight() / 2 );

		this.addStatic( cursor );
		cursor.addStatic( cursorLabel );

		this.cursor = cursor;
		this.cursorLabel = cursorLabel;

	}

	setCursor ( scaledValue, displayValue ) {

		const cursor = this.cursor;
		const cursorLabel = this.cursorLabel;

		cursor.position.setY( this.barHeight * scaledValue );
		cursor.updateMatrix();

		cursorLabel.replaceString( String( displayValue + '\u202fm' ).padStart( 6, ' ') );
		cursorLabel.position.setX( this.offsetX - cursorLabel.getWidth() );

		cursorLabel.updateMatrix();

		return this;

	}

}

export { CursorScale };