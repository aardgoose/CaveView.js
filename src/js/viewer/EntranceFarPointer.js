
import { getEnvironmentValue, FEATURE_ENTRANCES } from '../core/constants';

import {
	BufferAttribute,
	BufferGeometry,
	TextureLoader,
	PointsMaterial,
	Points,
	Object3D,
} from '../../../../three.js/src/Three';

var farPointers = null;

function FarPointers ( survey ) {

	this.points = [];

	var loader = new TextureLoader();

	var yellowTexture = loader.load( getEnvironmentValue( 'home', '' ) + 'images/marker-yellow.png' );

	var yellowMaterial = new PointsMaterial( { size: 10, map: yellowTexture, transparent : true, sizeAttenuation: true, alphaTest: 0.8 } );

	Points.call( this, new BufferGeometry(), yellowMaterial );

	this.type = 'CV.FarPointers';

	this.layers.set( FEATURE_ENTRANCES );

	survey.add( this );

	survey.addEventListener( 'removed', _onSurveyRemoved );

	function _onSurveyRemoved ( event ) {

		var survey = event.target;

		survey.removeEventListener( 'removed', _onSurveyRemoved );

		farPointers.geometry.dispose();
		farPointers = null;

	}

}

FarPointers.prototype = Object.create( Points.prototype );

FarPointers.prototype.constructor = FarPointers;

FarPointers.prototype.updateGeometry = function () {

	// update BufferGeometry, virtually trucate buffer attribute

	var geometry = this.geometry;
	var points = this.points;
	var vertices = new Float32Array( points.length * 3 );
	var offset = 0;

//	geometry.clearGroups();

	for ( var i = 0; i < points.length; i++ ) {

		var point = points[ i ];

		if ( point.materialIndex > 0 ) {

			var position = point.position;

			vertices[ offset++ ] = position.x;
			vertices[ offset++ ] = position.y;
			vertices[ offset++ ] = position.z + 5;

//			geometry.addGroup( offset / 3, 1, 1 );

		}

	}

	this.visible = ( offset > 0 );

	geometry.addAttribute( 'position', new BufferAttribute( vertices, 3 ) );

	// only draw the points that have not been removed.

	geometry.setDrawRange( 0, offset / 3 );

};

FarPointers.prototype.addPointer = function ( position ) {

	var points = this.points;
	var index = points.length;

	this.points.push( { position: position, materialIndex: 1 } );

	this.updateGeometry();

	return index;

};

FarPointers.prototype.setMaterialIndex = function ( index, materialIndex ) {

	this.points[ index ].materialIndex = materialIndex;
	this.updateGeometry();

};

FarPointers.prototype.getMaterialIndex = function ( index ) {

	return  this.points[ index ].materialIndex;

};

FarPointers.prototype.removeDeleted = function () {

	var oldPoints = this.points;
	var newPoints = [];

	var i;
	var l = oldPoints.length;

	for ( i = 0; i < l; i++ ) {

		if ( oldPoints[ i ].materialIndex !== -1 ) newPoints.push( oldPoints[ i ] );

	}

	this.points = newPoints;
	this.updateGeometry();

};

function EntranceFarPointer ( survey, position ) {

	var self = this;

	if ( farPointers === null ) {

		farPointers = new FarPointers( survey );

	}

	Object3D.call( this );

	this.index = farPointers.addPointer( position );
	this.type = 'CV.EntranceFarPointer';

	this.hidden = false;

	Object.defineProperty( this, 'visible', {
		writeable: true,
		get: function () { _getVisibility(); },
		set: function ( x ) { _setVisibility( x ); }
	} );

	this.addEventListener( 'removed', this.onRemove );

	function _getVisibility () {

		farPointers.getMaterialIndex( self.index );

	}

	function _setVisibility ( visible ) {

		var newMaterialIndex = ( visible === false || self.hidden ) ? 0 : 1;

		if ( newMaterialIndex !== farPointers.getMaterialIndex( self.index ) ) {

			farPointers.setMaterialIndex( self.index, newMaterialIndex );

		}

	}

}

EntranceFarPointer.prototype = Object.create( Object3D.prototype );

EntranceFarPointer.prototype.constructor = EntranceFarPointer;

EntranceFarPointer.prototype.onRemove = function ( /* event */ ) {

	this.removeEventListener( 'removed', this.onRemove );

	// hide from view - avoid need to recreate farPointers 
	// and traverse all visible EntranceFarPointers and reset index values

	this.hidden = true;

	farPointers.setMaterialIndex( this.index, 0 );

};

// todo - add on visible property to intercept and use to select non visible/alternate colour for marker

export { EntranceFarPointer, farPointers };

// EOF