import { MeshLambertMaterial } from '../Three';
import { CommonTerrainMaterial } from './CommonTerrainMaterial';
import { Shaders } from '../shaders/Shaders';

function TerrainOverlayMaterial ( ctx ) {

	MeshLambertMaterial.call( this );

	this.transparent = true;

	this.onBeforeCompile = function ( shader ) {

		// some uniforms shared by all material instances
		Object.assign( shader.uniforms, ctx.materials.commonTerrainUniforms );

		var vertexShader = shader.vertexShader
			.replace( '#include <common>', '$&\nvarying vec2 vPosition;\n' )
			.replace( 'include <begin_vertex>', '$&\nvPosition = vec2( position.x, position.y );\n' );

		var fragmentShader = shader.fragmentShader
			.replace( '#include <common>', '$&\n' + Shaders.commonTerrainCodePars + '\n' )
			.replace( '#include <color_fragment>', Shaders.commonTerrainCodeColor );

		shader.vertexShader = vertexShader;
		shader.fragmentShader = fragmentShader;

	};

	Object.defineProperty( this, 'opacity', {
		get: function () { return ctx.materials.terrainOpacity; }
	} );

	return this;

}

TerrainOverlayMaterial.prototype = Object.create( MeshLambertMaterial.prototype );

Object.assign( TerrainOverlayMaterial.prototype, CommonTerrainMaterial.prototype );

export { TerrainOverlayMaterial };