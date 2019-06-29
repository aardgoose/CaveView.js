
import { Cfg } from '../core/lib';

import {
	BufferGeometry,
	LineBasicMaterial,
	LineLoop,
	Float32BufferAttribute
} from '../Three';


function PositionRing () {

	const material = new LineBasicMaterial( { color: Cfg.themeValue( 'hud.compass.top1' ) } );
	const geometry = new BufferGeometry();

	LineLoop.call( this, geometry, material );

	this.name = 'CV.PositionRing';

	/*
	const material = Materials.getGlyphMaterial( HudObject.atlasSpec, 0 );
	const label = new MutableGlyphString( '000\u00B0', material );

	label.translateX( - label.getWidth() / 2 );
	label.translateY( stdWidth + 5 );

	this.addStatic( label );

	this.label = label;
	*/

	const vertices = [];
	var i;

	for ( i = 0; i < 64; i++ ) {

		let segment = i / 64 * Math.PI * 2;

		vertices.push(
			Math.cos( segment ),
			Math.sin( segment ),
			0
		);

	}

	geometry.addAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );

	return this;

}

PositionRing.prototype = Object.create( LineLoop.prototype );

PositionRing.prototype.update = function ( hScale, zoom, diameter ) {

	this.visible = true;

	console.log( 'pr', hScale, zoom, diameter );
	const scale = zoom * diameter * hScale;

	this.scale.set( scale, scale, scale );
	/*
	this.label.replaceString( res );
	*/

};

export { PositionRing };

// EOF