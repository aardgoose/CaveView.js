import { BufferGeometry, Points, Float32BufferAttribute, Vector3, Object3D } from '../Three';

import { STATION_ENTRANCE } from '../core/constants';
import { PointIndicator } from './PointIndicator';

const __v = new Vector3();

class Stations extends Points {

	constructor ( ctx, selection ) {

		super( new BufferGeometry, ctx.materials.getExtendedPointsMaterial() );

		this.type = 'CV.Stations';
		this.map = new Map();
		this.stationCount = 0;

		const cfg = ctx.cfg;

		this.baseColor     = cfg.themeColor( 'stations.default.marker' );
		this.junctionColor = cfg.themeColor( 'stations.junctions.marker' );
		this.entranceColor = cfg.themeColor( 'stations.entrances.marker' );

		this.pointSizes = [];
		this.vertices   = [];
		this.colors     = [];

		this.stations = [];

		this.selected = null;
		this.selectedSize = 0;
		this.selection = selection;
		this.splaysVisible = false;

		const point = new PointIndicator( ctx, 0xff0000 );

		point.visible = false;

		this.addStatic( point );
		this.highlightPoint = point;
	}

}

Stations.prototype.addStation = function ( node ) {

	const point = node.p;

	const seen = this.map.get( point );

	if ( seen !== undefined ) {

		// console.log( 'duplicate', node.getPath(), seen.getPath() );
		return;

	}

	const connections = point.connections;

	this.vertices.push( point );

	let pointSize = 0.0;

	if ( node.type & STATION_ENTRANCE ) {

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

	if ( this.selection.contains( node.id ) &&
		( node.p.connections > 0 || this.splaysVisible )
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

Stations.prototype.selectStations = function ( selection ) {

	const stations = this.stations;
	const l = stations.length;
	const pSize = this.geometry.getAttribute( 'pSize' );
	const splaySize = this.splaysVisible ? 6.0 : 0.0;
	const idSet = selection.getIds();
	const isEmpty = selection.isEmpty();

	for ( let i = 0; i < l; i++ ) {

		const node = stations[ i ];

		let size = 8;

		if ( isEmpty || idSet.has( node.id ) ) {

			if ( node.type & STATION_ENTRANCE ) {

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

	bufferGeometry.getAttribute( 'color' ).onUpload( Object3D.onUploadDropBuffer );

	this.pointSizes = null;
	this.colors = null;

};

Stations.prototype.resetDistances = function () {

	this.stations.forEach( node => node.distance = Infinity );

};

Stations.prototype.getClosestVisibleStation = function ( camera, intersects ) {

	const splaysVisible = this.splaysVisible;

	let minD2 = Infinity;
	let closestStation = null;

	intersects.forEach( intersect => {

		const station = this.getStationByIndex( intersect.index );

		// don't select spays unless visible

		if ( ! splaysVisible && station !== null && station.p.connections === 0 ) return;

		// station in screen NDC
		__v.copy( station.p ).applyMatrix4( this.matrixWorld ).project( camera );

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

Stations.prototype.setSplaysVisibility = function ( visible ) {

	this.splaysVisible = visible;
	const splaySize = visible ? 6.0 : 0.0;

	const stations = this.stations;
	const pSize = this.geometry.getAttribute( 'pSize' );
	const l = stations.length;
	const selection = this.selection;

	for ( let i = 0; i < l; i++ ) {

		const node = stations[ i ];

		if ( node.p.connections === 0 && ( splaySize == 0 || selection.contains( node.id ) ) ) {

			pSize.setX( i, splaySize );

		}

	}

	pSize.needsUpdate = true;

};

export { Stations };