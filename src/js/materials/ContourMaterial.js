
import { Shaders } from '../shaders/Shaders';
import { ShaderMaterial } from '../Three';
import { Cfg } from '../core/lib';

function ContourMaterial ( survey, viewer ) {

	const terrain = survey.terrain;
	const zAdjust = survey.offsets.z;

	ShaderMaterial.call( this, {
		vertexShader:    Shaders.contourVertexShader,
		fragmentShader:  Shaders.contourFragmentShader,
		depthWrite:      false,
		type:            'CV.ContourMaterial',
		uniforms: {
			uLight:          { value: viewer.surfaceLightDirection },
			datumShift:      { value: terrain.activeDatumShift },
			zAdjust:         { value: zAdjust },
			contourInterval: { value: Cfg.themeValue( 'shading.contours.interval' ) },
			contourColor:    { value: Cfg.themeColor( 'shading.contours.line' ) },
			contourColor10:  { value: Cfg.themeColor( 'shading.contours.line10' ) },
			baseColor:       { value: Cfg.themeColor( 'shading.contours.base' ) },
			opacity:         { value: 0.5 }
		}
	} );

	this.transparent = true;

	this.extensions.derivatives = true;

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

ContourMaterial.prototype = Object.create( ShaderMaterial.prototype );

ContourMaterial.prototype.setDatumShift = function ( shift ) {

	this.uniforms.datumShift.value = shift;

};

export { ContourMaterial };

// EOF