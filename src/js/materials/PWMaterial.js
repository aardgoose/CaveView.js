
import { Colours } from '../core/Colours.js';
import { Vector2, Vector3, Color, Uniform, ShaderMaterial } from '../../../../three.js/src/Three.js';

function PWMaterial () {

	ShaderMaterial.call( this, {

		uniforms: {
    		zoom:   new Uniform( 1.0 ).onUpdate( _updateZoomUniform ),
			offset: { value: new Vector2(1.150, 0.275) },
  			cmap:   { value: Colours.gradientTexture },
			uLight: { value: new Vector3( -1, -1, 2 ) }
   		 },

		vertexShader: Shaders.pwVertexShader,
		fragmentShader: Shaders.pwFragmentShader

	} );

	this.type = "PWMaterial";

	return this;

	function _updateZoomUniform() {

		this.value += 0.008;

	}

}

PWMaterial.prototype = Object.create( ShaderMaterial.prototype );

PWMaterial.prototype.constructor = PWMaterial;

export { PWMaterial };

// EOF