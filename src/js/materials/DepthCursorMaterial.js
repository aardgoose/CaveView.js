
import { Shaders } from '../shaders/Shaders';
import { MATERIAL_LINE } from '../core/constants';

import { ShaderMaterial, Color } from '../../../../three.js/src/Three';

function DepthCursorMaterial ( type, limits, texture ) {

	var range = limits.getSize();

	ShaderMaterial.call( this, {

		uniforms: {
			minX:           { value: limits.min.x },
			minY:           { value: limits.min.y },
			minZ:           { value: limits.min.z },
			scaleX:         { value: 1 / range.x },
			scaleY:         { value: 1 / range.y },
			scaleZ:         { value: range.z },
			depthMap:       { value: texture },
			cursor:         { value: ( limits.max.z - limits.min.z ) / 2 },
			cursorWidth:    { value: 5.0 },
			baseColor:      { value: new Color( 0x888888 ) },
			cursorColor:    { value: new Color( 0x00ff00 ) }
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
	this.depthMap = texture;
	this.max = range.z;

	return this;

}

DepthCursorMaterial.prototype = Object.create( ShaderMaterial.prototype );

DepthCursorMaterial.prototype.constructor = DepthCursorMaterial;

DepthCursorMaterial.prototype.setCursor = function ( value ) {

	var newValue = Math.max( Math.min( value, this.max ), 0 );

	this.uniforms.cursor.value = newValue;

	return newValue; // return value clamped to material range

};

DepthCursorMaterial.prototype.getCursor = function () {

	return this.uniforms.cursor.value;

};

export { DepthCursorMaterial };

// EOF