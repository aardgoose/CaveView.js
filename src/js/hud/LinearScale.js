
import { Scale } from './Scale';
import { Materials } from '../materials/Materials';

import { PlaneBufferGeometry } from '../Three';

function LinearScale ( hudObject, container ) {

	const geometry = new PlaneBufferGeometry();
	const material = Materials.getScaleMaterial();

	Scale.call( this, hudObject, container, geometry, material );

	this.name = 'CV.LinearScale';

	geometry.rotateZ( - Math.PI / 2 ); // rotate to use default UV values
	geometry.scale( this.barWidth, this.barHeight, 1 );

	return this;

}

LinearScale.prototype = Object.create( Scale.prototype );

export { LinearScale };

// EOF