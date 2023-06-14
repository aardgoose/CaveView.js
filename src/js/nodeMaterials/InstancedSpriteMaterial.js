import NodeMaterial from '../../../node_modules/three/examples/jsm/nodes/materials/NodeMaterial.js';
import { MeshBasicMaterial } from 'three';
import { positionGeometry, attribute,  float, uniform, texture, varying, vec4, modelViewProjection } from 'three/examples/jsm/nodes/Nodes.js';

const defaultValues = new MeshBasicMaterial();

class InstancedSpriteMaterial extends NodeMaterial {

	constructor( textureSrc ) {

		super( {
			opacity: 1.0,
			alphaTest: 0.8,
			depthWrite: false,
			transparent: true,
			sizeAttenuation: false
		} );


		this.setDefaultValues( defaultValues );

		this.lights = false;
		this.normals = false;
		this.isTest = true;
		this.alphaTest = 0.8;

		const instancePosition = attribute( 'instancePosition' );
		const instanceColor = attribute( 'instanceColor' );
		const instanceSize = attribute( 'instanceSize' );

		const scale = uniform( 0.005, 'float' ).mul( instanceSize );

		// position of instance in screen space
		const offset = modelViewProjection( vec4( instancePosition, 1.0 ) );

		// scale instance geometry for screen
		const pos = positionGeometry.xy.mul( scale ).mul( offset.w );

		this.outputNode = vec4( pos, 0, 0 ).add( offset );
		this.colorNode = texture( textureSrc, varying( attribute( 'uv' ) ) ).mul( instanceColor );

		this.setValues( {} );

	}

	constructPosition( builder ) {

		return this.outputNode;

	}

	copy( source ) {

		this.colorNode = source.colorNode;
		this.opacityNode = source.opacityNode;

		this.alphaTestNode = source.alphaTestNode;

		this.lightNode = source.lightNode;

		this.positionNode = source.positionNode;

		return super.copy( source );

	}

}

export { InstancedSpriteMaterial };