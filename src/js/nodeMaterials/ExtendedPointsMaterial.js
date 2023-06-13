import { attribute, pointUV, texture, PointsNodeMaterial } from '../../../node_modules/three/examples/jsm/nodes/Nodes';

class ExtendedPointsMaterial extends PointsNodeMaterial {

	constructor ( ctx ) {

		super( {
			opacity: 1.0,
			alphaTest: 0.8,
			depthWrite: false,
			transparent: true,
			sizeAttenuation: false
		} );

		const pSize = attribute( 'pSize', 'float' );
		const color = attribute( 'color', 'vec3' );

		const textureCache = ctx.materials.textureCache;

		const pointTexture = texture( textureCache.getTexture( 'disc' ), pointUV );

		this.colorNode = pointTexture.mul( color );
		this.sizeNode = pSize;

	}

}

export { ExtendedPointsMaterial };