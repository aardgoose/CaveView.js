import { MeshLambertMaterial } from '../Three';
import { CommonTerrainMaterial } from './CommonTerrainMaterial';

const fragment_pars = [
	'uniform vec3 contourColor;',
	'uniform vec3 contourColor10;',
	'uniform float contourInterval;',
	'uniform vec3 baseColor;',
	'varying float vPositionZ;',
].join( '\n' );

const fragment_color = [
	'float f = fract( vPositionZ / contourInterval );',
	'if ( f > 0.5 ) f = 1.0 - f;',
	'float f10 = fract( vPositionZ / ( contourInterval * 10.0 ) );',
	'float df = fwidth( vPositionZ / contourInterval );',
	'float contourColorSelection = step( 0.90, f10 );',
	'float c = smoothstep( df * 0.5, df * 1.0, f );',
	'vec4 finalColor = vec4( mix( contourColor, contourColor10, contourColorSelection ), 1.0 );',
	'vec4 baseColorAlpha = vec4( baseColor, opacity );',
	'diffuseColor = mix( finalColor, baseColorAlpha, c );'
].join( '\n' );

class ContourMaterial extends MeshLambertMaterial {

	constructor ( ctx ) {

		const survey = ctx.survey;
		const cfg = ctx.cfg;
		const materials = ctx.materials;

		super();

		this.transparent = true;
		this.extensions = { derivatives: true };

		this.onBeforeCompile = function ( shader ) {

			Object.assign( shader.uniforms, {
				zOffset:         { value: survey.offsets.z },
				contourInterval: { value: cfg.themeValue( 'shading.contours.interval' ) },
				contourColor:    { value: cfg.themeColor( 'shading.contours.line' ) },
				contourColor10:  { value: cfg.themeColor( 'shading.contours.line10' ) },
				baseColor:       { value: cfg.themeColor( 'shading.contours.base' ) }
			}, materials.commonDepthUniforms, materials.commonTerrainUniforms );

			const vertexShader = shader.vertexShader
				.replace( '#include <common>', '$&\nuniform float zOffset;\nuniform float datumShift;\nvarying float vPositionZ;\n' )
				.replace( 'include <begin_vertex>', '$&\nvPositionZ = position.z + zOffset + datumShift;\n' );

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

Object.assign( ContourMaterial.prototype, CommonTerrainMaterial.prototype );

export { ContourMaterial };