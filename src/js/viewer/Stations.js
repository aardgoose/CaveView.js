import {
	BufferGeometry,
	Points,
	Float32BufferAttribute,
	Vector3
} from '../Three';

import { ExtendedPointsMaterial } from '../materials/ExtendedPointsMaterial';

import { STATION_ENTRANCE, LEG_SPLAY } from '../core/constants';
import { Viewer } from '../viewer/Viewer';
import { Cfg } from '../core/lib';
import { PointIndicator } from './PointIndicator';

const __v = new Vector3();

function onUploadDropBuffer() {

	// call back from BufferAttribute to drop JS buffers after data has been transfered to GPU
	this.array = null;

}

function Stations ( sectionIdSet ) {

	Points.call( this, new BufferGeometry, new ExtendedPointsMaterial() );

	this.type = 'CV.Stations';
	this.map = new Map();
	this.stationCount = 0;

	this.baseColor     = Cfg.themeColor( 'stations.default.marker' );
	this.junctionColor = Cfg.themeColor( 'stations.junctions.marker' );
	this.entranceColor = Cfg.themeColor( 'stations.entrances.marker' );

	this.pointSizes = [];
	this.vertices   = [];
	this.colors     = [];

	this.stations = [];

	this.selected = null;
	this.selectedSize = 0;
	this.sectionIdSet = sectionIdSet;

	const self = this;

	Viewer.addEventListener( 'change', _viewChanged );

	this.addEventListener( 'removed', _removed );

	const point = new PointIndicator( 0xff0000 );

	point.visible = false;

	this.addStatic( point );
	this.highlightPoint = point;

	function _viewChanged( event ) {

		if ( event.name === 'splays' ) {

			const splaySize = Viewer.splays ? 6.0 : 0.0;

			const stations = self.stations;
			const pSize = self.geometry.getAttribute( 'pSize' );
			const l = stations.length;
			const sectionIdSet = self.sectionIdSet;

			var i;

			for ( i = 0; i < l; i++ ) {

				const node = stations[ i ];

				if ( node.p.connections === 0 && ( splaySize == 0 || sectionIdSet.size === 0 || sectionIdSet.has( node.id ) ) ) {

					pSize.setX( i, splaySize );

				}

			}

			pSize.needsUpdate = true;
			Viewer.renderView();

		}

	}

	function _removed ( ) {

		Viewer.removeEventListener( 'change', _viewChanged );

	}

}

Stations.prototype = Object.create ( Points.prototype );

Stations.prototype.addStation = function ( node ) {

	const point = node.p;

	const seen = this.map.get( point );

	if ( seen !== undefined ) {

		// console.log( 'duplicate', node.getPath(), seen.getPath() );
		return;

	}

	const connections = point.connections;

	this.vertices.push( point );


	var pointSize = 0.0;

	if ( node.type === STATION_ENTRANCE ) {

		this.colors.push( this.entranceColor );

		pointSize = 12.0;

	} else {

		this.colors.push( connections > 2 ? this.junctionColor : this.baseColor );

		pointSize = 8.0;

	}

	this.pointSizes.push( pointSize );

	this.map.set( point, node );
	this.stations.push( node );

	node.stationVertexIndex = this.stationCount++;
	node.linkedSegments = [];
	node.legs = [];
	node.distance = Infinity;

};

Stations.prototype.getStation = function ( vertex ) {

	return this.map.get( vertex );

};

Stations.prototype.getVisibleStation = function ( vertex ) {

	const node = this.map.get( vertex );
	const sectionIdSet = this.sectionIdSet;

	if (
		( sectionIdSet.size === 0 || sectionIdSet.has( node.id ) ) &&
		( node.p.connections > 0 || Viewer.splays )
	) return node;

	if ( node.label !== undefined ) node.label.visible = false;

	return null;

};

Stations.prototype.getStationByIndex = function ( index ) {

	return this.stations[ index ];

};

Stations.prototype.clearSelected = function () {

	if ( this.selected !== null ) {

		const pSize = this.geometry.getAttribute( 'pSize' );

		pSize.setX( this.selected, this.selectedSize );
		pSize.needsUpdate = true;

		this.selected = null;

	}

};

Stations.prototype.highlightStation = function ( node ) {

	const highlightPoint = this.highlightPoint;

	highlightPoint.position.copy( node.p );
	highlightPoint.updateMatrix();

	highlightPoint.visible = true;

	return node;

};

Stations.prototype.clearHighlight = function () {

	this.highlightPoint.visible = false;

};

Stations.prototype.selectStation = function ( node ) {

	this.selectStationByIndex( node.stationVertexIndex );

};

Stations.prototype.selectStationByIndex = function ( index ) {

	const pSize = this.geometry.getAttribute( 'pSize' );

	if ( this.selected !== null ) {

		pSize.setX( this.selected, this.selectedSize );

	}

	this.selectedSize = pSize.getX( index );

	pSize.setX( index, this.selectedSize * 2 );

	pSize.needsUpdate = true;

	this.selected = index;

};

Stations.prototype.selectStations = function () {

	const stations = this.stations;
	const l = stations.length;
	const pSize = this.geometry.getAttribute( 'pSize' );
	const splaySize = Viewer.splays ? 6.0 : 0.0;
	const sectionIdSet = this.sectionIdSet;

	var i;

	for ( i = 0; i < l; i++ ) {

		const node = stations[ i ];

		let size = 8;

		if ( sectionIdSet.size === 0 || sectionIdSet.has( node.id ) ) {

			if ( node.type === STATION_ENTRANCE ) {

				size = 12;

			} else if ( node.p.connections === 0 ) {

				size = splaySize;

			}

			pSize.setX( i , size );

		} else {

			pSize.setX( i, 0 );

			if ( node.label !== undefined ) node.label.visible = false;

		}

	}

	pSize.needsUpdate = true;

};

Stations.prototype.finalise = function () {

	const bufferGeometry = this.geometry;

	const positions = new Float32BufferAttribute(this.vertices.length * 3, 3 );
	const colors = new Float32BufferAttribute( this.colors.length * 3, 3 );

	bufferGeometry.setAttribute( 'pSize', new Float32BufferAttribute( this.pointSizes, 1 ) );
	bufferGeometry.setAttribute( 'position', positions.copyVector3sArray( this.vertices ) );
	bufferGeometry.setAttribute( 'color', colors.copyColorsArray( this.colors ) );

	bufferGeometry.getAttribute( 'color' ).onUpload( onUploadDropBuffer );

	this.pointSizes = null;
	this.colors = null;

};

Stations.prototype.resetDistances = function () {

	this.stations.forEach( function _resetDistance( node ) { node.distance = Infinity; } );

};

Stations.prototype.getClosestVisibleStation = function ( survey, camera, intersects ) {

	const splaysVisible = ( camera.layers.mask & 1 << LEG_SPLAY > 0 );
	const self = this;

	var minD2 = Infinity;
	var closestStation = null;

	intersects.forEach( function _checkIntersects( intersect ) {

		const station = self.getStationByIndex( intersect.index );

		// don't select spays unless visible

		if ( ! splaysVisible && station !== null && station.p.connections === 0 ) return;

		// station in screen NDC
		__v.copy( station.p ).applyMatrix4( survey.matrixWorld ).project( camera );

		__v.sub( intersect.point.project( camera ) );

		const d2 = __v.x * __v.x + __v.y * __v.y;

		// choose closest of potential matches in screen x/y space

		if ( d2 < minD2 ) {

			minD2 = d2;
			closestStation = station;

		}

	} );

	return closestStation;

};

export { Stations };