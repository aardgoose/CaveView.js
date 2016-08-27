
import { getEnvironmentValue, FEATURE_ENTRANCES } from '../core/constants.js';

import {
	Vector3, Color,
	BufferGeometry,
	DirectGeometry,
	TextureLoader,
	MultiMaterial,
	PointsMaterial,
	Points,
	Object3D,
} from '../../../../three.js/src/Three.js';

var farPointers = null;

function FarPointers ( survey ) {

	this.directGeometry = new DirectGeometry();
	var loader = new TextureLoader();

	var yellowTexture = loader.load( getEnvironmentValue( "cvDirectory", "" ) + "CaveView/images/marker-yellow.png" );
	var cyanTexture   = loader.load( getEnvironmentValue( "cvDirectory", "" ) + "CaveView/images/marker-cyan.png" );

	var nullMaterial   = new PointsMaterial( { visible: false } );
	var yellowMaterial = new PointsMaterial( { size: 10, map: yellowTexture, transparent : true, sizeAttenuation: false } );
	var cyanMaterial   = new PointsMaterial( { size: 10, map: cyanTexture, transparent : true, sizeAttenuation: false } );

	var material = new MultiMaterial( [ nullMaterial, yellowMaterial ] );

	Points.call( this, new BufferGeometry(), material );

	this.type = "CV.FarPointers";

	this.layers.set( FEATURE_ENTRANCES );

	survey.add( this );

	survey.addEventListener( "dispose", _onSurveyDispose );

	function _onSurveyDispose( event ) {

		var survey = event.target;

		survey.removeEventListener( 'dispose', _onSurveyDispose );

		farPointers.geometry.dispose();
		farPointers = null;

	}

}

// FIXME - move to BufferGeometry for simplicity

FarPointers.prototype = Object.create( Points.prototype );

FarPointers.prototype.constructor = FarPointers;

FarPointers.prototype.addPointer = function ( position ) {

	var geometry = this.directGeometry;
	var index = geometry.vertices.length;

	geometry.vertices.push( position );
	geometry.groups.push( { start: index, count: 1, materialIndex: 1 } );

//	geometry.verticesNeedUpdate = true;


	this.geometry.fromDirectGeometry( geometry );

	return index;

}

FarPointers.prototype.setMaterialIndex = function ( index, materialIndex ) {

	var geometry = this.directGeometry;

	geometry.groups[index].materialIndex = materialIndex;
	this.geometry = new BufferGeometry().fromDirectGeometry( geometry );

}

FarPointers.prototype.getMaterialIndex = function ( index ) {

	return  this.directGeometry.groups[index].materialIndex;

}

function EntranceFarPointer ( survey, position ) {

	var self = this;

	if ( farPointers === null ) {

		farPointers = new FarPointers( survey );

	}

	Object3D.call( this );

	this.index = farPointers.addPointer( position );
	this.type = "CV.EntranceFarPointer";

	Object.defineProperty( this, "visible", {
		writeable: true,
		get: function () { _getVisibility(); },
		set: function ( x ) { _setVisibility( x ); }
	} );

	var fp = farPointers;

	function _getVisibility () {

		fp.getMaterialIndex( self.index );

	}

	function _setVisibility ( visible ) {

		var newIndex = ( visible === false ) ? 0 : 1;

		if ( newIndex !== fp.getMaterialIndex( self.index ) ) {

			fp.setMaterialIndex( self.index, newIndex );

		}

	}

}

EntranceFarPointer.prototype = Object.create( Object3D.prototype );

EntranceFarPointer.prototype.constructor = EntranceFarPointer;

// todo - add on visible property to intercept and use to select non visible/alternate colour for marker

export { EntranceFarPointer };

// EOF