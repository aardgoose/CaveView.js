
import { MeshLambertMaterial } from '../Three';
import { CommonTerrainMaterial } from './CommonTerrainMaterial';
import { Shaders } from '../shaders/Shaders';

function TerrainOverlayMaterial ( parameters ) {

	MeshLambertMaterial.call( this, parameters );

	this.transparent = true;
	this.extensions = { derivatives: true };

	this.onBeforeCompile = function ( shader ) {

		// some uniforms shared by all material instances
		Object.assign( shader.uniforms, CommonTerrainMaterial.uniforms );

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
		get: function () { return TerrainOverlayMaterial.opacity; },
		set: function ( opacity ) { TerrainOverlayMaterial.opacity = opacity; }
	} );

	return this;

}

TerrainOverlayMaterial.opacity = 0.5;

TerrainOverlayMaterial.prototype = Object.create( MeshLambertMaterial.prototype );

Object.assign( TerrainOverlayMaterial.prototype, CommonTerrainMaterial.prototype );

export { TerrainOverlayMaterial };

// EOF