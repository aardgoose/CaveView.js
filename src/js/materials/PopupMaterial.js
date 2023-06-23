import { Vector2 } from '../Three';
import { float, texture, uniform, varying, vec2, vec4, cameraProjectionMatrix, modelViewMatrix, positionGeometry, NodeMaterial } from '../Nodes';

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

		const pixelRatio = window.devicePixelRatio || 1;
//		const canvas = popupImage.image;

		// const cos = Math.cos( rotation );
		// const sin = Math.sin( rotation );
		// const rotationMatrix = new Float32Array( [ cos, sin, -sin, cos ] );

		const viewPort = new Vector2( Math.floor( pixelRatio * container.clientWidth ) / 2, Math.floor( pixelRatio * container.clientHeight ) / 2 );
//		const scale = new Vector2( canvas.width, canvas.height ).divide( viewPort );
		const scale = new Vector2( 100, 100 );

		// const rotate = uniform( mat2( cos, sin, -sin, cos ) );

		// FIXME - needs adjust to form factor of popup

		const newPosition = vec2( positionGeometry.x, positionGeometry.y );

//		const vColor = varying( color );

		// position of Popup object on screen

		const offset = cameraProjectionMatrix.mul( modelViewMatrix ).mul( vec4( float( 0.0 ), float( 0.0 ), float( 0.0 ), float( 1.0 ) ) );

		// scale popup
		// move to clip space

		this.outNode = vec4( newPosition.mul( uniform( scale ) ).mul( offset.w ), float( 0.0 ), float( 0.0 ) ).add( offset );

		// snap to screen pixels
/*
//		const snap = vec2( uniform( viewPort ) ).div( fpos.w );

		fpos.xy = trunc( fpos.xy.mul( snap ) ).add( float( 0.5 ) ).div( snap );

		this.outNode = fpos;
//		this.positionNode = vec4( positionGeometry, float( 1 ) );
//		this.positionNode = cameraProjectionMatrix.mul( modelViewMatrix ).mul( positionGeometry );
*/
		this.colorNode = texture( popupImage, varying( positionGeometry.xy ) );

		this.texture = popupImage;

	}

	constructPosition( /* builder */ ) {

		return this.outNode;

	}


}

export { PopupMaterial };