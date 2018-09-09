import {
	Vector3, BufferGeometry, Float32BufferAttribute, Object3D, Mesh,
	LineBasicMaterial, LineSegments
} from '../Three';

import { WaterMaterial } from '../materials/WaterMaterial';
import { FEATURE_TRACES } from '../core/constants';

function beforeRender ( renderer, scene, camera, geometry, material ) {

	material.uniforms.offset.value += 0.1;

}

function DyeTraces ( traces, surveyTree ) {

	const geometry = new BufferGeometry();

	Mesh.call( this, geometry, new WaterMaterial() );

	this.vertices = [];
	this.ends = [];
	this.stations = [];

	this.onBeforeRender = beforeRender;
	this.layers.set( FEATURE_TRACES );
	this.empty = true;
	this.outline = null;

	const l = traces.length;

	if ( l > 0 ) {

		let i;

		for ( i = 0; i < l; i++ ) {

			const trace = traces[ i ];

			const startStation = surveyTree.getByPath( trace.start );
			const endStation   = surveyTree.getByPath( trace.end );

			if ( endStation === undefined || startStation === undefined ) continue;

			this.addTrace( startStation, endStation );

		}

		this.finish();

	}

	return this;

}

DyeTraces.prototype = Object.create( Mesh.prototype );

DyeTraces.prototype.finish = function () {

	const geometry = this.geometry;
	const vertices = this.vertices;
	const ends = this.ends;

	const positions = new Float32BufferAttribute( vertices.length * 3, 3 );
	const sinks = new Float32BufferAttribute( ends.length * 3, 3 );

	positions.copyVector3sArray( vertices );
	sinks.copyVector3sArray( ends );

	if ( this.empty ) {

		geometry.addAttribute( 'position', positions );
		geometry.addAttribute( 'sinks', sinks );


	} else {

		geometry.getAttribute( 'position' ).copy( positions ).needsUpdate = true;
		geometry.getAttribute( 'sinks' ).copy( sinks ).needsUpdate = true;

	}

	this.empty = false;

	return this;

};

DyeTraces.prototype.getTraceStations = function ( hit ) {

	const stations = this.stations;

	return {
		start: stations[ hit * 2 ].getPath(),
		end: stations [ hit * 2 + 1 ].getPath()
	};

};

DyeTraces.prototype.addTrace = function ( startStation, endStation ) {

	const vertices = this.vertices;
	const ends = this.ends;

	const end = new Vector3().copy( endStation.p );

	const v = new Vector3().subVectors( endStation.p, startStation.p ).cross( Object3D.DefaultUp ).setLength( 2 );

	const v1 = new Vector3().add( startStation.p ).add( v );
	const v2 = new Vector3().add( startStation.p ).sub( v );

	vertices.push( v1 );
	vertices.push( v2 );
	vertices.push( end );

	ends.push ( end );
	ends.push ( end );
	ends.push ( end );

	this.stations.push( startStation, endStation );

};

DyeTraces.prototype.outlineTrace = function ( hit ) {

	var outline = this.outline;

	if ( outline !== null) {

		outline.geometry.dispose();
		this.remove( outline );

	}

	// if null remove any existing outlines

	if ( hit === null ) return;

	const geometry = new BufferGeometry();

	outline = new LineSegments( geometry, new LineBasicMaterial( { color: 0xffff00 } ) );

	outline.layers.set( FEATURE_TRACES );

	const vertices = this.vertices;
	const lineVertices = [];

	var i = hit * 3;

	const v1 = vertices[ i++ ];
	const v2 = vertices[ i++ ];
	const v3 = vertices[ i++ ];

	lineVertices.push( v1, v2, v2, v3, v3, v1 );

	const positions = new Float32BufferAttribute( lineVertices.length * 3, 3 );

	positions.copyVector3sArray( lineVertices );
	geometry.addAttribute( 'position', positions );

	this.addStatic( outline );
	this.outline = outline;

};

DyeTraces.prototype.serialise = function () {

	const stations = this.stations;
	const traces = [];

	for ( var i = 0, l = stations.length; i < l; i += 2 ) {

		traces.push( {
			start: stations[ i ].getPath(),
			end: stations[ i + 1 ].getPath()
		} );

	}

	return traces;

};

export { DyeTraces };
