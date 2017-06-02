
import { FEATURE_ENTRANCES } from '../core/constants';
import { GlyphString } from './GlyphString';

import { Object3D, Vector3, Triangle, Mesh, SphereBufferGeometry } from '../../../../three.js/src/Three';


var A = new Vector3();
var B = new Vector3();
var C = new Vector3();
var D = new Vector3();

var sphere = new SphereBufferGeometry( 100 );

function QuadTree ( xMin, xMax, yMin, yMax ) {

	this.nodes = new Array( 4 );
	this.count = 0;
	this.markers = [];
	this.quadMarker = null;
	this.centroid = new Vector3();

	this.xMin = xMin;
	this.xMax = xMax;

	this.yMin = yMin;
	this.yMax = yMax;

}

QuadTree.prototype.addNode = function ( marker, depth ) {

	// add marker into this quad and recurse to inner quads

	var index = 0;
	var position = marker.position;

	this.markers.push( marker );
	this.centroid.add( marker.position );

	this.count++;

	if ( depth-- === 0 ) return;

	var xMid = ( this.xMin + this.xMax ) / 2;
	var yMid = ( this.yMin + this.yMax ) / 2;

	if ( position.x > xMid ) index += 1;
	if ( position.y > yMid ) index += 2;

	var subQuad = this.nodes[ index ];

	if ( subQuad === undefined ) {

		switch ( index ) {

		case 0:

			subQuad = new QuadTree( this.xMin, xMid, this.yMin, yMid );
			break;

		case 1:

			subQuad = new QuadTree( xMid, this.xMax, this.yMin, yMid );
			break;

		case 2:

			subQuad = new QuadTree( this.xMin, xMid, yMid, this.yMax );
			break;

		case 3:

			subQuad = new QuadTree( xMid, this.xMax, yMid, this.yMax );
			break;

		}

		this.nodes[ index ] = subQuad;

	}

	subQuad.addNode( marker, depth );

};

QuadTree.prototype.check = function ( cluster ) {

	var subQuad;

	for ( var i = 0; i < 4; i++ ) {

		subQuad = this.nodes[ i ];

		if ( subQuad !== undefined ) {

			// prune quads that will never be clustered. will not be checked after first pass

			if ( subQuad.count < 2 ) {

				this.nodes[ i ] === undefined;

				continue;

			}

			// test for projected area for quad containing multiple markers

			var area = subQuad.projectedArea( cluster );

//			console.log( 'area', area );

			if ( area < 0.05 ) { // FIXME calibrate by screen size ???

				subQuad.clusterMarkers( cluster );

			} else {

				subQuad.showMarkers();
				subQuad.check( cluster );

			}

		}

	}

};

QuadTree.prototype.showMarkers = function () {

	var markers = this.markers;

	// hide the indiviual markers in this quad

	for ( var i = 0, l = markers.length; i < l; i++ ) {

		markers[ i ].visible = true;

	}

	if ( this.quadMarker !== null ) this.quadMarker.visible = false;

};

QuadTree.prototype.clusterMarkers = function ( cluster ) {

	var markers = this.markers;

	// hide the indiviual markers in this quad
	for ( var i = 0, l = markers.length; i < l; i++ ) {

		markers[ i ].visible = false;

	}

	if ( this.quadMarker === null ) {

		var quadMarker = new Mesh( sphere );

		// set to center of distribution of markers in this quad.

		quadMarker.position.copy( this.centroid ).divideScalar( this.count );
		quadMarker.layers.set( FEATURE_ENTRANCES );

		cluster.add( quadMarker );

		this.quadMarker = quadMarker;

	}

	this.quadMarker.visible = true;

};

QuadTree.prototype.projectedArea = function ( cluster ) {

	var camera = cluster.camera;
	var matrixWorld = cluster.matrixWorld;

	A.set( this.xMin, this.yMin, 0 ).applyMatrix4( matrixWorld ).project( camera );
	B.set( this.xMin, this.yMax, 0 ).applyMatrix4( matrixWorld ).project( camera );
	C.set( this.xMax, this.yMax, 0 ).applyMatrix4( matrixWorld ).project( camera );
	D.set( this.xMax, this.yMin, 0 ).applyMatrix4( matrixWorld ).project( camera );

	var t1 = new Triangle( A, B, C );
	var t2 = new Triangle( A, C, D );

	return t1.area() + t2.area();

};

function ClusterMarkers ( limits, maxDepth ) {

	Object3D.call( this );

	this.maxDepth = maxDepth;

	this.type = 'CV.ClusterMarker';
	this.sphere = new SphereBufferGeometry( 100 );

	var min = limits.min;
	var max = limits.max;

	this.quadTree = new QuadTree( min.x, max.x, min.y, max.y );

	return this;

}

ClusterMarkers.prototype = Object.create( Object3D.prototype );

ClusterMarkers.prototype.constructor = ClusterMarkers;

ClusterMarkers.prototype.addMarker = function ( entrance ) {

	// create marker

	var marker = new GlyphString( entrance.label, window.glyphMaterial );

	marker.layers.set( FEATURE_ENTRANCES );
	marker.position.copy( entrance.position );

	this.quadTree.addNode( marker, this.maxDepth );

	this.add( marker );

	return marker;

};

ClusterMarkers.prototype.cluster = function ( camera ) {

	// determine which labels are too close together to be usefully displayed as separate objects.

	// immediate exit if only a single label.

	if ( this.children.length === 1 ) return;

	this.camera = camera;

	this.quadTree.check( this ) ;

	return;

};

export { ClusterMarkers };

// EOF