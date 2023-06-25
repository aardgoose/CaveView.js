import { NoBlending } from '../Three';
import { NodeMaterial, saturate, uniform, varying, vec4, positionGeometry } from '../Nodes';

class DepthMapMaterial extends NodeMaterial {

	name = 'DepthMapMaterial';

	constructor ( terrain ) {

		super();

		const boundingBox = terrain.boundingBox;

		const minHeight = boundingBox.min.z;
		const maxHeight = boundingBox.max.z;

		const minZ = uniform( minHeight );
		const scaleZ = uniform( 1 / ( maxHeight - minHeight ) );
		const vHeight = varying( saturate( positionGeometry.z.sub( minZ ).mul( scaleZ ) ) );

		this.colorNode = vec4( vHeight, 0, 0, 1 );

		this.blending = NoBlending;
		this.normals = false;
		this.depthTest = false;

	}

	constructOutput( /* builder, outgoingLight, opacity  */) {

		return this.colorNode;

	}

	constructDiffuseColor( /* builder */  ) {}

	customProgramCacheKey () {

		'CV:DepthMapMaterial';

	}

}

export { DepthMapMaterial };