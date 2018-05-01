import { Shaders } from '../shaders/Shaders';
import { ColourCache } from '../core/ColourCache';
import { Cfg } from '../core/lib';

import { ShaderMaterial } from '../Three';

function HypsometricMaterial ( survey, viewer ) {

	const terrain = survey.terrain;
	const datumShift = terrain === null ? 0 : terrain.activeDatumShift;

	const zOffset = survey.offsets.z;

	var zMin = Cfg.themeValue( 'shading.hypsometric.min' );
	var zMax = Cfg.themeValue( 'shading.hypsometric.max' );

	if ( terrain.boundBox === undefined ) terrain.computeBoundingBox();

	if ( zMin === undefined ) zMin = terrain.boundingBox.min.z + zOffset;
	if ( zMax === undefined ) zMax = terrain.boundingBox.max.z + zOffset + 10;

	if ( terrain ) console.log( 'offset', terrain.boundingBox, zMin, zMax );

	ShaderMaterial.call( this, {
		vertexShader: Shaders.surfaceVertexShader,
		fragmentShader: Shaders.surfaceFragmentShader,
		type: 'CV.HypsometricMaterial',
		uniforms: {
			uLight:     { value: viewer.surfaceLightDirection },
			datumShift: { value: datumShift },
			minZ:       { value: zMin - zOffset },
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