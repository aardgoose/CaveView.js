import { InstancedSpriteMaterial } from './InstancedSpriteMaterial';

class ExtendedPointsMaterial extends InstancedSpriteMaterial {


	constructor ( ctx ) {

		const textureCache = ctx.materials.textureCache;

		super( textureCache.getTexture( 'disc' ) );

	}

}

export { ExtendedPointsMaterial };