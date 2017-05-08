
import { HudObject } from './HudObject';

import {
	PlaneBufferGeometry, Geometry, Vector3,
	Mesh, MeshBasicMaterial, Line, LineBasicMaterial
} from '../../../../three.js/src/Three';

function CursorScale ( container ) {

	var width  = container.clientWidth;
	var height = container.clientHeight;

	var stdWidth  = HudObject.stdWidth;
	var stdMargin = HudObject.stdMargin;

	this.name = 'CV.CursorScale';
	this.domObjects = [];

	var barOffset = 3 * ( stdWidth + stdMargin );
	var barHeight = ( height - barOffset ) / 2;
	var barWidth  = stdWidth / 2;

	var geometry = new PlaneBufferGeometry( barWidth, barHeight );

	Mesh.call( this, geometry, new MeshBasicMaterial( { color: 0x777777 } ) );

	this.translateX(  width / 2  - barWidth / 2  - stdMargin );
	this.translateY( -height / 2 + barHeight / 2 + barOffset );

	this.barHeight = barHeight;

	// make cursor line

	var cursorGeometry = new Geometry();

	cursorGeometry.vertices.push( new Vector3(  barWidth / 2, -barHeight / 2, 0 ) );
	cursorGeometry.vertices.push( new Vector3( -barWidth / 2, -barHeight / 2, 0 ) );

	var cursor = new Line( cursorGeometry, new LineBasicMaterial( { color: 0xffffff } ) );

	this.add( cursor );

	this.cursor = cursor;

	// add labels
	var maxdiv = document.createElement( 'div' );
	var mindiv = document.createElement( 'div' );

	var caption = document.createElement( 'div' );

	maxdiv.classList.add( 'linear-scale' );
	mindiv.classList.add( 'linear-scale' );

	caption.classList.add( 'linear-scale-caption' );

	maxdiv.id = 'max-div';
	mindiv.id = 'min-div';

	caption.id = 'linear-caption';

	maxdiv.style.top    = barHeight + 'px';
	mindiv.style.bottom = barOffset + 'px';

	caption.style.bottom = height - barHeight + 'px';

	container.appendChild( maxdiv );
	container.appendChild( mindiv );

	container.appendChild( caption );

	maxdiv.textContent = '---';
	mindiv.textContent = '---';

	caption.textContent = 'xxxx';

	this.maxDiv = maxdiv;
	this.minDiv = mindiv;

	this.caption = caption;

	this.domObjects.push( mindiv );
	this.domObjects.push( maxdiv );

	this.domObjects.push( caption );

	this.addEventListener( 'removed', this.removeDomObjects );

	return this;

}

CursorScale.prototype = Object.create( Mesh.prototype );

Object.assign( CursorScale.prototype, HudObject.prototype );

CursorScale.prototype.constructor = CursorScale;

CursorScale.prototype.setRange = function ( min, max, caption ) {

	this.maxDiv.textContent = Math.round( max ) + 'm';
	this.minDiv.textContent = Math.round( min ) + 'm';

	this.caption.textContent = caption;

	return this;

};


CursorScale.prototype.setCursor = function ( scaledValue /*, displayValue */ ) {

	this.cursor.position.setY( this.barHeight * scaledValue );

	return this;

};

export { CursorScale };

// EOF