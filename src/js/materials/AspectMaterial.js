
import { Shaders } from '../shaders/Shaders';
import { Colours } from '../core/Colours';

import { Vector3, ShaderMaterial } from '../../../../three.js/src/Three';

function AspectMaterial () {

	ShaderMaterial.call( this );

//	this.defines = {};
	this.transparent = true;
	
	this.uniforms = {
		// pseudo light source somewhere over viewer's left shoulder.
		uLight:         { value: new Vector3( 0, 0, 2 ) },
		cmap:           { value: Colours.gradientTexture },
		surfaceOpacity: { value: 0.5 }
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