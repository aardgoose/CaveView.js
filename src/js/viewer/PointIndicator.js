import {
	PointsMaterial, TextureLoader
} from '../Three';

import { Cfg } from '../core/lib';
import { Point } from './Point';


function PointIndicator () {

	const pointerTexture = new TextureLoader().load( Cfg.value( 'home', '' ) + 'images/ic_location.png' );
	const material = new PointsMaterial( { size: 32, map: pointerTexture, transparent : true, sizeAttenuation: false, alphaTest: 0.8, color: 0xff0000 } );

	Point.call( this, material );

	this.type = 'Point';

	return this;

}

PointIndicator.prototype = Object.create( Point.prototype );

export { PointIndicator };
