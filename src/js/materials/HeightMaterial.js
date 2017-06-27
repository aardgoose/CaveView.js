
import { MATERIAL_LINE } from '../core/constants';
import { Shaders } from '../shaders/Shaders';
import { ColourCache } from '../core/ColourCache';

import { Vector3, ShaderMaterial } from '../../../../three.js/src/Three';

function HeightMaterial ( type, limits ) {

	ShaderMaterial.call( this );

	this.defines = ( type === MATERIAL_LINE ) ? { USE_COLOR: true } : { SURFACE: true };

	this.uniforms = {
		uLight: { value: new Vector3( -1, -1, 2 ) }, // pseudo light source somewhere over viewer's left shoulder.
		minZ:   { value: limits.min.z },
		scaleZ: { value: 1 / ( limits.max.z - limits.min.z ) },
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