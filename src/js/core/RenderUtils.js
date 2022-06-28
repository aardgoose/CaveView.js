
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

	}

};

export { RenderUtils };