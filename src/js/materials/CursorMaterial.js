
import { Shaders } from '../shaders/Shaders';
import { MATERIAL_LINE } from '../core/constants';
import { ColourCache } from '../core/ColourCache';

import { Vector3, ShaderMaterial } from '../../../../three.js/src/Three';

function CursorMaterial ( type, limits, offset ) {

	ShaderMaterial.call( this );

	this.halfRange = ( limits.max.z - limits.min.z ) / 2;
//	this.min = limits.min.z;
//	this.max = limits.max.z;

	this.defines = ( type === MATERIAL_LINE ) ? { USE_COLOR: true } : { SURFACE: true };

	this.uniforms = {
		uLight:      { value: new Vector3( -1, -1, 2 ) },
		cursor:      { value: 0 },
		cursorWidth: { value: 5.0 },
		baseColor:   { value: ColourCache.lightGrey },
		cursorColor: { value: ColourCache.green }
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

CursorMaterial.prototype.constructor = CursorMaterial;

CursorMaterial.prototype.setCursor = function ( value ) {

	var newValue = Math.max( Math.min( value, this.halfRange ), -this.halfRange );

	this.uniforms.cursor.value = newValue;

	return newValue; // return value clamped to material range

};

CursorMaterial.prototype.getCursor = function () {
console.log( 'cv', this.uniforms.cursor.value );
	return this.uniforms.cursor.value;

};

export { CursorMaterial };

// EOF