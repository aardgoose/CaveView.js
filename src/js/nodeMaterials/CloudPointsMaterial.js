import { Color, Vector3 } from '../Three';
import { PointsNodeMaterial, texture, vec2, positionLocal } from '../../../node_modules/three/examples/jsm/nodes/Nodes';

class CloudPointsMaterial extends PointsNodeMaterial {

	constructor ( ctx ) {

		super();

//		this.map = textureCache.getTexture( 'disc' );
		this.color = new Color( 0xffffff );
		this.opacity = 1.0;
		this.alphaTest = 0.8;
		this.size = 0.1;
//		this.sizeAttenuation = false;
//		this.transparent = true; // to ensure points rendered over lines.
		this.vertexColors = true;

		this.onBeforeCompile = function ( shader ) {
			console.log ( shader);

			Object.assign( shader.uniforms, { uLight: { value: new Vector3( -1, -1, 2 ).normalize() } } );

			const vertexShader = shader.vertexShader
				.replace( '#include <common>', '\nuniform vec3 uLight;\nvarying float pLight;\n\n\n$&' )
				.replace( '\tgl_PointSize = size;', 'pLight = saturate( 0.3 + abs( dot( uLight, normalize( normalMatrix * normal ) ) ) );\n\t$&' );

			const fragmentShader = shader.fragmentShader
				.replace( '#include <common>', '\nvarying float pLight;\n\n\n$&' )
				.replace( 'outgoingLight = diffuseColor.rgb;', 'diffuseColor.rgb *= pLight;\n$&' );

			shader.vertexShader = vertexShader;
			shader.fragmentShader = fragmentShader;

		};

		return this;

	}

}

export { CloudPointsMaterial };