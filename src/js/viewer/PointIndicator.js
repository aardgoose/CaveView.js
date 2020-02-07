import { PointsMaterial, TextureLoader } from '../Three';

import { Point } from './Point';

function PointIndicator ( ctx, color ) {

	const materials = ctx.materials;

	if ( materials.pointerTexture === undefined ) {

		materials.pointerTexture = new TextureLoader().load( ctx.cfg.value( 'home', '' ) + 'images/ic_location.png' );

	}

	const material = new PointsMaterial( { size: 32, map: materials.pointerTexture, transparent : true, sizeAttenuation: false, alphaTest: 0.8, color: color } );

	Point.call( this, material, ctx );

	return this;

}

PointIndicator.prototype = Object.create( Point.prototype );

export { PointIndicator };
