import { MeshBasicMaterial } from 'three';
import { NodeMaterial, positionGeometry, attribute, uniform, texture, varying, vec4, modelViewProjection } from '../Nodes.js';

const defaultValues = new MeshBasicMaterial();

class InstancedSpriteMaterial extends NodeMaterial {

	constructor( params = {}, ctx ) {

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
		this.alphaTest = 0.8;

		const instancePosition = attribute( 'instancePosition' );
		const instanceColor = attribute( 'instanceColor' );
		const instanceSize = attribute( 'instanceSize' );

		const scale = uniform( 0.005, 'float' ).mul( instanceSize );

		// position of instance in screen space
		const offset = modelViewProjection( vec4( instancePosition, 1.0 ) );

		// scale instance geometry for screen
		const pos = positionGeometry.xy.mul( scale ).mul( offset.w );

		let spriteTexture;

		if ( params.texture === undefined ) {

			const textureCache = ctx.materials.textureCache;
			spriteTexture = textureCache.getTexture( 'disc' );

		}

		this.outputNode = vec4( pos, 0, 0 ).add( offset );
		this.colorNode = texture( spriteTexture, varying( attribute( 'uv' ) ) ).mul( instanceColor );

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