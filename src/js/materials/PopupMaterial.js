
import { ShaderMaterial, Vector2 } from '../Three';
import { Shaders } from '../shaders/Shaders';

function PopupMaterial ( container, popupImage, rotation, colour ) {

	const cos = Math.cos( rotation );
	const sin = Math.sin( rotation );
	const pixelRatio = window.devicePixelRatio || 1 ;
	const canvas = popupImage.image;
	const rotationMatrix = new Float32Array( [ cos, sin, -sin, cos ] );
	const scale = new Vector2( canvas.width * pixelRatio / container.clientWidth,  canvas.height * pixelRatio / container.clientHeight );

	colour = colour || [ 1, 1, 1 ];

	ShaderMaterial.call( this, {
		vertexShader: Shaders.popupVertexShader,
		fragmentShader: Shaders.popupFragmentShader,
		type: 'CV.PopupMaterial',
		uniforms: {
			rotate: { value: rotationMatrix },
			popupImage: { value: popupImage },
			scale: { value: scale },
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