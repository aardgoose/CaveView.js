import { PlaneBufferGeometry } from '../Three';
import { Scale } from './Scale';

class LinearScale extends Scale {

	constructor ( hudObject, container ) {

		const materials = hudObject.ctx.materials;
		const geometry = new PlaneBufferGeometry();

		super( hudObject, container, geometry, materials.getScaleMaterial() );

		this.name = 'CV.LinearScale';

		geometry.rotateZ( - Math.PI / 2 ); // rotate to use default UV values
		geometry.scale( this.barWidth, this.barHeight, 1 );

	}

}

export { LinearScale };