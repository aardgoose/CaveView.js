
import { Shaders } from '../shaders/Shaders';
import { Colours } from '../core/Colours';

import { ShaderMaterial } from '../../../../three.js/src/Three';

function AspectMaterial () {

	ShaderMaterial.call( this );

	this.transparent = true;

	this.uniforms = {
		// pseudo light source somewhere over viewer's left shoulder.
		cmap:           { value: Colours.spectrumTexture },
		surfaceOpacity: { value: 1.0 }
	};

	this.vertexShader = Shaders.aspectVertexShader;
	this.fragmentShader = Shaders.aspectFragmentShader;

	this.type = 'CV.AspectMaterial';

	return this;

}

AspectMaterial.prototype = Object.create( ShaderMaterial.prototype );

AspectMaterial.prototype.constructor = AspectMaterial;

export { AspectMaterial };

// EOF