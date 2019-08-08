
import { MeshLambertMaterial } from '../Three';
import { Cfg } from '../core/lib';
import { Vector2 } from 'three';

const fragment_pars = [
	'uniform float scale;',
	'uniform float accuracy;',
	'uniform vec2 target;',
	'uniform vec3 contourColor;',
	'varying vec2 vPosition;'
].join( '\n' );

const fragment_color = [
	'float targetDistance = distance( target, vPosition );',
	'float f = abs( targetDistance - accuracy ) * scale;',
	'float c = smoothstep( 1.0, 6.0, f );',
	'diffuseColor = mix( vec4( contourColor, 0.7 ), diffuseColor, c );'
].join( '\n' );

function TerrainOverlayMaterial ( parameters ) {

	MeshLambertMaterial.call( this, parameters );

	this.transparent = true;
	this.extensions = { derivatives: true };

	this.onBeforeCompile = function ( shader ) {

		// some uniforms shared by all material instances

		Object.assign( shader.uniforms, {
			scale: TerrainOverlayMaterial.scale,
			accuracy: TerrainOverlayMaterial.accuracy,
			target: TerrainOverlayMaterial.target,
			contourColor: { value: Cfg.themeColor( 'shading.contours.line' ) },
		} );

		var vertexShader = shader.vertexShader
			.replace( '#include <common>', '$&\nvarying vec2 vPosition;\n' )
			.replace( 'include <begin_vertex>', '$&\nvPosition = vec2( position.x, position.y );\n' );

		var fragmentShader = shader.fragmentShader
			.replace( '#include <common>', '$&\n' + fragment_pars + '\n' )
			.replace( '#include <color_fragment>', fragment_color );

		shader.vertexShader = vertexShader;
		shader.fragmentShader = fragmentShader;

	};

	return this;

}

TerrainOverlayMaterial.scale = { value: 1.0 };
TerrainOverlayMaterial.accuracy = { value: 0.0 };
TerrainOverlayMaterial.target = { value: new Vector2() };

TerrainOverlayMaterial.setScale = function ( scale ) {

	TerrainOverlayMaterial.scale.value = scale;

};

TerrainOverlayMaterial.setAccuracy = function ( accuracy ) {

	TerrainOverlayMaterial.accuracy.value = accuracy;

};

TerrainOverlayMaterial.setTarget = function ( target ) {

	TerrainOverlayMaterial.target.value.copy( target );

};

TerrainOverlayMaterial.prototype = Object.create( MeshLambertMaterial.prototype );

export { TerrainOverlayMaterial };

// EOF