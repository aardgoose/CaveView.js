
import { Shaders } from '../shaders/Shaders';
import { MATERIAL_LINE } from '../core/constants';
import { Cfg } from '../core/lib';

import { ShaderMaterial, Vector3 } from '../Three';

function DepthCursorMaterial ( type, survey ) {

	const surveyLimits = survey.modelLimits;
	const terrain = survey.terrain;

	const limits = terrain.boundingBox;
	const range = limits.getSize( new Vector3() );

	// max range of depth values
	this.max = surveyLimits.max.z - surveyLimits.min.z;

	ShaderMaterial.call( this, {

		uniforms: {
			uLight:      { value: new Vector3( -1, -1, 2 ) },
			minX:        { value: limits.min.x },
			minY:        { value: limits.min.y },
			minZ:        { value: limits.min.z },
			scaleX:      { value: 1 / range.x },
			scaleY:      { value: 1 / range.y },
			rangeZ:      { value: range.z },
			depthMap:    { value: terrain.depthTexture },
			datumShift:  { value: 0.0 },
			cursor:      { value: this.max / 2 },
			cursorWidth: { value: 5.0 },
			baseColor:   { value: Cfg.themeColor( 'shading.cursorBase' ) },
			cursorColor: { value: Cfg.themeColor( 'shading.cursor' ) }
		},
		vertexShader: Shaders.depthCursorVertexShader,
		fragmentShader: Shaders.depthCursorFragmentShader
	} );

	this.defines = {};

	if ( type === MATERIAL_LINE ) {

		this.defines.USE_COLOR = true;

	} else {

		this.defines.SURFACE = true;

	}

	this.type = 'CV.DepthCursorMaterial';

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

DepthCursorMaterial.prototype.setDatumShift = function ( shift ) {

	this.uniforms.datumShift.value = shift;

};

export { DepthCursorMaterial };

// EOF