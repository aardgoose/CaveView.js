
import { Scale } from './Scale';
import { Materials } from '../materials/Materials';
import { MATERIAL_LINE } from '../core/constants';

import {
	Vector3, Matrix4,
	PlaneBufferGeometry
} from '../Three';

function LinearScale ( container, Viewer ) {

	const range = Viewer.maxHeight - Viewer.minHeight;
	const geometry = new PlaneBufferGeometry( 1, range );

	// rotate the model to put the plane in the xz plane, covering the range of view height values - the gradient shader works on z values.

	geometry.rotateX( Math.PI / 2 );

	Scale.call( this, container, geometry, Materials.getHeightMaterial( MATERIAL_LINE ) );

	this.name = 'CV.LinearScale';

	this.scaleBar.applyMatrix( new Matrix4().makeScale( this.barWidth, 1, this.barHeight / range ) );

	// rotate the model in the world view.
	this.scaleBar.rotateOnAxis( new Vector3( 1, 0, 0 ), -Math.PI / 2 );

	return this;

}

LinearScale.prototype = Object.create( Scale.prototype );

LinearScale.prototype.setMaterial = function ( material ) {

	this.scaleBar.material = material;

	return this;

};

export { LinearScale };

// EOF