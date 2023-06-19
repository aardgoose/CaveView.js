import { IncrementStencilOp } from '../Three';
import { InstancedSpriteMaterial } from './InstancedSpriteMaterial';

class EntrancePointMaterial extends InstancedSpriteMaterial {

	constructor ( ctx ) {

		const dotSize = ctx.cfg.themeValue( 'entrance_dot_size' );

		super( ctx.materials.textureCache.getTexture( 'disc-outlined' ) );

		//		size: Math.max( dotSize, Math.floor( dotSize * ctx.container.clientWidth / 1000 ) ),

		this.stencilWrite = true;
		this.stencilZPass = IncrementStencilOp;

		ctx.viewer.addEventListener( 'resized', ( e ) => {

			this.size =  Math.max( dotSize, Math.floor( dotSize * e.width / 1000 ) );

		} );

		// FIXME transfer to InstancedSprite imp
	}

	customProgramCacheKey () {

		return 'CV:EntrancePointMaterial';

	}

}

export { EntrancePointMaterial };