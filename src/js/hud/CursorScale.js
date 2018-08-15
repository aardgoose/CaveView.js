
import { Cfg } from '../core/lib';
import { Scale } from './Scale';
import { MutableGlyphString } from '../core/GlyphString';
import { Materials } from '../materials/Materials';

import {
	PlaneBufferGeometry, Geometry, Vector3,
	MeshBasicMaterial, Line, LineBasicMaterial
} from '../Three';

function CursorScale ( container ) {

	const geometry = new PlaneBufferGeometry( 1, 1 );

	Scale.call( this, container, geometry, new MeshBasicMaterial( { color: 0x676767 } ) );

	this.name = 'CV.CursorScale';

	const barWidth = this.barWidth;
	const barHeight = this.barHeight;

	geometry.scale( barWidth, barHeight, 1 );

	// make cursor line

	const cursorGeometry = new Geometry();

	cursorGeometry.vertices.push( new Vector3(  barWidth / 2, -barHeight / 2, 10 ) );
	cursorGeometry.vertices.push( new Vector3( -barWidth / 2, -barHeight / 2, 10 ) );

	const cursor = new Line( cursorGeometry, new LineBasicMaterial( { color: Cfg.themeColor( 'hud.cursor' ) } ) );

	const atlasSpec = {
		color: Cfg.themeColorCSS( 'hud.cursor' ),
		background: '#444444',
		font: 'bold helvetica,sans-serif'
	};

	const material = Materials.getGlyphMaterial( atlasSpec, 0 );

	const cursorLabel = new MutableGlyphString( '      ', material );

	cursorLabel.translateY( - barHeight / 2 - cursorLabel.getHeight() / 2 );

	this.addStatic( cursor );
	cursor.addStatic( cursorLabel );

	this.cursor = cursor;
	this.cursorLabel = cursorLabel;

	return this;

}

CursorScale.prototype = Object.create( Scale.prototype );

CursorScale.prototype.setCursor = function ( scaledValue, displayValue ) {

	const cursor = this.cursor;
	const cursorLabel = this.cursorLabel;

	cursor.position.setY( this.barHeight * scaledValue );
	cursor.updateMatrix();

	cursorLabel.replaceString( String( displayValue + '\u202fm' ).padStart( 6, ' ') );
	cursorLabel.position.setX( this.offsetX - cursorLabel.getWidth() );

	cursorLabel.updateMatrix();

	return this;

};

export { CursorScale };

// EOF