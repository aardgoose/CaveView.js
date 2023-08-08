import { MeshBasicMaterial } from 'three';
import { NodeMaterial, positionGeometry, attribute, uniform, texture, uv, varying, vec4, modelViewProjection } from '../Nodes.js';

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
		const pos = positionGeometry.xy.sub( 0.5 ).mul( scale ).mul( offset.w );

		const spriteTexture = params.texture === undefined ? ctx.materials.textureCache.getTexture( 'disc' ) : params.texture;

		this.vertexNode = vec4( pos, 0, 0 ).add( offset );
		this.colorNode = texture( spriteTexture, varying( uv() ) ).mul( instanceColor );

		this.setValues( {} );

	}

}

export { InstancedSpriteMaterial };