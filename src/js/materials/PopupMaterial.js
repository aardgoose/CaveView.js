
import { ShaderMaterial } from '../../../../three.js/src/Three';
import { Shaders } from '../shaders/Shaders';

function PopupMaterial ( container, popupImage, rotation, colour ) {

	var cos = Math.cos( rotation );
	var sin = Math.sin( rotation );

	var rotationMatrix = new Float32Array( [ cos, sin, -sin, cos ] );

	colour = colour || [ 1, 1, 1 ];

	ShaderMaterial.call( this, {
		uniforms: {
			rotate: { value: rotationMatrix },
			popupImage: { value: popupImage },
			scale: { value: container.clientHeight / container.clientWidth }
		},
		vertexShader: Shaders.popupVertexShader,
		fragmentShader: Shaders.popupFragmentShader,
	} );

	this.opacity = 1.0;
	this.alphaTest = 0.8;
	this.depthTest = false;
	this.transparent = true;
	this.defines = { USE_COLOR: true };

	this.defaultAttributeValues.color = colour;
	this.type = 'CV.PopupMaterial';

	// event handler
	window.addEventListener( 'resize', _resize );

	var self = this;

	return this;

	function _resize() {

		self.uniforms.scale.value = container.clientHeight / container.clientWidth;

	}

}

PopupMaterial.prototype = Object.create( ShaderMaterial.prototype );

PopupMaterial.prototype.constructor = PopupMaterial;

export { PopupMaterial };

// EOF