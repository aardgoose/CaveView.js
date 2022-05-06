import { FEATURE_ENTRANCES, CLUSTER_MARKERS } from '../core/constants';
import { GlyphString } from '../core/GlyphString';
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

class QuadTree {

	constructor ( ctx, xMin, xMax, yMin, yMax ) {

		this.nodes = new Array( 4 );
		this.count = 0;
		this.markers = [];
		this.quadMarker = null;
		this.centroid = new Vector3();
		this.ctx = ctx;

		this.xMin = xMin;
		this.xMax = xMax;

		this.yMin = yMin;
		this.yMax = yMax;

	}

	addNode ( marker, depth ) {

		// add marker into this quad and recurse to inner quads

		if ( depth-- === 0 ) return;

		const position = marker.position;
		const ctx = this.ctx;

		const xMid = ( this.xMin + this.xMax ) / 2;
		const yMid = ( this.yMin + this.yMax ) / 2;

		this.markers.push( marker );
		this.centroid.add( position );

		this.count++;

		let index = 0;

		if ( position.x > xMid ) index += 1;
		if ( position.y > yMid ) index += 2;

		let subQuad = this.nodes[ index ];

		if ( subQuad === undefined ) {

			switch ( index ) {

			case 0:

				subQuad = new QuadTree( ctx, this.xMin, xMid, this.yMin, yMid );
				break;

			case 1:

				subQuad = new QuadTree( ctx, xMid, this.xMax, this.yMin, yMid );
				break;

			case 2:

				subQuad = new QuadTree( ctx, this.xMin, xMid, yMid, this.yMax );
				break;

			case 3:

				subQuad = new QuadTree( ctx, xMid, this.xMax, yMid, this.yMax );
				break;

			}

			this.nodes[ index ] = subQuad;

		}

		subQuad.addNode( marker, depth );

	}

	check ( cluster, target, angleFactor, selection ) {

		for ( let i = 0; i < 4; i++ ) {

			const subQuad = this.nodes[ i ];

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

					__b.copy( this.centroid ).divideScalar( this.count ).applyMatrix4( cluster.matrixWorld );

				} else {

					__b.copy( this.quadMarker.position ).applyMatrix4( cluster.matrixWorld );

				}

				const dCluster = Math.abs( __plane.distanceToPoint( __b ) );

				const depthRatio = ( d2Target - dCluster ) / d2Target;

				//console.log( area, 'dr', Math.round( depthRatio * 100 )/100, 'af', Math.round( angleFactor * 100 ) / 100, '++', Math.round( depthRatio * angleFactor * 100 * 20 ) / 100);

				// cluster markers compensated for angle to the horizontal and distance from camera plane

				if ( area < 10 * depthRatio * angleFactor ) { // FIXME calibrate by screen size ???

					subQuad.clusterMarkers( cluster );

				} else {

					subQuad.showMarkers( selection );
					subQuad.check( cluster, target, angleFactor, selection );

				}

			}

		}

	}

	showMarkers ( selection ) {

		// show the indiviual markers in this quad

		this.markers.forEach( marker => marker.visible = selection.contains( marker.stationID ) );

		if ( this.quadMarker !== null ) this.quadMarker.visible = false;

	}

	hideMarkers () {

		// hide the indiviual markers in this quad

		this.markers.forEach( marker => marker.visible = false );

		if ( this.quadMarker !== null ) this.quadMarker.visible = false;

	}

	clusterMarkers ( cluster ) {

		// hide the indiviual markers in this quad

		this.hideMarkers();

		// hide quadMarkers for contained quads

		for ( let i = 0; i < 4; i++ ) {

			const subQuad = this.nodes[ i ];

			if ( subQuad !== undefined ) subQuad.hideQuadMarkers();

		}

		if ( this.quadMarker === null ) {

			const quadMarker = new Marker( this.ctx, this.count );

			// set to center of distribution of markers in this quad.
			quadMarker.position.copy( this.centroid ).divideScalar( this.count );
			quadMarker.layers.set( CLUSTER_MARKERS );

			if ( cluster.heightProvider !== null ) {

				quadMarker.adjustHeight( cluster.heightProvider );

			}

			cluster.addStatic( quadMarker );

			this.quadMarker = quadMarker;

		}

		this.quadMarker.visible = true;

	}

	hideQuadMarkers () {

		if ( this.quadMarker ) this.quadMarker.visible = false;

		for ( let i = 0; i < 4; i++ ) {

			const subQuad = this.nodes[ i ];

			if ( subQuad !== undefined ) subQuad.hideQuadMarkers();

		}

	}

	projectedArea ( cluster ) {

		const camera = cluster.camera;
		const matrixWorld = cluster.matrixWorld;
		const zAverage = this.centroid.z / this.count;

		__a.set( this.xMin, this.yMin, zAverage ).applyMatrix4( matrixWorld ).project( camera );
		__b.set( this.xMin, this.yMax, zAverage ).applyMatrix4( matrixWorld ).project( camera );
		__c.set( this.xMax, this.yMax, zAverage ).applyMatrix4( matrixWorld ).project( camera );
		__d.set( this.xMax, this.yMin, zAverage ).applyMatrix4( matrixWorld ).project( camera );

		return __t1.getArea() + __t2.getArea();

	}

}

class ClusterMarkers extends Object3D {

	constructor ( ctx, limits, maxDepth ) {

		super();

		const min = limits.min;
		const max = limits.max;

		this.maxDepth = maxDepth;

		this.type = 'CV.ClusterMarker';

		this.quadTree = new QuadTree( ctx, min.x, max.x, min.y, max.y );
		this.heightProvider = null;
		this.labels = [];
		this.ctx = ctx;

		const cfg = ctx.cfg;

		const atlasSpec = {
			background: cfg.themeColorCSS( 'stations.entrances.background' ),
			color: cfg.themeColorCSS( 'stations.entrances.text' ),
			font: 'normal helvetica,sans-serif'
		};

		const material = ctx.materials.getGlyphMaterial( atlasSpec, cfg.themeAngle( 'stations.entrances.angle' ) );

		material.depthTest = true;
		material.transparent = false;
		material.alphaTest = 0;

		this.labelMaterial = material;

		this.addEventListener( 'removed', this.onRemoved );

	}

	addHeightProvider( func ) {

		this.heightProvider = func;

		this.traverse( obj => { if ( obj.isMarker ) obj.adjustHeight( func ); } );

	}

	onRemoved () {

		this.traverse( obj => { if ( obj.type === 'GlyphString' ) obj.geometry.dispose(); } );

	}

	addMarker ( node, label ) {

		const marker = new GlyphString( label, this.labelMaterial, this.ctx );

		marker.layers.set( FEATURE_ENTRANCES );
		marker.position.copy( node );
		marker.stationID = node.id;

		this.labels.push( marker );
		this.quadTree.addNode( marker, this.maxDepth );

		this.addStatic( marker );

		return marker;

	}

	cluster ( cameraManager, target, selectedStationSet ) {

		// determine which labels are too close together to be usefully displayed as separate objects.

		// immediate exit if only a single label or none.
		if ( this.children.length < 2 ) return;

		this.camera = cameraManager.activeCamera;

		const angle = this.camera.getWorldDirection( __v ).dot( Object3D.DefaultUp );

		this.quadTree.check( this, target, Math.max( 0.05, 1 - Math.cos( angle ) ), selectedStationSet );

		// sort by depth and update label boxes
		this.labels.sort( ( a, b ) => b.getDepth( cameraManager ) - a.getDepth( cameraManager ) );

		// traverse from back to front and use label boxes to detect overlapping labels and
		// set visible = false on the rear most
		this.labels.forEach( ( l, i, labels ) => l.checkOcclusion( labels, i ) );

		return;

	}

}


export { ClusterMarkers };