import { PlaneGeometry } from '../Three';
import { Scale } from './Scale';
import { MeshBasicNodeMaterial } from '../Nodes.js';

class LinearScale extends Scale {

	constructor ( hudObject, container ) {

		const materials = hudObject.ctx.materials;
		const textureCache = materials.textureCache;
		const geometry = new PlaneGeometry();

		const cfg = hudObject.ctx.cfg;
		const gradientType = cfg.value( 'saturatedGradient', false ) || cfg.themeValue( 'saturatedGradient' );
		const gradient = gradientType ? 'gradientHi' : 'gradientLow';

		super( hudObject, container, geometry, materials.getMaterial( MeshBasicNodeMaterial, { color: 0xffffff, map: textureCache.getTexture( gradient ) } ) );

		this.name = 'CV.LinearScale';
		this.visible = false;

		geometry.rotateZ( - Math.PI / 2 ); // rotate to use default UV values
		geometry.scale( this.barWidth, this.barHeight, 1 );

	}

}

export { LinearScale };