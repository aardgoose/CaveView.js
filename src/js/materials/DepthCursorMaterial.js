import { Shaders } from '../shaders/Shaders';
import { MATERIAL_LINE } from '../core/constants';

import { ShaderMaterial, Vector3 } from '../Three';

function DepthCursorMaterial ( ctx, type ) {

	const survey = ctx.survey;
	const cfg = ctx.cfg;
	const surveyLimits = survey.modelLimits;
	const terrain = survey.terrain;

	const limits = terrain.boundingBox;
	const range = limits.getSize( new Vector3() );

	// max range of depth values
	this.max = surveyLimits.max.z - surveyLimits.min.z;

	ShaderMaterial.call( this, {
		vertexShader: Shaders.depthCursorVertexShader,
		fragmentShader: Shaders.depthCursorFragmentShader,
		type: 'CV.DepthCursorMaterial',
		uniforms: Object.assign( {
			uLight:      { value: survey.lightDirection },
			modelMin:    { value: limits.min },
			scaleX:      { value: 1 / range.x },
			scaleY:      { value: 1 / range.y },
			rangeZ:      { value: range.z },
			depthMap:    { value: terrain.depthTexture },
			cursor:      { value: this.max / 2 },
			cursorWidth: { value: 5.0 },
			baseColor:   { value: cfg.themeColor( 'shading.cursorBase' ) },
			cursorColor: { value: cfg.themeColor( 'shading.cursor' ) },
		}, ctx.materials.commonUniforms, ctx.materials.commonDepthUniforms ),
		defines: {
			USE_COLOR: true,
			SURFACE: ( type !== MATERIAL_LINE )
		}
	} );

	//	Object.assign( this.uniforms, ctx.materials.commonDepthUniforms ); FIXME?

	return this;

}

DepthCursorMaterial.prototype = Object.create( ShaderMaterial.prototype );

DepthCursorMaterial.prototype.setCursor = function ( value ) {

	const newValue = Math.max( Math.min( value, this.max ), 0 );

	this.uniforms.cursor.value = newValue;

	return newValue; // return value clamped to material range

};

DepthCursorMaterial.prototype.getCursor = function () {

	return this.uniforms.cursor.value;

};

export { DepthCursorMaterial };