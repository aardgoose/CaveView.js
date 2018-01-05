
import { FEATURE_ENTRANCES,  upAxis } from '../core/constants';
import { GlyphString } from '../core/GlyphString';
import { Materials } from '../materials/Materials';
import { Point } from './Point';

import { Object3D, Vector3, Triangle, Plane, PointsMaterial, CanvasTexture } from '../../../../three.js/src/Three';


// preallocated objects for projected area calculation and cluster visibility checks

var __a = new Vector3();
var __b = new Vector3();
var __c = new Vector3();
var __d = new Vector3();

var __t1 = new Triangle( __a, __b, __c );
var __t2 = new Triangle( __a, __c, __d );

var __plane = new Plane();

var clusterMaterialCache = [];

function getClusterMaterial ( count ) {

	var material = clusterMaterialCache[ count ];

	if ( material !== undefined ) return material;

	var markerSize = 64;
	var halfSize = markerSize / 2;

	var canvas = document.createElement( 'canvas' );

	if ( ! canvas ) console.error( 'creating canvas for glyph atlas failed' );

	canvas.width  = markerSize;
	canvas.height = markerSize;

	var ctx = canvas.getContext( '2d' );

	if ( ! ctx ) console.error( 'cannot obtain 2D canvas' );

	// set transparent background

	ctx.fillStyle = 'rgba( 0, 0, 0, 0 )';
	ctx.fillRect( 0, 0, markerSize, markerSize );

	var fontSize = 40;

	ctx.textAlign = 'center';
	ctx.font = 'bold ' + fontSize + 'px helvetica,sans-serif';
	ctx.fillStyle = '#ffffff';

	var gradient = ctx.createRadialGradient( halfSize, halfSize, 30, halfSize, halfSize, 0 );

	gradient.addColorStop( 0.0, 'rgba( 255, 128, 0, 64 )' );
	gradient.addColorStop( 0.3, 'rgba( 255, 200, 0, 255 )' );
	gradient.addColorStop( 1.0, 'rgba( 255, 255, 0, 255 )' );

	ctx.fillStyle = gradient;

	ctx.beginPath();
	ctx.arc( halfSize, halfSize, 30, 0, Math.PI * 2 );
	ctx.fill();

	ctx.fillStyle = 'rgba( 0, 0, 0, 255 )';

	ctx.fillText( count, halfSize, halfSize + 15 );

	material = new PointsMaterial( { map: new CanvasTexture( canvas ), size: 32, depthTest: false, transparent: true, alphaTest: 0.8, sizeAttenuation: false } );
	material.fog = false;

	clusterMaterialCache[ count ] = material;

	return material;

}

function makeClusterMarker ( count ) {

	return new Point( getClusterMaterial( count ) );

}


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

QuadTree.prototype.check = function ( cluster, target, angleFactor ) {

	var subQuad;

	for ( var i = 0; i < 4; i++ ) {

		subQuad = this.nodes[ i ];

		if ( subQuad !== undefined ) {

			// prune quads that will never be clustered. will not be checked after first pass

			if ( subQuad.count < 2 ) {

				this.nodes[ i ] = undefined;

				continue;

			}

			// test for projected area for quad containing multiple markers

			var area = subQuad.projectedArea( cluster );

			// adjust for inclination to horizontal and distance from camera vs distance between camera and target

			__a.subVectors( cluster.camera.position, target );

			var d2Target = __a.length() * 2;

			__a.normalize();

			__plane.setFromNormalAndCoplanarPoint( __a, cluster.camera.position );

			if ( this.quadMarker === null ) {

				__b.copy( this.centroid.clone().divideScalar( this.count ) ).applyMatrix4( cluster.matrixWorld );

			} else {

				__b.copy( this.quadMarker.position ).applyMatrix4( cluster.matrixWorld );

			}

			var dCluster = Math.abs( __plane.distanceToPoint( __b ) );

			var depthRatio =  ( d2Target - dCluster ) / d2Target;

			//console.log( area, 'dr', Math.round( depthRatio * 100 )/100, 'af', Math.round( angleFactor * 100 ) / 100 , '++', Math.round( depthRatio * angleFactor * 100 * 20  ) / 100);

			// cluster markers compensated for angle to the horizontal and distance from camera plane

			if ( area < 10 * depthRatio * ( angleFactor) ) { // FIXME calibrate by screen size ???

				subQuad.clusterMarkers( cluster );

			} else {

				subQuad.showMarkers( true );
				subQuad.check( cluster, target, angleFactor );

			}

		}

	}

};

QuadTree.prototype.showMarkers = function ( visible ) {

	var markers = this.markers;

	// hide the indiviual markers in this quad

	for ( var i = 0, l = markers.length; i < l; i++ ) {

		markers[ i ].visible = visible;

	}

	if ( this.quadMarker !== null ) this.quadMarker.visible = false;

};

QuadTree.prototype.clusterMarkers = function ( cluster ) {

	var i, subQuad;

	// hide the indiviual markers in this quad

	this.showMarkers( false );

	// hide quadMarkers for contained quads

	for ( i = 0; i < 4; i++ ) {

		subQuad = this.nodes[ i ];

		if ( subQuad !== undefined ) subQuad.hideQuadMarkers();

	}

	if ( this.quadMarker === null ) {

		var quadMarker = makeClusterMarker( this.count );

		// set to center of distribution of markers in this quad.

		quadMarker.position.copy( this.centroid ).divideScalar( this.count );
		quadMarker.layers.set( FEATURE_ENTRANCES );

		cluster.add( quadMarker );

		this.quadMarker = quadMarker;

	}

	this.quadMarker.visible = true;

};

QuadTree.prototype.hideQuadMarkers = function () {

	var subQuad;

	if ( this.quadMarker ) this.quadMarker.visible = false;

	for ( var i = 0; i < 4; i++ ) {

		subQuad = this.nodes[ i ];

		if ( subQuad !== undefined ) subQuad.hideQuadMarkers();

	}

};

QuadTree.prototype.projectedArea = function ( cluster ) {

	var camera = cluster.camera;
	var matrixWorld = cluster.matrixWorld;
	var zAverage = this.centroid.z / this.count;

	__a.set( this.xMin, this.yMin, zAverage ).applyMatrix4( matrixWorld ).project( camera );
	__b.set( this.xMin, this.yMax, zAverage ).applyMatrix4( matrixWorld ).project( camera );
	__c.set( this.xMax, this.yMax, zAverage ).applyMatrix4( matrixWorld ).project( camera );
	__d.set( this.xMax, this.yMin, zAverage ).applyMatrix4( matrixWorld ).project( camera );

	return __t1.area() + __t2.area();

};

function ClusterMarkers ( limits, maxDepth ) {

	Object3D.call( this );

	var min = limits.min;
	var max = limits.max;

	this.maxDepth = maxDepth;

	this.type = 'CV.ClusterMarker';

	this.quadTree = new QuadTree( min.x, max.x, min.y, max.y );

	this.addEventListener( 'removed', this.onRemoved );

	return this;

}

ClusterMarkers.prototype = Object.create( Object3D.prototype );

ClusterMarkers.prototype.constructor = ClusterMarkers;

ClusterMarkers.prototype.onRemoved = function () {

	this.traverse(

		function _traverse ( obj ) {

			if ( obj.type === 'GlyphString' ) { obj.geometry.dispose(); }

		}

	);

};

ClusterMarkers.prototype.addMarker = function ( position, label ) {

	// create marker
	var material = Materials.getGlyphMaterial( 'normal helvetica,sans-serif', Math.PI / 4 );
	var marker = new GlyphString( label, material );

	marker.layers.set( FEATURE_ENTRANCES );
	marker.position.copy( position );

	this.quadTree.addNode( marker, this.maxDepth );

	this.add( marker );

	return marker;

};

ClusterMarkers.prototype.cluster = function () {

	var v = new Vector3();

	return function cluster ( camera, target ) {

		// determine which labels are too close together to be usefully displayed as separate objects.

		// immediate exit if only a single label or none.

		if ( this.children.length < 2 ) return;

		this.camera = camera;

		var angle = this.camera.getWorldDirection( v ).dot( upAxis );

		this.quadTree.check( this, target, 1 - Math.cos( angle ) );

		return;

	};

}();

export { ClusterMarkers };

// EOF