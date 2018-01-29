import {
	Vector3, BufferGeometry, Float32BufferAttribute, Mesh
} from '../Three';

import { WaterMaterial } from '../materials/WaterMaterial';
import { FEATURE_TRACES, upAxis } from '../core/constants';

function beforeRender ( renderer, scene, camera, geometry, material ) {

	material.uniforms.offset.value += 0.1;

}

function DyeTraces () {

	const geometry = new BufferGeometry();

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

	const geometry = this.geometry;

	const vertices = this.vertices;
	const ends = this.ends;

	const positions = new Float32BufferAttribute( vertices.length * 3, 3 );
	const sinks = new Float32BufferAttribute( ends.length * 3, 3 );

	geometry.addAttribute( 'position', positions.copyVector3sArray( vertices ) );
	geometry.addAttribute( 'sinks', sinks.copyVector3sArray( ends ) );

	return this;

};

DyeTraces.prototype.addTrace = function ( startStation, endStation ) {

	const vertices = this.vertices;
	const ends = this.ends;

	const end = new Vector3().copy( endStation );

	const v = new Vector3().subVectors( endStation, startStation ).cross( upAxis ).setLength( 2 );

	const v1 = new Vector3().add( startStation ).add( v );
	const v2 = new Vector3().add( startStation ).sub( v );

	vertices.push( v1 );
	vertices.push( v2 );
	vertices.push( end );

	ends.push ( end );
	ends.push ( end );
	ends.push ( end );

};

export { DyeTraces };
