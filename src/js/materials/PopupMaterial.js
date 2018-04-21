
import { ShaderMaterial } from '../Three';
import { Shaders } from '../shaders/Shaders';

function PopupMaterial ( container, popupImage, rotation, colour ) {

	const cos = Math.cos( rotation );
	const sin = Math.sin( rotation );

	const canvas = popupImage.image;
	const rotationMatrix = new Float32Array( [ cos, sin, -sin, cos ] );
	const scale = ( canvas.width * container.clientHeight ) / ( canvas.height * container.clientWidth );

	colour = colour || [ 1, 1, 1 ];

	ShaderMaterial.call( this, {
		vertexShader: Shaders.popupVertexShader,
		fragmentShader: Shaders.popupFragmentShader,
		type: 'CV.PopupMaterial',
		uniforms: {
			rotate: { value: rotationMatrix },
			popupImage: { value: popupImage },
			scale: { value: scale }
		},
		defines: {
			USE_COLOR: true
		}
	} );

	this.opacity = 1.0;
	this.alphaTest = 0.8;
	this.depthTest = false;
	this.transparent = true;

	this.defaultAttributeValues.color = colour;

	return this;

}

PopupMaterial.prototype = Object.create( ShaderMaterial.prototype );

export { PopupMaterial };

// EOF