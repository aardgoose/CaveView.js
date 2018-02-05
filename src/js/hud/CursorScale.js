
import { Cfg } from '../core/lib';
import { Scale } from './Scale';

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

	cursorGeometry.vertices.push( new Vector3(  barWidth / 2, -barHeight / 2, 0 ) );
	cursorGeometry.vertices.push( new Vector3( -barWidth / 2, -barHeight / 2, 0 ) );

	const cursor = new Line( cursorGeometry, new LineBasicMaterial( { color: Cfg.themeColor( 'hud.cursor' ) } ) );

	this.add( cursor );

	this.cursor = cursor;

	return this;

}

CursorScale.prototype = Object.create( Scale.prototype );


CursorScale.prototype.setCursor = function ( scaledValue /*, displayValue */ ) {

	this.cursor.position.setY( this.barHeight * scaledValue );

	return this;

};

export { CursorScale };

// EOF