import { ShaderMaterial, Vector2 } from '../Three';
import { Shaders } from './shaders/Shaders';

class PopupMaterial extends ShaderMaterial {

	constructor ( container, popupImage, rotation, colour ) {

		const cos = Math.cos( rotation );
		const sin = Math.sin( rotation );
		const pixelRatio = window.devicePixelRatio || 1;
		const canvas = popupImage.image;
		const rotationMatrix = new Float32Array( [ cos, sin, -sin, cos ] );

		const scale = new Vector2( canvas.width / Math.floor( pixelRatio * container.clientWidth), canvas.height / Math.floor( pixelRatio * container.clientHeight ) ).multiplyScalar( 2 );

		colour = colour || [ 1, 1, 1 ];

		super( {
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

		this.texture = popupImage;

		this.defaultAttributeValues.color = colour;

	}

}

export { PopupMaterial };