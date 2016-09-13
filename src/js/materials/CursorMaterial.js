
import { Shaders } from '../shaders/Shaders.js';
import { MATERIAL_LINE } from '../core/constants.js';

import { Vector3, Color, ShaderMaterial } from '../../../../three.js/src/Three.js';

function CursorMaterial ( type, initialHeight ) {

	ShaderMaterial.call( this );

	this.defines = {};

	if ( type === MATERIAL_LINE ) {

		this.defines.USE_COLOR = true;

	} else {

		this.defines.SURFACE = true;

	}

	this.uniforms = {
			uLight:         { value: new Vector3( -1, -1, 2 ) },
			cursor:         { value: initialHeight },
			cursorWidth:    { value: 5.0 },
			baseColor:      { value: new Color( 0x888888 ) },
			cursorColor:    { value: new Color( 0x00ff00 ) },
			surfaceOpacity: { value: 0.5 }
		};

	this.vertexShader   = Shaders.cursorVertexShader;
	this.fragmentShader = Shaders.cursorFragmentShader;

	this.transparent = true;
	this.type = "CV.CursorMaterial";

	this.addEventListener( "update", _update );

	return this;

	function _update() {

		this.uniforms.surfaceOpacity.value = this.opacity;

	}

}


CursorMaterial.prototype = Object.create( ShaderMaterial.prototype );

CursorMaterial.prototype.constructor = CursorMaterial;

export { CursorMaterial };

// EOF