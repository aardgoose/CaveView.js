
import { FEATURE_ENTRANCES } from '../core/constants';
import { GlyphString } from './GlyphString';

import { Object3D, Vector3, Triangle } from '../../../../three.js/src/Three';


function ClusterMarkers ( limits ) {

	this.limits = limits;
	this.labels = [];

	this.xMin = limits.min.x;
	this.yMin = limits.min.y;

	this.xScale = 256 / ( limits.max.x - limits.min.x );
	this.yScale = 256 / ( limits.max.y - limits.min.y );

	Object3D.call( this );

	this.type = 'CV.ClusterMarker';

	this.addEventListener( 'removed', this.onRemove );

	return this;

}

ClusterMarkers.prototype = Object.create( Object3D.prototype );

ClusterMarkers.prototype.constructor = ClusterMarkers;

ClusterMarkers.prototype.addMarker = function ( entrance ) {

	var x, y;
//	var limits = this.limits;

	var xMin = this.xMin;
	var yMin = this.yMin;

	var xScale = this.xScale;
	var yScale = this.yScale;

	// normalised x / y
	x = Math.floor( ( entrance.position.x - xMin ) * xScale );
	y = Math.floor( ( entrance.position.y - yMin ) * yScale );

	var mask;
	var quadKey = 0;

	for ( var j = 7; j >= 0; j-- ) {

		mask = 1 << j;

		quadKey = ( quadKey << 1 ) + ( ( mask & x ) ? 1 : 0 );
		quadKey = ( quadKey << 1 ) + ( ( mask & y ) ? 1 : 0 );

	}

	console.log( 'entrance', entrance.label, x, y, x.toString( 2 ), y.toString( 2 ), quadKey.toString( 2 ) );

	var label = new GlyphString( entrance.label, window.glyphMaterial );

	label.layers.set( FEATURE_ENTRANCES );
	label.position.copy( entrance.position );

	// add to quadkey index to allow quick lookup.
	this.labels.push( { key: quadKey, label: label } );

	this.add( label );

	return label;

};

ClusterMarkers.prototype.cluster = function ( camera ) {

	// determine which labels are too close together to be usefully displayed as separate objects.

	// immediate exit if only a single label.
//	if ( this.labels.length === 1 ) return;

	console.log( 'cluster', this.labels.length );

	var mask = 3 << 14; // top two bits

	this.checkQuad( 0, 0, 0, 0, 7 );
	this.checkQuad( 0, 0, 0, 1, 7 );
	this.checkQuad( 0, 0, 1, 0, 7 );
	this.checkQuad( 0, 0, 1, 1, 7 );

	return;

}

ClusterMarkers.prototype.checkQuad = function ( prefix, mask, x, y, order ) {

	var labels = this.labels;

	// quadkey prefix for this quad
	prefix = prefix | ( ( x << 1 ) | y ) << ( order * 2 );

	var mask = mask | ( 3 << ( order * 2 ) );

	var labelCount = 0;

	// check for labels in this quad

	for ( var i = 0, l = labels.length; i < l; i++ ) {

		var key = labels[ i ].key;

		console.log( key.toString( 2 ).padStart( 16, 0 ), mask.toString( 2 ).padStart( 16, 0 ) );

		if ( ( key & mask ) === prefix ) {

			console.log( labels[ i ].label.name );
			labelCount++;

		}
	}

	console.log( prefix.toString( 2 ).padStart( 16, '0' ), 'order', order, x, y, 'entranceCount:', labelCount );
	console.log( '' );

	if ( labelCount < 2 ) return;

	order--;

	if ( order < 6 ) return;

	this.checkQuad( prefix, mask, 0, 0, order );
	this.checkQuad( prefix, mask, 0, 1, order );
	this.checkQuad( prefix, mask, 1, 0, order );
	this.checkQuad( prefix, mask, 1, 1, order );

}

ClusterMarkers.prototype.projectedArea = function ( camera ) {

	var v1; //= boundingBox.min.clone();
	var v3; // = boundingBox.max.clone();

	v1.z = 0;
	v3.z = 0;

	var v2 = new Vector3( v3.x, v1.y, 0 );
	var v4 = new Vector3( v1.x, v3.y, 0 );

	// clamping reduces accuracy of area but stops offscreen area contributing to zoom pressure

	v1.project( camera );
	v2.project( camera );
	v3.project( camera );
	v4.project( camera );

	var t1 = new Triangle( v1, v3, v4 );
	var t2 = new Triangle( v1, v2, v3 );

	return t1.area() + t2.area();

};

ClusterMarkers.prototype.onRemove = function ( /* event */ ) {

	var levels = this.levels;

	for ( var i = 0, l = levels.length; i < l; i++ ) {

//		levels[ i ].object.dispatchEvent( { type: 'removed' } );

	}

};

export { ClusterMarkers };

// EOF