import { float, uniform, varying, vec2, texture, positionGeometry } from '../Nodes';
import { SubsurfaceMaterial } from './SubsufaceMaterial';

class HeightMaterial extends SubsurfaceMaterial {

	constructor ( options, ctx ) { // FIXME option handlin

		super( options, ctx );

		this.name ='CV:HightMaterial';

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