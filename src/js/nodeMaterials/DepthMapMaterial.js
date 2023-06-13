import { ShaderMaterial } from '../Three';
import { fract, varying, vec3, vec4, positionGeometry } from '../../../node_modules/three/examples/jsm/nodes/Nodes';

class DepthMapMaterial extends ShaderMaterial {

	constructor ( terrain ) {

		const boundingBox = terrain.boundingBox;

		const minHeight = boundingBox.min.z;
		const maxHeight = boundingBox.max.z;


		const minZ = uniform( minHeight, 'float' );
		const scaleZ = uniform( 1 / ( maxHeight - minHeight ) );

		const PackUpscale = float( 256. / 255. ); // fraction -> 0..1 (including 1)
		const PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
		const ShiftRight8 = float( 1 / 256 );

		function packFloatToRGBA( v ) {
			const r = vec4( fract( v.mul( PackFactors ), v ) );
			r.yzw = r.yzw.sub( r.xyz.mul( ShiftRight8 ) ); // tidy overflow
			return r.mul( PackUpscale );
		}

		const vHeight = varying( positionGeometry.z.sub( minZ ).mul( scaleZ ) );

		this.colorNode = packFloatToRGBA( vHeight );

	}

}

export { DepthMapMaterial };