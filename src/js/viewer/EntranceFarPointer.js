
import { getEnvironmentValue } from '../core/constants.js';

import {
	Vector3, Color,
	Geometry,
	TextureLoader,
	PointsMaterial,
	Points,
	Object3D
} from '../../../../three.js/src/Three.js';

var farPointers = null;

function FarPointers ( survey ) {

	var geometry = new Geometry();
	var loader = new TextureLoader();

	var texture = loader.load( getEnvironmentValue( "cvDirectory", "" ) + "CaveView/images/marker-yellow.png" );

	var material = new PointsMaterial( { size: 10, map: texture, transparent : true, sizeAttenuation: false } );

	Points.call( this, geometry, material );

	this.type = "CV.FarPointers";

	survey.add( this );

	survey.addEventListener( "dispose", _onSurveyDispose );

	function _onSurveyDispose( event ) {

		var survey = event.target;

		survey.removeEventListener( 'dispose', _onSurveyDispose );

		farPointers.geometry.dispose();
		farPointers = null;

	}

}

FarPointers.prototype = Object.create( Points.prototype );

FarPointers.prototype.constructor = FarPointers;

FarPointers.prototype.addPointer = function ( position ) {

	var geometry = this.geometry;

	geometry.vertices.push( position );
	geometry.colors.push( new Color( 0xff00ff ) );

	geometry.verticesNeedUpdate = true;
	geometry.colorsNeedUpdate = true;

}

function EntranceFarPointer ( survey, position ) {

	if ( farPointers === null ) {

		farPointers = new FarPointers( survey );

	}

	farPointers.addPointer( position );

	Object3D.call( this );

	this.type = "CV.EntranceFarPointer";

}

EntranceFarPointer.prototype = Object.create( Object3D.prototype );

EntranceFarPointer.prototype.constructor = EntranceFarPointer;

// todo - add on visible property to intercept and use to select non visible/alternate colour for marker

export { EntranceFarPointer };

// EOF