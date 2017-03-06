import {
	Color,
	BufferGeometry, Geometry,
	VertexColors,
	Points,
	Float32BufferAttribute
} from '../../../../three.js/src/Three';

import { ExtendedPointsMaterial } from '../materials/ExtendedPointsMaterial';

import { FEATURE_STATIONS, STATION_ENTRANCE } from '../core/constants';

function Stations () {

	Points.call( this, new BufferGeometry, new ExtendedPointsMaterial( { size: 1.0, opacity: 0.5, transparent: true,  vertexColors: VertexColors  } ) );

	this.type = 'CV.Stations';
	this.map = new Map();
	this.stationCount = 0;

	this.baseColor     = new Color( 0x880000 );
	this.junctionColor = new Color( 0xffff00 );

	this.layers.set( FEATURE_STATIONS );

	this.pointSizes = [];
	this.vertices   = [];
	this.colors     = [];

	this.stations = [];

}

Stations.prototype = Object.create ( Points.prototype );

Stations.prototype.contructor = Stations;

Stations.prototype.addStation = function ( node ) {

	var point = node.p;

	if ( point === undefined ) return;

	this.vertices.push( point );
	this.colors.push( this.baseColor );
	this.pointSizes.push( point.type === STATION_ENTRANCE ? 8.0 : 2.0 ); 

	this.map.set( point.x.toString() + ':' + point.y.toString() + ':' + point.z.toString(), node );
	this.stations.push( node );

	node.hitCount = 0;
	node.stationVertexIndex = this.stationCount++;
	node.linkedSegments = [];

};

Stations.prototype.getStation = function ( vertex ) {

	return this.map.get( vertex.x.toString() + ':' + vertex.y.toString() + ':' + vertex.z.toString() );

};


Stations.prototype.getStationByIndex = function ( index ) {

	return this.stations[ index ];

};

Stations.prototype.updateStation = function ( vertex ) {

	var	station = this.getStation( vertex );

	if ( station !== undefined ) { 

		station.hitCount++;

		if ( station.hitCount > 2 ) { 

			this.colors[ station.stationVertexIndex ] = this.junctionColor;
			this.pointSizes[ station.stationVertexIndex ] = 4.0;

		}

	}

};

Stations.prototype.finalise = function () {

	var bufferGeometry = this.geometry;

	var positions = new Float32BufferAttribute(this.vertices.length * 3, 3 );
	var colors = new Float32BufferAttribute( this.colors.length * 3, 3 );

	bufferGeometry.addAttribute( 'pSize', new Float32BufferAttribute( this.pointSizes, 1 ) );
	bufferGeometry.addAttribute( 'position', positions.copyVector3sArray( this.vertices ) );
	bufferGeometry.addAttribute( 'color', colors.copyColorsArray( this.colors ) );

	this.pointSizes = null;
	this.vertices   = null;
	this.colors     = null;

};

Stations.prototype.setScale = function ( scale ) {

	this.material.uniforms.pScale.value = scale;
	this.material.needsUpdate = true;

};


export { Stations };

