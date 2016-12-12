import {
	Vector3, Color,
	Geometry,
	PointsMaterial,
	VertexColors,
	Points
} from '../../../../three.js/src/Three.js';

import {
	NORMAL, SPLAY, SURFACE,
	FEATURE_STATIONS
} from '../core/constants.js';

function Stations () {

	Points.call( this,  new Geometry(), new PointsMaterial( { vertexColors: VertexColors } ) );

	this.type = "CV.Stations";
	this.map = new Map();
	this.stationCount = 0;

	this.baseColor     = new Color( 0x880000 );
	this.junctionColor = new Color( 0xffff00 );

	this.layers.set( FEATURE_STATIONS );

}

Stations.prototype = Object.create ( Points.prototype );

Stations.prototype.contructor = Stations;

Stations.prototype.addStation = function ( node ) {

	var point = node.p;
	var geometry = this.geometry;

	if ( point === undefined ) return;

	geometry.vertices.push( point );
	geometry.colors.push( this.baseColor );

	this.map.set( point.x.toString() + ":" + point.y.toString() + ":" + point.z.toString(), node );

	node.hitCount = 0;
	node.stationVertexIndex = this.stationCount++;
	node.linkedSegments = [];

}

Stations.prototype.getStation = function ( vertex ) {

		return this.map.get( vertex.x.toString() + ":" + vertex.y.toString() + ":" + vertex.z.toString() );

}


Stations.prototype.getStationByIndex = function ( index ) {

	return this.getStation( this.geometry.vertices[ index ] );

}

Stations.prototype.updateStation = function ( vertex ) {

	var	station = this.getStation( vertex );

	if ( station !== undefined ) { 

		station.hitCount++;

		if ( station.hitCount > 2 ) this.geometry.colors[ station.stationVertexIndex ] = this.junctionColor;

	}

}

export { Stations };