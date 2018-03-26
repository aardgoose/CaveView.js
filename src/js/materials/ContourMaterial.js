
import { Shaders } from '../shaders/Shaders';
import { ShaderMaterial } from '../Three';
import { Cfg } from '../core/lib';

function ContourMaterial () {

	ShaderMaterial.call( this, {
		vertexShader:    Shaders.contourVertexShader,
		fragmentShader:  Shaders.contourFragmentShader,
		depthWrite:      false,
		type:            'CV.ContourMaterial',
		uniforms: {
			datumShift:  { value: 0.0 },
			contourInterval:   { value: Cfg.themeValue( 'shading.contours.interval' ) },
			contourColor:   { value: Cfg.themeColor( 'shading.contours.line' ) }
		}
	} );

	this.alphaTest = 0.8;
	this.transparent = true;

	this.extensions.derivatives = true;

	return this;

}

ContourMaterial.prototype = Object.create( ShaderMaterial.prototype );

ContourMaterial.prototype.setDatumShift = function ( shift ) {

	this.uniforms.datumShift.value = shift;

};

export { ContourMaterial };

// EOF