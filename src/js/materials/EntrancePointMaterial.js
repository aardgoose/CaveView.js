import { IncrementStencilOp, PointsMaterial } from '../Three';

class EntrancePointMaterial extends PointsMaterial {

	constructor ( ctx ) {

		const dotSize = ctx.cfg.themeValue( 'entrance_dot_size' );

		super( {
			map: ctx.materials.textureCache.getTexture( 'disc-outlined' ),
			opacity: 1.0,
			alphaTest: 0.8,
			sizeAttenuation: false,
			transparent: true,
			size: Math.max( dotSize, Math.floor( dotSize * ctx.container.clientWidth / 1000 ) ),
			vertexColors: true
		} );

		this.stencilWrite = true;
		this.stencilZPass = IncrementStencilOp;

		ctx.viewer.addEventListener( 'resized', ( e ) => {

			this.size =  Math.max( dotSize, Math.floor( dotSize * e.width / 1000 ) );

		} );

	}

}

export { EntrancePointMaterial };