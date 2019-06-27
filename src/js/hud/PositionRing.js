
import { Cfg } from '../core/lib';

import {
	RingBufferGeometry,
	MeshBasicMaterial,
	Mesh,
} from '../Three';


function PositionRing () {

	const material = new MeshBasicMaterial( { color: Cfg.themeValue( 'hud.compass.top1' ) } );
	const geometry = new RingBufferGeometry( 97, 100, 64 );

	Mesh.call( this, geometry, material );

	this.name = 'CV.PositionRing';

	/*
	const material = Materials.getGlyphMaterial( HudObject.atlasSpec, 0 );
	const label = new MutableGlyphString( '000\u00B0', material );

	label.translateX( - label.getWidth() / 2 );
	label.translateY( stdWidth + 5 );

	this.addStatic( label );

	this.label = label;
	*/

	return this;

}

PositionRing.prototype = Object.create( Mesh.prototype );

PositionRing.prototype.set = function ( diameter ) {

	console.log( 'pr', diameter );
	/*
	this.label.replaceString( res );
	*/

};

export { PositionRing };

// EOF