import { SpriteNodeMaterial, Sprite } from '../Three';

class PointIndicator extends Sprite {

	constructor ( ctx, color ) {

		super( new SpriteNodeMaterial( {
			map: ctx.materials.textureCache.getTexture( 'pointer' ),
				transparent : true,
			sizeAttenuation: false,
			alphaTest: 0.8,
			color: color
		} ) );

		this.scale.set( 10, 10 );

	}

}

export { PointIndicator };