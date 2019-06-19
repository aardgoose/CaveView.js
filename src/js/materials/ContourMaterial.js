
import { MeshLambertMaterial } from '../Three';
import { Cfg } from '../core/lib';

const fragment_pars = [
	'uniform vec3 contourColor;',
	'uniform vec3 contourColor10;',
	'uniform float contourInterval;',
	'uniform vec3 baseColor;',
	'varying float vPositionZ;',
].join( '\n' );

const fragment_color = [
	'float f = fract( vPositionZ / contourInterval );',
	'float f10 = fract( vPositionZ / ( contourInterval * 10.0 ) );',
	'float df = fwidth( vPositionZ / contourInterval );',
	'float contourColorSelection = step( 0.90, f10 );',
	'float c = smoothstep( df * 1.0, df * 2.0, f );',
	'vec4 finalColor = vec4( mix( contourColor, contourColor10, contourColorSelection ), 1.0 );',
	'vec4 baseColorAlpha = vec4( baseColor, opacity );',
	'diffuseColor = mix( finalColor, baseColorAlpha, c );'
].join( '\n' );

function ContourMaterial ( survey ) {

	MeshLambertMaterial.call( this );

	this.baseAdjust = survey.offsets.z;

	const terrain = survey.terrain;
	const zAdjust = this.baseAdjust + terrain.activeDatumShift;

	var materialShader; // get reference to shader in before compile.

	this.transparent = true;
	this.extensions = { derivatives: true };

	this.onBeforeCompile = function ( shader ) {

		Object.assign( shader.uniforms, {
			zAdjust:         { value: zAdjust },
			contourInterval: { value: Cfg.themeValue( 'shading.contours.interval' ) },
			contourColor:    { value: Cfg.themeColor( 'shading.contours.line' ) },
			contourColor10:  { value: Cfg.themeColor( 'shading.contours.line10' ) },
			baseColor:       { value: Cfg.themeColor( 'shading.contours.base' ) }
		} );

		var vertexShader = shader.vertexShader
			.replace( '#include <common>', '$&\nuniform float zAdjust;\nvarying float vPositionZ;\n' )
			.replace( 'include <begin_vertex>', '$&\nvPositionZ = position.z + zAdjust;\n' );

		var fragmentShader = shader.fragmentShader
			.replace( '#include <common>', '$&\n' + fragment_pars + '\n' )
			.replace( '#include <color_fragment>', fragment_color );

		shader.vertexShader = vertexShader;
		shader.fragmentShader = fragmentShader;

		materialShader = shader;

	};

	this.setDatumShift = function ( shift ) {

		materialShader.uniforms.zAdjust.value = this.baseAdjust + shift;

	};

	return this;

}

ContourMaterial.prototype = Object.create( MeshLambertMaterial.prototype );

export { ContourMaterial };

// EOF