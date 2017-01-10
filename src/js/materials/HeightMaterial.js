
import { MATERIAL_LINE } from '../core/constants';
import { Shaders } from '../shaders/Shaders';
import { Colours } from '../core/Colours';

import { Vector3, ShaderMaterial } from '../../../../three.js/src/Three';

function HeightMaterial ( type, minHeight, maxHeight ) {

	ShaderMaterial.call( this );

	this.defines = {};

	if ( type === MATERIAL_LINE ) {

		this.defines.USE_COLOR = true;

	} else {

		this.defines.SURFACE = true;
		this.transparent = true;

	}
	
	this.uniforms = {

		// pseudo light source somewhere over viewer's left shoulder.
		uLight:         { value: new Vector3( -1, -1, 2 ) },

		minZ:           { value: minHeight },
		scaleZ:         { value: 1 / ( maxHeight - minHeight ) },
		cmap:           { value: Colours.gradientTexture },
		surfaceOpacity: { value: 0.5 }

	};

	this.vertexShader   = Shaders.heightVertexShader;
	this.fragmentShader = Shaders.heightFragmentShader;

	this.type = 'CV.HeightMaterial';

	this.addEventListener( 'update', _update );

	return this;

	function _update() {

		this.uniforms.surfaceOpacity.value = this.opacity;

	}

}

HeightMaterial.prototype = Object.create( ShaderMaterial.prototype );

HeightMaterial.prototype.constructor = HeightMaterial;

export { HeightMaterial };

// EOF