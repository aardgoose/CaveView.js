
import { MeshLambertMaterial } from '../Three';
import { CommonTerrainUniforms } from './CommonTerrainUniforms';
import { Shaders } from '../shaders/Shaders';

function TerrainOverlayMaterial ( parameters ) {

	MeshLambertMaterial.call( this, parameters );

	this.transparent = true;
	this.extensions = { derivatives: true };

	this.onBeforeCompile = function ( shader ) {

		// some uniforms shared by all material instances
		Object.assign( shader.uniforms, CommonTerrainUniforms );

		var vertexShader = shader.vertexShader
			.replace( '#include <common>', '$&\nvarying vec2 vPosition;\n' )
			.replace( 'include <begin_vertex>', '$&\nvPosition = vec2( position.x, position.y );\n' );

		var fragmentShader = shader.fragmentShader
			.replace( '#include <common>', '$&\n' + Shaders.commonTerrainCodePars + '\n' )
			.replace( '#include <color_fragment>', Shaders.commonTerrainCodeColor );

		shader.vertexShader = vertexShader;
		shader.fragmentShader = fragmentShader;

	};

	return this;

}

TerrainOverlayMaterial.prototype = Object.create( MeshLambertMaterial.prototype );

export { TerrainOverlayMaterial };

// EOF