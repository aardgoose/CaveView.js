import { Color, PointsMaterial } from '../Three';

class ExtendedPointsMaterial extends PointsMaterial {

	constructor ( ctx ) {

		super();

		const textureCache = ctx.materials.textureCache;

		this.map = textureCache.getTexture( 'disc' );
		this.color = new Color( 0xffffff );
		this.opacity = 1.0;
		this.alphaTest = 0.8;

		this.sizeAttenuation = false;
		this.transparent = true; // to ensure points rendered over lines.
		this.vertexColors = true;

		this.onBeforeCompile = function ( shader ) {

			const vertexShader = shader.vertexShader
				.replace( '#include <common>', '\nattribute float pSize;\n\n$&' )
				.replace( '\tgl_PointSize = size;', '\tgl_PointSize = pSize;' );

			shader.vertexShader = vertexShader;

		};

		return this;

	}

}

export { ExtendedPointsMaterial };