
import { FEATURE_ENTRANCES } from '../core/constants';
import { GlyphString } from './GlyphString';

import { Object3D, Vector3, Triangle } from '../../../../three.js/src/Three';


var A = new Vector3();
var B = new Vector3();
var C = new Vector3();
var D = new Vector3();

function ClusterMarkers ( limits, maxOrder ) {

	Object3D.call( this );

	this.limits = limits;
	this.maxOrder = maxOrder;
	this.labels = [];

	this.xMin = limits.min.x;
	this.yMin = limits.min.y;

	this.xRange = limits.max.x - limits.min.x;
	this.yRange = limits.max.y - limits.min.y;

	var maxQuads = Math.pow( 2, maxOrder + 1 );

	this.xScale = maxQuads / ( limits.max.x - limits.min.x );
	this.yScale = maxQuads / ( limits.max.y - limits.min.y );

	this.type = 'CV.ClusterMarker';

	var quadCache = [];

	// build empty cache for each order of quadKey prefix length

	for ( var i = maxOrder; i >= 0; i-- ) {

		quadCache[ i ] = { bucket: [] }

	}

	this.quadCache = quadCache;

	return this;

}

ClusterMarkers.prototype = Object.create( Object3D.prototype );

ClusterMarkers.prototype.constructor = ClusterMarkers;

ClusterMarkers.prototype.addMarker = function ( entrance ) {

	var x, y;

	var xMin = this.xMin;
	var yMin = this.yMin;

	var xScale = this.xScale;
	var yScale = this.yScale;

	// normalised x / y in range 0 - 255

	x = Math.floor( ( entrance.position.x - xMin ) * xScale );
	y = Math.floor( ( entrance.position.y - yMin ) * yScale );

	// create label

	var label = new GlyphString( entrance.label, window.glyphMaterial );

	label.layers.set( FEATURE_ENTRANCES );
	label.position.copy( entrance.position );

	// calculate quadkey prefixes for this marker

	var mask;
	var quadKey = 0;

	var quadCache = this.quadCache;
	var quadLookup;

	for ( var i = this.maxOrder; i >= 0; i-- ) {

		mask = 1 << i;

		quadKey = ( quadKey << 1 ) + ( ( mask & x ) ? 1 : 0 );
		quadKey = ( quadKey << 1 ) + ( ( mask & y ) ? 1 : 0 );

		// record marker in each order lookup bucket for this partial quadKey

		quadLookup = quadCache[ i ];

		if ( quadLookup.bucket[ quadKey ] === undefined ) {

			quadLookup.bucket[ quadKey ] = { count: 1, clusterMarker: null, markers: [ label ] };

		} else {

			quadLookup.bucket[ quadKey ].count++;
			quadLookup.bucket[ quadKey ].markers.push( label );

		}

	}

//	console.log( 'entrance', entrance.label, x, y, x.toString( 2 ), y.toString( 2 ), quadKey.toString( 2 ) );

	// add to quadkey index to allow quick lookup.

//	this.labels.push( { key: quadKey, label: label } );

	this.add( label );

	return label;

};

ClusterMarkers.prototype.cluster = function ( camera ) {

	// determine which labels are too close together to be usefully displayed as separate objects.

	// immediate exit if only a single label.
	var children = this.children;

	if ( children.length === 1 ) return;

	this.camera = camera;

	for ( var i = 0, l = children.length; i < l; i++ ) {

		children[ i ].visible = true;

	}

	var maxOrder = this.maxOrder;

	// search initial 4 quads

	var xMin = this.xMin;
	var yMin = this.yMin;

	var xMid = xMin + this.xRange / 2;
	var yMid = yMin + this.yRange / 2;

	this.checkQuad( 0, 0, xMin, yMin, maxOrder );
	this.checkQuad( 0, 1, xMin, yMid, maxOrder );
	this.checkQuad( 0, 2, xMid, yMin, maxOrder );
	this.checkQuad( 0, 3, xMid, yMid, maxOrder );

	return;

}

ClusterMarkers.prototype.checkQuad = function ( prefix, quad, x, y, order ) {

	var i, l;
	var quadLookup = this.quadCache[ order ];

	// quadkey prefix and mask for this quad

	prefix = prefix << 2 | quad;

	// check for labels in this quad

	var quadInfo = quadLookup.bucket[ prefix ];

	if ( quadInfo === undefined  || quadInfo.count === 1 ) return;

	// calculate vertices of quad

	var width = Math.pow( 2, order - this.maxOrder - 1 );

	var xSize = width * this.xRange;
	var ySize = width * this.yRange;

	var xMax = x + xSize;
	var yMax = y + ySize;

	// calculate projected area of quad

	var area = this.projectedArea( x, y, xMax, yMax );

	if ( area < 0.05 ) {  // FIXME adjust to give best clustering

//		console.log( 'area:', area );

		var markers = quadInfo.markers;

		for ( i = 0, l = markers.length; i < l; i++ ) {

			markers[ i ].visible = false;

		}

	}

	if ( --order < 3 ) return;

	var xMid = ( x + xMax ) / 2;
	var yMid = ( y + yMax ) / 2;

	this.checkQuad( prefix, 0,    x,    y, order );
	this.checkQuad( prefix, 1,    x, yMid, order );
	this.checkQuad( prefix, 2, xMid,    y, order );
	this.checkQuad( prefix, 3, xMid, yMid, order );

}

ClusterMarkers.prototype.projectedArea = function ( xMin, yMin, xMax, yMax ) {

	var camera = this.camera;
	var matrixWorld = this.matrixWorld;

	A.set( xMin, yMin, 0 ).applyMatrix4( matrixWorld ).project( camera );
	B.set( xMin, yMax, 0 ).applyMatrix4( matrixWorld ).project( camera );
	C.set( xMax, yMax, 0 ).applyMatrix4( matrixWorld ).project( camera );
	D.set( xMax, yMin, 0 ).applyMatrix4( matrixWorld ).project( camera );

	var t1 = new Triangle( A, B, C );
	var t2 = new Triangle( A, C, D );

	return t1.area() + t2.area();

};

export { ClusterMarkers };

// EOF