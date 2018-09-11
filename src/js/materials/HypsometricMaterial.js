import { ColourCache } from '../core/ColourCache';
import { Cfg } from '../core/lib';

import { MeshLambertMaterial} from '../Three';

function HypsometricMaterial ( survey ) {

	const terrain = survey.terrain;

	MeshLambertMaterial.call( this );

	var zMin = Cfg.themeValue( 'shading.hypsometric.min' );
	var zMax = Cfg.themeValue( 'shading.hypsometric.max' );

	if ( terrain.boundBox === undefined ) terrain.computeBoundingBox();

	if ( zMin === undefined ) zMin = terrain.boundingBox.min.z;
	if ( zMax === undefined ) zMax = terrain.boundingBox.max.z;

	this.transparent = true;
	this.opacity = 0.5;

	this.onBeforeCompile = function ( shader ) {

		Object.assign( shader.uniforms, {
			minZ:   { value: zMin },
			scaleZ: { value: 1 / ( zMax - zMin ) },
			cmap:   { value: ColourCache.getTexture( 'hypsometric' ) },
		} );

		var vertexShader = shader.vertexShader
			.replace( '#include <common>', '\nuniform float minZ;\nuniform float scaleZ;\nvarying float zMap;\n$&' )
			.replace( 'include <begin_vertex>', '$&\nzMap = saturate( ( position.z - minZ ) * scaleZ );' );

		var fragmentShader = shader.fragmentShader
			.replace( '#include <common>', 'uniform sampler2D cmap;\nvarying float zMap;\n$&' )
			.replace( '#include <color_fragment>', 'diffuseColor = texture2D( cmap, vec2( 1.0 - zMap, 1.0 ) );diffuseColor.a = opacity;' );

		shader.vertexShader = vertexShader;
		shader.fragmentShader = fragmentShader;

	};

	return this;

}

HypsometricMaterial.prototype = Object.create( MeshLambertMaterial.prototype );

export { HypsometricMaterial };

// EOF