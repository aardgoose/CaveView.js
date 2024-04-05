import { NoBlending } from '../Three';
import { NodeMaterial, saturate, uniform, varying, tslFn, vec3, vec4, temp, positionGeometry } from '../Nodes';

class DepthMapMaterial extends NodeMaterial {

	constructor ( terrain ) {

		super();

		const boundingBox = terrain.boundingBox;

		const minHeight = boundingBox.min.z;
		const maxHeight = boundingBox.max.z;


		const PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)
		const PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
		const ShiftRight8 = 1. / 256.;

		this.fragmentNode = tslFn( () => {

			const minZ = uniform( minHeight );
			const scaleZ = uniform( 1 / ( maxHeight - minHeight ) );
			const vHeight = varying( saturate( positionGeometry.z.sub( minZ ).mul( scaleZ ) ) );

			const r = temp( vec4() ).assign( vHeight.mul( PackFactors ).fract(), vHeight );

			r.subAssign( vec4( 0, r.xyz.mul( ShiftRight8 ) ) ); // tidy overflow
			r.mulAssign( PackUpscale );

			return r;

		} )();

		this.blending = NoBlending;
		this.normals = false;
		this.depthTest = false;
		this.colorSpaced = false;
		this.fog = false;
		this.toneMapped = false;

	}

}

export { DepthMapMaterial };