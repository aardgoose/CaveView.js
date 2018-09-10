import {
	Vector3, BufferGeometry, Float32BufferAttribute, Object3D, Mesh
} from '../Three';

import { WaterMaterial } from '../materials/WaterMaterial';
import { FEATURE_TRACES } from '../core/constants';

function beforeRender ( renderer, scene, camera, geometry, material ) {

	material.uniforms.offset.value += 0.1;

}

function DyeTraces ( metadata, surveyTree ) {

	const geometry = new BufferGeometry();

	Mesh.call( this, geometry, new WaterMaterial() );

	this.metadata = metadata;
	this.vertices = [];
	this.ends = [];
	this.selected = [];
	this.stations = [];

	this.onBeforeRender = beforeRender;
	this.layers.set( FEATURE_TRACES );
	this.visible = false;

	const traces = metadata.getTraces();
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
	const selected = this.selected;

	if ( vertices.length === 0 ) return;

	const ends = this.ends;

	const traceCount = vertices.length;

	const positions = new Float32BufferAttribute( traceCount * 3, 3 );
	const selection = new Float32BufferAttribute( traceCount * 3, 3 );
	const sinks = new Float32BufferAttribute( traceCount * 3, 3 );

	positions.copyVector3sArray( vertices );
	selection.copyArray( selected );
	sinks.copyVector3sArray( ends );

	if ( ! this.visible ) {

		geometry.addAttribute( 'position', positions );
		geometry.addAttribute( 'selection', selection );
		geometry.addAttribute( 'sinks', sinks );

	} else {

		geometry.getAttribute( 'position' ).copy( positions ).needsUpdate = true;
		geometry.getAttribute( 'selection' ).copy( selection ).needsUpdate = true;
		geometry.getAttribute( 'sinks' ).copy( sinks ).needsUpdate = true;

	}

	this.visible = true;

	// save to browser local storage
	this.metadata.saveTraces( this.serialise() );

	return this;

};

DyeTraces.prototype.getTraceStations = function ( hit ) {

	const stations = this.stations;

	return {
		start: stations[ hit * 2 ].getPath(),
		end: stations [ hit * 2 + 1 ].getPath()
	};

};

DyeTraces.prototype.deleteTrace = function ( hit ) {

	// remove from arrays

	this.stations.splice( hit * 2, 2 );

	this.vertices.splice( hit * 3, 3 );
	this.selected.splice( hit * 3, 3 );
	this.ends.splice( hit * 3, 3 );

	// rebuild geometry without deleted trace

	this.finish();

};

DyeTraces.prototype.addTrace = function ( startStation, endStation ) {

	const vertices = this.vertices;
	const selected = this.selected;
	const ends = this.ends;

	const end = new Vector3().copy( endStation.p );

	const v = new Vector3().subVectors( endStation.p, startStation.p ).cross( Object3D.DefaultUp ).setLength( 2 );

	const v1 = new Vector3().add( startStation.p ).add( v );
	const v2 = new Vector3().add( startStation.p ).sub( v );

	vertices.push( v1, v2, end );
	ends.push( end, end, end );
	selected.push( 0, 0, 0 );

	this.stations.push( startStation, endStation );

};

DyeTraces.prototype.outlineTrace = function ( hit ) {

	if ( ! this.visible ) return;

	const selection = this.geometry.getAttribute( 'selection' );
	const l = selection.count;

	for( var i = 0; i < l; i++ ) {

		selection.setX( i, 0 );

	}

	if ( hit !== null ) {

		let offset = hit * 3;

		selection.setX( offset++, 1 );
		selection.setX( offset++, 1 );
		selection.setX( offset++, 1 );

	}

	selection.needsUpdate = true;

	return;

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
