import { ColourCache } from '../core/ColourCache';
import { Cfg } from '../core/lib';

import { MeshLambertMaterial} from '../Three';
import { CommonTerrainMaterial } from './CommonTerrainMaterial';
import { Shaders } from '../shaders/Shaders';

const fragment_pars = [
	'uniform sampler2D cmap;',
	'varying float zMap;',
	Shaders.commonTerrainCodePars
].join( '\n' );

const fragment_color = [
	'diffuseColor = texture2D( cmap, vec2( 1.0 - zMap, 1.0 ) );',
	'diffuseColor.a = opacity;',
	Shaders.commonTerrainCodeColor
].join( '\n' );

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

		Object.assign(
			shader.uniforms,
			CommonTerrainMaterial.uniforms,
			{
				minZ:   { value: zMin },
				scaleZ: { value: 1 / ( zMax - zMin ) },
				cmap:   { value: ColourCache.getTexture( 'hypsometric' ) }
			}
		);

		var vertexShader = shader.vertexShader
			.replace( '#include <common>', '\nuniform float minZ;\nuniform float scaleZ;\nvarying float zMap;\nvarying vec2 vPosition;\n$&' )
			.replace( 'include <begin_vertex>', '$&\nvPosition = vec2( position.x, position.y );\nzMap = saturate( ( position.z - minZ ) * scaleZ );' );

		var fragmentShader = shader.fragmentShader
			.replace( '#include <common>', '$&\n' + fragment_pars + '\n' )
			.replace( '#include <color_fragment>', fragment_color );

		shader.vertexShader = vertexShader;
		shader.fragmentShader = fragmentShader;

	};

	return this;

}

HypsometricMaterial.prototype = Object.create( MeshLambertMaterial.prototype );

Object.assign( HypsometricMaterial.prototype, CommonTerrainMaterial.prototype );

export { HypsometricMaterial };

// EOF