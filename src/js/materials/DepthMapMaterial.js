import { NoBlending } from '../Three';
import { NodeMaterial, saturate, uniform, varying, vec4, positionGeometry } from '../Nodes';

class DepthMapMaterial extends NodeMaterial {

	constructor ( terrain ) {

		super();

//		this.isTest = true;

		const boundingBox = terrain.boundingBox;

		const minHeight = boundingBox.min.z;
		const maxHeight = boundingBox.max.z;
		console.log( minHeight, maxHeight );
		const minZ = uniform( minHeight, 'float' );
		const scaleZ = uniform( 1 / ( maxHeight - minHeight ), 'float' );
		const vHeight = varying( saturate( positionGeometry.z.sub( minZ ).mul( scaleZ ) ) );

		this.colorNode = vec4( vHeight, 0, 1.0, 1 );
//		this.colorNode = vec4( 0.5, 0, 1.0, 1 );
		this.blending = NoBlending;
		this.normals = false;

	}

	constructOutput( /* builder, outgoingLight, opacity  */) {

		return this.colorNode;

	}

}

export { DepthMapMaterial };