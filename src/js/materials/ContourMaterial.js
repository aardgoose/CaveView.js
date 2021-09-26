import { CommonTerrainMaterial } from './CommonTerrainMaterial';

const vertexPars = [
	'uniform float zOffset;',
	'uniform float datumShift;',
	'varying float vPositionZ;'
].join( '\n' );

const vertexMain = [
	'vPositionZ = position.z + zOffset + datumShift;'
].join( '\n' );

const fragmentPars = [
	'uniform vec3 contourColor;',
	'uniform vec3 contourColor10;',
	'uniform float contourInterval;',
	'uniform vec3 baseColor;',
	'varying float vPositionZ;',
].join( '\n' );

const fragmentColor = [
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

class ContourMaterial extends CommonTerrainMaterial {

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
			}, materials.commonDepthUniforms );

			this.editShader( shader, vertexPars, vertexMain, fragmentPars, fragmentColor );

		};

		Object.defineProperty( this, 'opacity', {
			get: function () { return ctx.materials.terrainOpacity; }
		} );

	}

}

export { ContourMaterial };