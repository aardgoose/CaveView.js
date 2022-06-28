import { WebGLRenderTarget, LinearFilter, NearestFilter, RGBAFormat } from '../Three';
import { RenderUtils } from '../core/RenderUtils';

class Snapshot {

	constructor ( ctx, renderer ) {

		this.getSnapshot = function ( exportSize, lineScale ) {

			const container = ctx.container;
			const viewer = ctx.viewer;

			const newWidth = exportSize;
			const newHeight = Math.round( container.clientHeight * newWidth / container.clientWidth );

			const renderTarget = new WebGLRenderTarget( newWidth, newHeight, { minFilter: LinearFilter, magFilter: NearestFilter, format: RGBAFormat, stencilBuffer: true } );

			renderTarget.texture.generateMipmaps = false;
			renderTarget.texture.name = 'CV.snapshot';

			renderer.setSize( newWidth, newHeight );
			renderer.setPixelRatio( 1 );
			renderer.setRenderTarget( renderTarget );
			renderer.setClearAlpha( 1.0 );

			// reset camera and materials using renderer size/resolution
			viewer.dispatchEvent( { type: 'resized', name: 'rts', 'width': newWidth, 'height': newHeight, lineScale: lineScale } );

			viewer.renderView();

			const canvas = RenderUtils.renderTargetToCanvas( renderer, renderTarget );

			renderTarget.dispose();

			// restore renderer to normal render size and target
			viewer.resetRenderer();

			return canvas.toDataURL();

		};

	}

}

export { Snapshot };