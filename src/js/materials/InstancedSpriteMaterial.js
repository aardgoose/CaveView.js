import { MeshBasicMaterial } from 'three';
import { NodeMaterial, positionGeometry, attribute, uniform, texture, uv, varying, vec4, modelViewProjection } from '../Nodes.js';

const defaultValues = new MeshBasicMaterial();

class InstancedSpriteMaterial extends NodeMaterial {

	name = 'CV:InstancedSpriteMaterial';

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
		const pos = positionGeometry.xy.sub( 0.5 ).mul( scale ).mul( offset.w );

		const spriteTexture = params.texture === undefined ? ctx.materials.textureCache.getTexture( 'disc' ) : params.texture;

		this.outputNode = vec4( pos, 0, 0 ).add( offset );
		this.colorNode = texture( spriteTexture, varying( uv() ) ).mul( instanceColor );

		this.setValues( {} );

	}

	constructPosition( /* builder */ ) {

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

	customProgramCacheKey () {

		return this.name;

	}

}

export { InstancedSpriteMaterial };