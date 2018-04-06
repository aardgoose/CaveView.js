import { Shaders } from '../shaders/Shaders';
import { ColourCache } from '../core/ColourCache';

import { ShaderMaterial } from '../Three';

function HypsometricMaterial ( survey, viewer ) {

	const terrain = survey.terrain;
	const datumShift = terrain === null ? 0 : terrain.activeDatumShift;

	const zMin = 0;
	const zMax = 500;

	ShaderMaterial.call( this, {
		vertexShader: Shaders.surfaceVertexShader,
		fragmentShader: Shaders.surfaceFragmentShader,
		type: 'CV.HypsometricMaterial',
		uniforms: {
			uLight:     { value: viewer.surfaceLightDirection },
			datumShift: { value: datumShift },
			minZ:       { value: zMin },
			scaleZ:     { value: 1 / ( zMax - zMin ) },
			cmap:       { value: ColourCache.getTexture( 'hypsometric' ) },
			opacity:    { value: 0.5 }
		}
	} );

	this.transparent = true;

	Object.defineProperty( this, 'opacity', {
		writeable: true,
		get: function () { return this.uniforms.opacity.value; },
		set: function ( value ) { this.uniforms.opacity.value = value; }
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