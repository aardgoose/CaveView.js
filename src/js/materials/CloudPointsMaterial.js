import { Color } from '../Three';
import { PointsNodeMaterial } from '../Nodes';

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