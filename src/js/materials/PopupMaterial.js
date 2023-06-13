import { ShaderMaterial, Vector2 } from '../Three';
import { Shaders } from './shaders/Shaders';
import { float, texture, uniform, varying, vec2, vec3, vec4, cameraProjectionMatrix, modelViewMatrix, positionLocal, positionGeometry, NodeMaterial } from '../../../node_modules/three/examples/jsm/nodes/Nodes';
/*
class PopupMaterial extends NodeMaterial {

	constructor ( container, popupImage, rotation, colour ) {

		super( {
			opacity: 1.0,
			alphaTest: 0.8,
			depthTest: false,
			transparent: true
		} );

		this.isShaderMaterial = false;
		this.lights = false;

		console.log( 'ccx');
		const cos = Math.cos( rotation );
		const sin = Math.sin( rotation );
		const pixelRatio = window.devicePixelRatio || 1;
		const canvas = popupImage.image;
//		const rotationMatrix = new Float32Array( [ cos, sin, -sin, cos ] );

		const viewPort = new Vector2( Math.floor( pixelRatio * container.clientWidth ) / 2, Math.floor( pixelRatio * container.clientHeight ) / 2 );
		const scale = new Vector2( canvas.width, canvas.height ).divide( viewPort );

//		colour = colour || [ 1, 1, 1 ];

		// const rotate = uniform( mat2( cos, sin, -sin, cos ) );

		// FIXME - needs adjust to form factor of popup

		const newPosition = vec2( positionGeometry.x, positionGeometry.y );

//		const vColor = varying( color );

		// position of Popup object on screen

		const offset = cameraProjectionMatrix.mul( modelViewMatrix ).mul( vec4( float( 0.0 ), float( 0.0 ), float( 0.0 ), float( 1.0 ) ) );

		// scale popup
		// move to clip space

		const fpos = vec4( newPosition.mul( uniform( scale ) ).mul( offset.w ), float( 0.0 ), float( 0.0 ) ).add( offset );

		// snap to screen pixels

//		const snap = vec2( uniform( viewPort ) ).div( fpos.w );

//		fpos.xy = trunc( fpos.xy.mul( snap ) ).add( float( 0.5 ) ).div( snap );

		this.positionNode = fpos;
//		this.positionNode = vec4( positionGeometry, float( 1 ) );
//		this.positionNode = cameraProjectionMatrix.mul( modelViewMatrix ).mul( positionGeometry );

		this.colorNode = texture( popupImage, varying( positionGeometry.xy ) );

//		this.texture = popupImage;
//		this.defaultAttributeValues.color = colour;

	}

}
*/
class PopupMaterial extends ShaderMaterial {

	constructor ( container, popupImage, rotation, colour ) {

		const cos = Math.cos( rotation );
		const sin = Math.sin( rotation );
		const pixelRatio = window.devicePixelRatio || 1;
		const canvas = popupImage.image;
		const rotationMatrix = new Float32Array( [ cos, sin, -sin, cos ] );

		const viewPort = new Vector2( Math.floor( pixelRatio * container.clientWidth ) / 2, Math.floor( pixelRatio * container.clientHeight ) / 2 );
		const scale = new Vector2( canvas.width, canvas.height ).divide( viewPort );

		colour = colour || [ 1, 1, 1 ];

		super( {
			vertexShader: Shaders.popupVertexShader,
			fragmentShader: Shaders.popupFragmentShader,
			type: 'CV.PopupMaterial',
			uniforms: {
				rotate: { value: rotationMatrix },
				popupImage: { value: popupImage },
				scale: { value: scale },
				viewPort: { value: viewPort }
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