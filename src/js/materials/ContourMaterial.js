
import { Shaders } from '../shaders/Shaders';
import { ShaderMaterial } from '../Three';
import { Cfg } from '../core/lib';

function ContourMaterial ( terrain ) {

	ShaderMaterial.call( this, {
		vertexShader:    Shaders.contourVertexShader,
		fragmentShader:  Shaders.contourFragmentShader,
		depthWrite:      false,
		type:            'CV.ContourMaterial',
		uniforms: {
			datumShift:      { value: terrain.activeDatumShift },
			contourInterval: { value: Cfg.themeValue( 'shading.contours.interval' ) },
			contourColor:    { value: Cfg.themeColor( 'shading.contours.line' ) },
			contourColor10:  { value: Cfg.themeColor( 'shading.contours.line10' ) }
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