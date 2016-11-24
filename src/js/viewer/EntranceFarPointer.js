
import { getEnvironmentValue, FEATURE_ENTRANCES } from '../core/constants.js';

import {
	Vector3, Color,
	BufferAttribute,
	BufferGeometry,
	TextureLoader,
	MultiMaterial,
	PointsMaterial,
	Points,
	Object3D,
} from '../../../../three.js/src/Three.js';

var farPointers = null;

function FarPointers ( survey ) {

	this.points = [];

	var loader = new TextureLoader();

	var yellowTexture = loader.load( getEnvironmentValue( "home", "" ) + "images/marker-yellow.png" );

//	var nullMaterial   = new PointsMaterial( { visible: false } );
	var yellowMaterial = new PointsMaterial( { size: 10, map: yellowTexture, transparent : true, sizeAttenuation: true } );

//	var material = new MultiMaterial( [ nullMaterial, yellowMaterial ] );

	Points.call( this, new BufferGeometry(), yellowMaterial );

	this.type = "CV.FarPointers";

	this.layers.set( FEATURE_ENTRANCES );

	survey.add( this );

	survey.addEventListener( "removed", _onSurveyRemoved );

	function _onSurveyRemoved( event ) {

		var survey = event.target;

		survey.removeEventListener( 'removed', _onSurveyRemoved );

		farPointers.geometry.dispose();
		farPointers = null;

	}

}

FarPointers.prototype = Object.create( Points.prototype );

FarPointers.prototype.constructor = FarPointers;

FarPointers.prototype.updateGeometry = function () {

	// sort by material and update BufferGeometry.

	var points = this.points;
	var vertices = new Float32Array( points.length * 3 );
	var offset = 0;

	for ( var i = 0; i < points.length; i++ ) {

		if ( points[i].materialIndex > 0 ) {

			var position = points[i].position;

			vertices[ offset++ ] = position.x;
			vertices[ offset++ ] = position.y;
			vertices[ offset++ ] = position.z + 5;

		}

	}

	this.visible = ( offset > 0 );

	this.geometry.addAttribute( 'position', new BufferAttribute( vertices, 3 ) );
	this.geometry.setDrawRange( 0, offset / 3 );

}

FarPointers.prototype.addPointer = function ( position ) {

	var points = this.points;
	var index = points.length;

	this.points.push( { position: position, materialIndex: 1 } );

	this.updateGeometry();

	return index;

}

FarPointers.prototype.setMaterialIndex = function ( index, materialIndex ) {

	this.points[index].materialIndex = materialIndex;
	this.updateGeometry();

}

FarPointers.prototype.getMaterialIndex = function ( index ) {

	return  this.points[index].materialIndex;

}

function EntranceFarPointer ( survey, position ) {

	var self = this;

	if ( farPointers === null ) {

		farPointers = new FarPointers( survey );

	}

	Object3D.call( this );

	this.index = farPointers.addPointer( position );
	this.type = "CV.EntranceFarPointer";

	this.hidden = false;

	Object.defineProperty( this, "visible", {
		writeable: true,
		get: function () { _getVisibility(); },
		set: function ( x ) { _setVisibility( x ); }
	} );

	var fp = farPointers;

	this.addEventListener( "removed", _onRemoved );

	function _onRemoved( event ) {

		var obj = event.target;

		obj.removeEventListener( 'dispose', _onRemoved );

		// hide from view - avoid need to recreate farPointers 
		// and traverse all visible EntranceFarPointers and reset index values

		self.hidden = true;

		fp.setMaterialIndex( self.index, 0 );

	}

	function _getVisibility () {

		fp.getMaterialIndex( self.index );

	}

	function _setVisibility ( visible ) {

		var newIndex = ( visible === false || self.hidden ) ? 0 : 1;

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