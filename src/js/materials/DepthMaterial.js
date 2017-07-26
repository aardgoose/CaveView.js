
import { Shaders } from '../shaders/Shaders';
import { MATERIAL_LINE } from '../core/constants';
import { ColourCache } from '../core/ColourCache';

import { ShaderMaterial, Vector3 } from '../../../../three.js/src/Three';

function DepthMaterial ( type, surveyLimits, terrain ) {

	var limits = terrain.boundingBox;
	var range = limits.getSize();

	var defines = ( type === MATERIAL_LINE ) ? { USE_COLOR: true } : { SURFACE: true };

	ShaderMaterial.call( this, {

		uniforms: {
			// pseudo light source somewhere over viewer's left shoulder.
			uLight:     { value: new Vector3( -1, -1, 2 ) },
			minX:       { value: limits.min.x },
			minY:       { value: limits.min.y },
			minZ:       { value: limits.min.z },
			scaleX:     { value: 1 / range.x },
			scaleY:     { value: 1 / range.y },
			rangeZ:     { value: range.z },
			depthScale: { value: 1 / ( surveyLimits.max.z - surveyLimits.min.z ) },
			cmap:       { value: ColourCache.getTexture( 'gradient' ) },
			depthMap:   { value: terrain.depthTexture },
			datumShift: { value: 0.0 }
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

DepthMaterial.prototype.setDatumShift = function ( shift ) {

	this.uniforms.datumShift.value = shift;

};

export { DepthMaterial };

// EOF