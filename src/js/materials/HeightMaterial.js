
import { MATERIAL_LINE } from '../core/constants';
import { Shaders } from '../shaders/Shaders';
import { ColourCache } from '../core/ColourCache';

import { ShaderMaterial } from '../Three';

function HeightMaterial ( type, survey ) {

	const limits = survey.modelLimits;

	ShaderMaterial.call( this );

//	this.defines = ( type === MATERIAL_LINE ) ? { USE_COLOR: true } : { SURFACE: true };
	this.defines = ( type === MATERIAL_LINE ) ? { USE_COLOR: true } : { SURFACE: true, USE_COLOR: true };

	const zMin = limits.min.z;
	const zMax = limits.max.z;

	this.uniforms = {
		uLight: { value: survey.lightDirection },
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