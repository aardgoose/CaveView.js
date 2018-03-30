
import { Shaders } from '../shaders/Shaders';
import { MATERIAL_LINE } from '../core/constants';
import { Cfg } from '../core/lib';

import { ShaderMaterial } from '../Three';

function CursorMaterial ( type, survey ) {

	const limits = survey.modelLimits;

	ShaderMaterial.call( this );

	this.halfRange = ( limits.max.z - limits.min.z ) / 2;

	this.defines = ( type === MATERIAL_LINE ) ? { USE_COLOR: true } : { SURFACE: true, USE_COLOR: true };

	this.uniforms = {
		uLight:      { value: survey.lightDirection },
		cursor:      { value: 0 },
		cursorWidth: { value: 5.0 },
		baseColor:   { value: Cfg.themeColor( 'shading.cursorBase' ) },
		cursorColor: { value: Cfg.themeColor( 'shading.cursor' ) }
	};

	this.vertexShader   = Shaders.cursorVertexShader;
	this.fragmentShader = Shaders.cursorFragmentShader;

	this.type = 'CV.CursorMaterial';

	this.addEventListener( 'update', _update );

	return this;

	function _update() {

		this.uniforms.surfaceOpacity.value = this.opacity;

	}

}

CursorMaterial.prototype = Object.create( ShaderMaterial.prototype );

CursorMaterial.prototype.setCursor = function ( value ) {

	const newValue = Math.max( Math.min( value, this.halfRange ), -this.halfRange );

	this.uniforms.cursor.value = newValue;

	return newValue; // return value clamped to material range

};

CursorMaterial.prototype.getCursor = function () {

	return this.uniforms.cursor.value;

};

export { CursorMaterial };

// EOF