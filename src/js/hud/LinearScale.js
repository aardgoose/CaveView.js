
import { HudObject } from './HudObject';
import { Materials } from '../materials/Materials';
import { MATERIAL_LINE } from '../core/constants';

import {
	Vector3, Matrix4,
	PlaneBufferGeometry,
	Mesh
} from '../../../../three.js/src/Three';

function LinearScale ( container, viewState ) {

	var width  = container.clientWidth;
	var height = container.clientHeight;

	var stdWidth  = HudObject.stdWidth;
	var stdMargin = HudObject.stdMargin;

	this.name = 'CV.LinearScale';
	this.domObjects = [];

	var barOffset = 3 * ( stdWidth + stdMargin );
	var barHeight = ( height - barOffset ) / 2;
	var barWidth  = stdWidth / 2;

	var range = viewState.maxHeight - viewState.minHeight;
	var zScale = barHeight / range;

	var geometry = new PlaneBufferGeometry( barWidth, range );

	// rotate the model to put the plane in the xz plane, covering the range of view height values - the gradient shader works on z values.

	geometry.rotateX( Math.PI / 2 );
	geometry.translate( -barWidth / 2, 0, range / 2 + viewState.minHeight );

	Mesh.call( this, geometry, Materials.getHeightMaterial( MATERIAL_LINE ) );

	var ms = new Matrix4().makeScale( 1,  1, zScale );

	ms.multiply( new Matrix4().makeTranslation( width / 2 - stdMargin, -height / 2 + barOffset - viewState.minHeight * zScale, 0 ) );

	this.applyMatrix( ms );

	// rotate the model in the world view.
	this.rotateOnAxis( new Vector3( 1, 0, 0 ), -Math.PI / 2 );

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

LinearScale.prototype = Object.create( Mesh.prototype );

Object.assign( LinearScale.prototype, HudObject.prototype );

LinearScale.prototype.constructor = LinearScale;

LinearScale.prototype.setRange = function ( min, max, caption ) {

	this.maxDiv.textContent = Math.round( max ) + 'm';
	this.minDiv.textContent = Math.round( min ) + 'm';

	this.caption.textContent = caption;

	return this;

};

LinearScale.prototype.setMaterial = function ( material ) {

	this.material = material;

	return this;

};

export { LinearScale };

// EOF