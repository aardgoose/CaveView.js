import { Shaders } from '../shaders/Shaders';
import { ColourCache } from '../core/ColourCache';
import { Cfg } from '../core/lib';

import { ShaderMaterial } from '../Three';

function HypsometricMaterial ( survey, viewer ) {

	const terrain = survey.terrain;

	var zMin = Cfg.themeValue( 'shading.hypsometric.min' );
	var zMax = Cfg.themeValue( 'shading.hypsometric.max' );

	if ( terrain.boundBox === undefined ) terrain.computeBoundingBox();

	if ( zMin === undefined ) zMin = terrain.boundingBox.min.z;
	if ( zMax === undefined ) zMax = terrain.boundingBox.max.z;

	ShaderMaterial.call( this, {
		vertexShader: Shaders.surfaceVertexShader,
		fragmentShader: Shaders.surfaceFragmentShader,
		type: 'CV.HypsometricMaterial',
		uniforms: {
			uLight:     { value: viewer.surfaceLightDirection },
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

export { HypsometricMaterial };

// EOF