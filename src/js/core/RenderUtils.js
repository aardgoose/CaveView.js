import { OrthographicCamera, Vector3 } from '../Three';

const RenderUtils = {

	renderTargetToCanvas: function ( renderer, renderTarget ) {

		const width = Math.floor( renderTarget.width );
		const height = Math.floor( renderTarget.height );

		const bSize = width * height * 4;
		const buffer = new Uint8ClampedArray( bSize );

		renderer.readRenderTargetPixels( renderTarget, 0, 0, width, height, buffer );

		// invert image
		const line = width * 4;
		const invertedBuffer = new Uint8ClampedArray( bSize );

		let dst = bSize;
		let end = 0;

		for ( let i = 0; i < bSize; i += line ) {

			dst -= line;
			end += line;

			invertedBuffer.set( buffer.subarray( i, end ), dst );

		}

		const id = new ImageData( invertedBuffer, width, height );

		const canvas = document.createElement( 'canvas' );
		const canvasCtx = canvas.getContext( '2d' );

		canvas.width = width;
		canvas.height = height;

		canvasCtx.putImageData( id, 0, 0 );

		return canvas;

	},

	makePlanCamera: function ( container, survey ) {

		let width  = container.clientWidth;
		let height = container.clientHeight;

		const range = survey.combinedLimits.getSize( new Vector3() );

		const scaleX = width / range.x;
		const scaleY = height / range.y;

		if ( scaleX < scaleY ) {

			height = height * scaleX / scaleY;

		} else {

			width = width * scaleY / scaleX;

		}

		return new OrthographicCamera( -width / 2, width / 2, height / 2, -height / 2, -10000, 10000 );

	}


};

export { RenderUtils };