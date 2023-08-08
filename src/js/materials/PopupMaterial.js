import { Vector2 } from '../Three';
import { ShaderNode, texture, trunc, uniform, varying, vec2, vec4, cameraProjectionMatrix, modelViewMatrix, positionGeometry, NodeMaterial } from '../Nodes';

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
		this.normals = false;
		this.generateMipmaps = false;

		const pixelRatio = window.devicePixelRatio || 1;
		const canvas = popupImage.image;

		// const cos = Math.cos( rotation );
		// const sin = Math.sin( rotation );
		// const rotationMatrix = new Float32Array( [ cos, sin, -sin, cos ] );
		this.vertexNode = new ShaderNode( ( stack ) => {

			const viewPort = new Vector2( Math.floor( pixelRatio * container.clientWidth ) / 2, Math.floor( pixelRatio * container.clientHeight ) / 2 );
			const scale = new Vector2( canvas.width, canvas.height ).divide( viewPort );

			// const rotate = uniform( mat2( cos, sin, -sin, cos ) );

			const newPosition = vec2( positionGeometry.x, positionGeometry.y );

			// position of Popup object on screen

			const offset = cameraProjectionMatrix.mul( modelViewMatrix ).mul( vec4( 0.0, 0.0, 0.0, 1.0 ) );

			// scale popup
			// move to clip space

			const fpos = vec4( newPosition.mul( uniform( scale ) ).mul( offset.w ), 0.0, 0.0 ).add( offset );

			// snap to screen pixels

			const snap = uniform( viewPort ).div( fpos.w );

			stack.assign( fpos, vec4( trunc( fpos.xy.mul( snap ) ).add( 0.5 ).div( snap ), fpos.z, fpos.w ) );

			return fpos;

		} );

		this.outputNode = texture( popupImage, varying( positionGeometry.xy ) );

		this.texture = popupImage;

	}

	constructDiffuseColor ( /* builder */  ) {}

}

export { PopupMaterial };