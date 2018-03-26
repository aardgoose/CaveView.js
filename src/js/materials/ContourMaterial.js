
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
			contourInterval:   { value: Cfg.themeValue( 'shading.contours.interval' ) },
			contourColor:   { value: Cfg.themeColor( 'shading.contours.line' ) }
		}
	} );

	this.extensions.derivatives = true;

	return this;

}

ContourMaterial.prototype = Object.create( ShaderMaterial.prototype );

export { ContourMaterial };

// EOF