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

class HypsometricMaterial extends MeshLambertMaterial {

	constructor ( ctx ) {

		const survey = ctx.survey;
		const cfg = ctx.cfg;
		const terrain = survey.terrain;
		const textureCache = ctx.materials.textureCache;

		super();

		let zMin = cfg.themeValue( 'shading.hypsometric.min' );
		let zMax = cfg.themeValue( 'shading.hypsometric.max' );

		if ( terrain.boundBox === undefined ) terrain.computeBoundingBox();

		if ( zMin === undefined ) zMin = terrain.boundingBox.min.z;
		if ( zMax === undefined ) zMax = terrain.boundingBox.max.z;

		this.transparent = true;

		this.onBeforeCompile = function ( shader ) {

			Object.assign(
				shader.uniforms,
				ctx.materials.commonTerrainUniforms,
				{
					minZ:   { value: zMin },
					scaleZ: { value: 1 / ( zMax - zMin ) },
					cmap:   { value: textureCache.getTexture( 'hypsometric' ) }
				}
			);

			const vertexShader = shader.vertexShader
				.replace( '#include <common>', '\nuniform float minZ;\nuniform float scaleZ;\nvarying float zMap;\nvarying vec2 vPosition;\n$&' )
				.replace( 'include <begin_vertex>', '$&\nvPosition = vec2( position.x, position.y );\nzMap = saturate( ( position.z - minZ ) * scaleZ );' );

			const fragmentShader = shader.fragmentShader
				.replace( '#include <common>', '$&\n' + fragment_pars + '\n' )
				.replace( '#include <color_fragment>', fragment_color );

			shader.vertexShader = vertexShader;
			shader.fragmentShader = fragmentShader;

		};

		Object.defineProperty( this, 'opacity', {
			get: function () { return ctx.materials.terrainOpacity; }
		} );

	}

}

Object.assign( HypsometricMaterial.prototype, CommonTerrainMaterial.prototype );

export { HypsometricMaterial };