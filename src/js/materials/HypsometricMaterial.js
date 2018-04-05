import { Shaders } from '../shaders/Shaders';
import { ColourCache } from '../core/ColourCache';

import { ShaderMaterial } from '../Three';

function HypsometricMaterial ( survey, viewer ) {

	const terrain = survey.terrain;
	const limits = terrain.boundingBox;

	const zMin = limits.min.z;
	const zMax = limits.max.z;

	ShaderMaterial.call( this, {
		vertexShader: Shaders.surfaceVertexShader,
		fragmentShader: Shaders.surfaceFragmentShader,
		type: 'CV.HypsometricMaterial',
		uniforms: {
			uLight: { value: viewer.surfaceLightDirection },
			datumShift:      { value: terrain.activeDatumShift },
			minZ:   { value: zMin },
			scaleZ: { value: 1 / ( zMax - zMin ) },
			cmap:   { value: ColourCache.getTexture( 'hypsometric' ) },
		}
	} );

	const self = this;

	viewer.addEventListener( 'lightingChange', _lightingChanged );

	return this;

	function _lightingChanged ( /* event */ ) {

		self.uniforms.uLight.value = viewer.surfaceLightDirection;

	}
}

HypsometricMaterial.prototype = Object.create( ShaderMaterial.prototype );

HypsometricMaterial.prototype.setDatumShift = function ( shift ) {

	this.uniforms.datumShift.value = shift;

};

export { HypsometricMaterial };

// EOF