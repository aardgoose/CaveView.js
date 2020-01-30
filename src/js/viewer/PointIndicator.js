import { PointsMaterial, TextureLoader } from '../Three';

import { Point } from './Point';

var pointerTexture = null;

function PointIndicator ( ctx, color ) {

	if ( pointerTexture === null ) pointerTexture = new TextureLoader().load( ctx.cfg.value( 'home', '' ) + 'images/ic_location.png' );

	const material = new PointsMaterial( { size: 32, map: pointerTexture, transparent : true, sizeAttenuation: false, alphaTest: 0.8, color: color } );

	Point.call( this, material );

	return this;

}

PointIndicator.prototype = Object.create( Point.prototype );

export { PointIndicator };
