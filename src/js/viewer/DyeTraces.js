import {
	Vector3, BufferGeometry, Float32BufferAttribute, Mesh
} from '../../../../three.js/src/Three';

import { WaterMaterial } from '../materials/WaterMaterial';
import { FEATURE_TRACES, upAxis } from '../core/constants';

function beforeRender ( renderer, scene, camera, geometry, material ) {

	material.uniforms.offset.value += 0.1;

}

function DyeTraces () {

	var geometry = new BufferGeometry();

	Mesh.call( this, geometry, new WaterMaterial() );

	this.vertices = [];
	this.ends = [];

	this.onBeforeRender = beforeRender;
	this.layers.set( FEATURE_TRACES );

	return this;

}

DyeTraces.prototype = Object.create( Mesh.prototype );

DyeTraces.prototype.constructor = DyeTraces;

DyeTraces.prototype.finish = function () {

	var geometry = this.geometry;

	var vertices = this.vertices;
	var ends = this.ends;

	var positions = new Float32BufferAttribute( vertices.length * 3, 3 );
	var sinks = new Float32BufferAttribute( ends.length * 3, 3 );

	geometry.addAttribute( 'position', positions.copyVector3sArray( vertices ) );
	geometry.addAttribute( 'sinks', sinks.copyVector3sArray( ends ) );

	return this;

};

DyeTraces.prototype.addTrace = function ( startStation, endStation ) {

	var vertices = this.vertices;
	var ends = this.ends;

	var end = new Vector3().copy( endStation );

	var v = new Vector3().subVectors( endStation, startStation ).cross( upAxis ).setLength( 2 );

	var v1 = new Vector3().add( startStation ).add( v );
	var v2 = new Vector3().add( startStation ).sub( v );

	vertices.push( v1 );
	vertices.push( v2 );
	vertices.push( end );

	ends.push ( end );
	ends.push ( end );
	ends.push ( end );

};

export { DyeTraces };
