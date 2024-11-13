import { MeshBasicMaterial, NodeMaterial, positionGeometry, attribute, texture, uv, varying, vec2, vec4, modelViewProjection, viewport } from '../Three.js'

const defaultValues = new MeshBasicMaterial();

class InstancedSpriteMaterial extends NodeMaterial {

	constructor( params = {}, ctx ) {

		super( {
			opacity: 0.0,
			alphaTest: 0.8,
			depthWrite: false,
			transparent: true,
			sizeAttenuation: false
		} );

		this.setDefaultValues( defaultValues );

		this.lights = false;
		this.alphaTest = 0.8;

		const instancePosition = attribute( 'instancePosition' );
		const instanceColor = attribute( 'instanceColor' );
		const instanceSize = attribute( 'instanceSize' );

		const scale = vec2( instanceSize, instanceSize ).div( viewport.zw );

		// position of instance in ndc
		const offset = modelViewProjection( vec4( instancePosition, 1.0 ) );

		// scale instance geometry for ndc
		const pos = positionGeometry.xy.sub( 0.5 ).mul( scale ).mul( offset.w );

		const spriteTexture = params.texture === undefined ? ctx.materials.textureCache.getTexture( 'disc' ) : params.texture;

		this.vertexNode = vec4( pos, 0, 0 ).add( offset );
		this.colorNode = texture( spriteTexture, varying( uv() ) ).mul( instanceColor ).rgb;

		this.setValues( {} );

	}

}

export { InstancedSpriteMaterial };