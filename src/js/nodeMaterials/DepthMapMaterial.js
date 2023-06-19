import { MeshBasicNodeMaterial, shader, float, fract, temp, uniform, varying, vec3, vec4, positionGeometry } from '../../../node_modules/three/examples/jsm/nodes/Nodes';

class DepthMapMaterial extends MeshBasicNodeMaterial {

	constructor ( terrain ) {

		super();

		this.isTest = true;

		const boundingBox = terrain.boundingBox;

		const minHeight = boundingBox.min.z;
		const maxHeight = boundingBox.max.z;


		const minZ = uniform( minHeight, 'float' );
		const scaleZ = uniform( 1 / ( maxHeight - minHeight ), 'float' );

		const PackUpscale = float( 256. / 255. ); // fraction -> 0..1 (including 1)
		const PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
		const ShiftRight8 = float( 1 / 256 );

		const packFloatToRGBA = shader( ( v, stack ) => {

			const r = vec4( fract( v.mul( PackFactors ) ), v );
			const t = r.xyz.mul( ShiftRight8 );
			stack.assign( r.yzw, r.yzw.sub( t ) ); // tidy overflow

			return r.mul( PackUpscale );

		} );

		const vHeight = varying( positionGeometry.z.sub( minZ ).mul( scaleZ ) );

		const fragmentShaderNode = shader( ( stack ) => {

			return packFloatToRGBA.call( vHeight, stack );

		} );

		this.colorNode = fragmentShaderNode;

	}

}

export { DepthMapMaterial };