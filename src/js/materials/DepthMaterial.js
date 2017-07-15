
import { Shaders } from '../shaders/Shaders';
import { MATERIAL_LINE } from '../core/constants';
import { ColourCache } from '../core/ColourCache';

import { ShaderMaterial, Vector3 } from '../../../../three.js/src/Three';

function DepthMaterial ( type, limits, texture ) {

	var range = limits.getSize();

	var defines = ( type === MATERIAL_LINE ) ? { USE_COLOR: true } : { SURFACE: true };

	ShaderMaterial.call( this, {

		uniforms: {
			// pseudo light source somewhere over viewer's left shoulder.
			uLight: { value: new Vector3( -1, -1, 2 ) },
			minX:     { value: limits.min.x },
			minY:     { value: limits.min.y },
			minZ:     { value: limits.min.z },
			scaleX:   { value: 1 / range.x },
			scaleY:   { value: 1 / range.y },
			scaleZ:   { value: 1 / range.z },
			cmap:     { value: ColourCache.getTexture( 'gradient' ) },
			depthMap: { value: texture }
		},

		defines: defines,
		vertexShader: Shaders.depthVertexShader,
		fragmentShader: Shaders.depthFragmentShader
	} );

	this.type = 'CV.DepthMaterial';

	return this;

}

DepthMaterial.prototype = Object.create( ShaderMaterial.prototype );

DepthMaterial.prototype.constructor = DepthMaterial;

export { DepthMaterial };

// EOF