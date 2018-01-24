
import { LEG_CAVE } from '../core/constants';
import { Cfg } from '../core/lib';
import { PopupMaterial } from '../materials/PopupMaterial';

import {
	CanvasTexture,
	BufferGeometry,
	Float32BufferAttribute,
	Uint16BufferAttribute,
	Mesh
} from '../../../../three.js/src/Three';


function PopupGeometry () {

	BufferGeometry.call( this );

	this.type = 'PopupGeometry';

	const indexAttribute = new Uint16BufferAttribute( [ 0, 2, 1, 0, 3, 2 ], 1 );

	// unit square
	const positions = [
		0, 0, 0,
		0, 1, 0,
		1, 1, 0,
		1, 0, 0
	];

	const positionAttribute = new Float32BufferAttribute( positions, 3 );

	this.setIndex( indexAttribute );
	this.addAttribute( 'position', positionAttribute );

}

PopupGeometry.prototype = Object.create( BufferGeometry.prototype );

function Popup() {

	Mesh.call( this, new PopupGeometry() );

	this.lines = [];
	this.layers.set( LEG_CAVE );
	this.type = 'Popup';

	return this;

}

Popup.prototype = Object.create( Mesh.prototype );

Popup.prototype.constructor = Popup;

Popup.prototype.addLine = function ( line ) {

	this.lines.push( line );

	return this;

};

Popup.prototype.finish = function () {

	const cellSize = 32;
	const fontSize = 20;

	const lines = this.lines;
	const lineCount = lines.length;

	const popupWidth = 256;
	const popupHeight = cellSize * lineCount;

	const canvas = document.createElement( 'canvas' );

	if ( ! canvas ) console.error( 'creating canvas for Popup failed' );

	canvas.width  = popupWidth;
	canvas.height = popupHeight;

	const ctx = canvas.getContext( '2d' );

	if ( ! ctx ) console.error( 'cannot obtain 2D canvas' );

	// set background

	ctx.fillStyle = Cfg.themeColorCSS( 'popupBackground' );
	ctx.fillRect( 0, 0, popupWidth, popupHeight );

	ctx.strokeStyle = Cfg.themeColorCSS( 'popupBorder' );
	ctx.lineWidth = 2.0;
	ctx.strokeRect( 0, 0, popupWidth, popupHeight );

	// write text contents

	ctx.textAlign = 'left';
	ctx.font = fontSize + 'px ' + 'normal helvetica,sans-serif';
	ctx.fillStyle = Cfg.themeColorCSS( 'popupText' );

	var i;

	for ( i = 0; i < lineCount; i++ ) {

		ctx.fillText( lines[ i ], 10 , cellSize * ( i + 1 ) - 6 );

	}

	const material = new PopupMaterial( this.container, new CanvasTexture( canvas ), 0 );

	this.material = material;
	this.material.needsUpdate = true;

	return this;

};

Popup.prototype.close = function () {

	this.parent.remove( this );

	this.material.dispose();
	this.geometry.dispose();

};

export { Popup };
