
import { MATERIAL_LINE } from '../core/constants';
import { Shaders } from '../shaders/Shaders';
import { ColourCache } from '../core/ColourCache';

import { Vector3, ShaderMaterial } from '../Three';

function HeightMaterial ( type, survey ) {

	const limits = survey.modelLimits;

	ShaderMaterial.call( this );

	this.defines = ( type === MATERIAL_LINE ) ? { USE_COLOR: true } : { SURFACE: true };

	const zMin = limits.min.z;
	const zMax = limits.max.z;

	this.uniforms = {
		uLight: { value: new Vector3( -1, -1, 2 ) }, // pseudo light source somewhere over viewer's left shoulder.
		minZ:   { value: zMin },
		scaleZ: { value: 1 / ( zMax - zMin ) },
		cmap:   { value: ColourCache.getTexture( 'gradient' ) },
	};

	this.vertexShader = Shaders.heightVertexShader;
	this.fragmentShader = Shaders.heightFragmentShader;

	this.type = 'CV.HeightMaterial';

	return this;

}

HeightMaterial.prototype = Object.create( ShaderMaterial.prototype );

export { HeightMaterial };

// EOF