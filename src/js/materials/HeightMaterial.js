
import { MATERIAL_LINE } from '../core/constants';
import { Shaders } from '../shaders/Shaders';
import { ColourCache } from '../core/ColourCache';

import { Vector3, ShaderMaterial } from '../Three';

function HeightMaterial ( type, limits ) {

	ShaderMaterial.call( this );

	this.defines = ( type === MATERIAL_LINE ) ? { USE_COLOR: true } : { SURFACE: true };

	var zMin, zMax;

	if ( limits ) {

		zMin = limits.min.z;
		zMax = limits.max.z;

	} else {

		zMin = 0;
		zMax = 100;

	}

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

HeightMaterial.prototype.constructor = HeightMaterial;

export { HeightMaterial };

// EOF