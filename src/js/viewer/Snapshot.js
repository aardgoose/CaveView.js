import { LinearFilter, NearestFilter, RGBAFormat, WebGLRenderTarget } from '../Three';

function Snapshot ( ctx, renderer, exportSize, lineScale ) {

	const container = ctx.container;
	const viewer = ctx.viewer;
	const newWidth = exportSize;
	const newHeight = Math.round( container.clientHeight * newWidth / container.clientWidth );

	console.log( 'vv', newHeight, newWidth );

	const renderTarget = new WebGLRenderTarget( newWidth, newHeight, { minFilter: LinearFilter, magFilter: NearestFilter, format: RGBAFormat, stencil: true } );

	renderTarget.texture.generateMipmaps = false;
	renderTarget.texture.name = 'CV.snapshot';

	renderer.setPixelRatio( 1 );
	renderer.setSize( newWidth, newHeight );
	renderer.setRenderTarget( renderTarget );
	renderer.setClearAlpha( 1.0 );

	// reset camera and materials using renderer size/resolution
	viewer.dispatchEvent( { type: 'resized', name: 'rts', width: newWidth, height: newHeight, lineScale: lineScale } );

	viewer.renderView();

	const result = ctx.renderUtils.renderTargetToCanvas( renderer, renderTarget ).then( ( canvas ) => {

//		renderTarget.dispose();

		// restore renderer to normal render size and target

		return canvas.toDataURL();

	} );

	viewer.resetRenderer();

	return result;

}

export { Snapshot };