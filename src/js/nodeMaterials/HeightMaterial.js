import { MeshPhongNodeMaterial, float, uniform, varying, vec2, texture, positionGeometry } from '../../../node_modules/three/examples/jsm/nodes/Nodes';

class HeightMaterial extends MeshPhongNodeMaterial {

	constructor ( ctx, options ) { // FIXME option handling

		super();

		const survey = ctx.survey;
		const limits = survey.modelLimits;

		const zMin = limits.min.z;
		const zMax = limits.max.z;
		const gradient = ctx.cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';
		const textureCache = ctx.materials.textureCache;

		const minZ = uniform( zMin );
		const scaleZ = uniform( 1 / ( zMax - zMin ) );

		const zMap = varying( positionGeometry.z.sub( minZ ).mul( scaleZ ) );

		this.colorNode = texture( textureCache.getTexture( gradient ), vec2( float( 1.0 ).sub( zMap ), 1.0 ) );

	}

}

export { HeightMaterial };