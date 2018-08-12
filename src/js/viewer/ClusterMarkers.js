
import { FEATURE_ENTRANCES, upAxis } from '../core/constants';
import { Cfg } from '../core/lib';
import { GlyphString } from '../core/GlyphString';
import { Materials } from '../materials/Materials';
import { Marker } from './Marker';
import { Object3D, Vector3, Triangle, Plane } from '../Three';


// preallocated objects for projected area calculation and cluster visibility checks

const __a = new Vector3();
const __b = new Vector3();
const __c = new Vector3();
const __d = new Vector3();

const __t1 = new Triangle( __a, __b, __c );
const __t2 = new Triangle( __a, __c, __d );

const __plane = new Plane();

const __v = new Vector3();

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

	if ( depth-- === 0 ) return;

	const position = marker.position;

	const xMid = ( this.xMin + this.xMax ) / 2;
	const yMid = ( this.yMin + this.yMax ) / 2;

	this.markers.push( marker );
	this.centroid.add( position );

	this.count++;

	var index = 0;

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

	var subQuad, i;

	for ( i = 0; i < 4; i++ ) {

		subQuad = this.nodes[ i ];

		if ( subQuad !== undefined ) {

			// prune quads that will never be clustered. will not be checked after first pass

			if ( subQuad.count < 2 ) {

				this.nodes[ i ] = undefined;

				continue;

			}

			// test for projected area for quad containing multiple markers

			const area = subQuad.projectedArea( cluster );

			// adjust for inclination to horizontal and distance from camera vs distance between camera and target

			__a.subVectors( cluster.camera.position, target );

			const d2Target = __a.length() * 2;

			__a.normalize();

			__plane.setFromNormalAndCoplanarPoint( __a, cluster.camera.position );

			if ( this.quadMarker === null ) {

				__b.copy( this.centroid.clone().divideScalar( this.count ) ).applyMatrix4( cluster.matrixWorld );

			} else {

				__b.copy( this.quadMarker.position ).applyMatrix4( cluster.matrixWorld );

			}

			const dCluster = Math.abs( __plane.distanceToPoint( __b ) );

			const depthRatio = ( d2Target - dCluster ) / d2Target;

			//console.log( area, 'dr', Math.round( depthRatio * 100 )/100, 'af', Math.round( angleFactor * 100 ) / 100 , '++', Math.round( depthRatio * angleFactor * 100 * 20 ) / 100);

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

	const markers = this.markers;

	// hide the indiviual markers in this quad

	for ( var i = 0, l = markers.length; i < l; i++ ) {

		markers[ i ].visible = visible;

	}

	if ( this.quadMarker !== null ) this.quadMarker.visible = false;

};

QuadTree.prototype.clusterMarkers = function ( cluster ) {

	var i;

	// hide the indiviual markers in this quad

	this.showMarkers( false );

	// hide quadMarkers for contained quads

	for ( i = 0; i < 4; i++ ) {

		const subQuad = this.nodes[ i ];

		if ( subQuad !== undefined ) subQuad.hideQuadMarkers();

	}

	if ( this.quadMarker === null ) {

		const quadMarker = new Marker( this.count );

		// set to center of distribution of markers in this quad.
		quadMarker.position.copy( this.centroid ).divideScalar( this.count );
		quadMarker.layers.set( FEATURE_ENTRANCES );

		if ( cluster.heightProvider !== null ) {

			quadMarker.adjustHeight( cluster.heightProvider );

		}

		cluster.addStatic( quadMarker );

		this.quadMarker = quadMarker;

	}

	this.quadMarker.visible = true;

};

QuadTree.prototype.hideQuadMarkers = function () {

	var i;

	if ( this.quadMarker ) this.quadMarker.visible = false;

	for ( i = 0; i < 4; i++ ) {

		const subQuad = this.nodes[ i ];

		if ( subQuad !== undefined ) subQuad.hideQuadMarkers();

	}

};

QuadTree.prototype.projectedArea = function ( cluster ) {

	const camera = cluster.camera;
	const matrixWorld = cluster.matrixWorld;
	const zAverage = this.centroid.z / this.count;

	__a.set( this.xMin, this.yMin, zAverage ).applyMatrix4( matrixWorld ).project( camera );
	__b.set( this.xMin, this.yMax, zAverage ).applyMatrix4( matrixWorld ).project( camera );
	__c.set( this.xMax, this.yMax, zAverage ).applyMatrix4( matrixWorld ).project( camera );
	__d.set( this.xMax, this.yMin, zAverage ).applyMatrix4( matrixWorld ).project( camera );

	return __t1.getArea() + __t2.getArea();

};

function ClusterMarkers ( limits, maxDepth ) {

	Object3D.call( this );

	const min = limits.min;
	const max = limits.max;

	this.maxDepth = maxDepth;

	this.type = 'CV.ClusterMarker';

	this.quadTree = new QuadTree( min.x, max.x, min.y, max.y );
	this.heightProvider = null;

	this.addEventListener( 'removed', this.onRemoved );

	return this;

}

ClusterMarkers.prototype = Object.create( Object3D.prototype );

ClusterMarkers.prototype.addHeightProvider = function ( func ) {

	this.heightProvider = func;

	this.traverse( function _setHeight( obj ) {

		if ( obj.isMarker ) obj.adjustHeight( func );

	} );

};

ClusterMarkers.prototype.onRemoved = function () {

	this.traverse(

		function _traverse ( obj ) {

			if ( obj.type === 'GlyphString' ) { obj.geometry.dispose(); }

		}

	);

};

ClusterMarkers.prototype.addMarker = function ( position, label ) {

	// create marker
	const atlasSpec = {
		color: Cfg.themeColorCSS( 'stations.entrances.text' ),
		font: 'normal helvetica,sans-serif'
	};

	const material = Materials.getGlyphMaterial( atlasSpec, Math.PI / 4 );
	const marker = new GlyphString( label, material );

	marker.layers.set( FEATURE_ENTRANCES );
	marker.position.copy( position );

	this.quadTree.addNode( marker, this.maxDepth );

	this.addStatic( marker );

	return marker;

};

ClusterMarkers.prototype.cluster = function ( camera, target ) {

	// determine which labels are too close together to be usefully displayed as separate objects.

	// immediate exit if only a single label or none.

	if ( this.children.length < 2 ) return;

	this.camera = camera;

	const angle = this.camera.getWorldDirection( __v ).dot( upAxis );

	this.quadTree.check( this, target, 1 - Math.cos( angle ) );

	return;

};

export { ClusterMarkers };

// EOF