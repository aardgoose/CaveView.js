
import { Shaders } from '../shaders/Shaders';
import { MATERIAL_LINE } from '../core/constants';
import { ColourCache } from '../core/ColourCache';

import { ShaderMaterial, Vector3 } from '../Three';

function DepthMaterial ( type, survey ) {

	const surveyLimits = survey.modelLimits;
	const terrain = survey.terrain;
	const limits = terrain.boundingBox;
	const range = limits.getSize( new Vector3() );

	ShaderMaterial.call( this, {
		vertexShader: Shaders.depthVertexShader,
		fragmentShader: Shaders.depthFragmentShader,
		type: 'CV.DepthMaterial',
		uniforms: {
			// pseudo light source somewhere over viewer's left shoulder.
			uLight:     { value: survey.lightDirection },
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
		defines: {
			USE_COLOR: true,
			SURFACE: ( type !== MATERIAL_LINE )
		}
	} );

	return this;

}

DepthMaterial.prototype = Object.create( ShaderMaterial.prototype );

DepthMaterial.prototype.setDatumShift = function ( shift ) {

	this.uniforms.datumShift.value = shift;

};

export { DepthMaterial };

// EOF