
import { LEG_CAVE } from '../core/constants';
import { Cfg } from '../core/lib';
import { PopupMaterial } from '../materials/PopupMaterial';
import { CommonAttributes } from '../core/CommonAttributes';

import {
	CanvasTexture,
	BufferGeometry,
	Mesh
} from '../Three';

function PopupGeometry () {

	BufferGeometry.call( this );

	this.type = 'PopupGeometry';

	this.setIndex( CommonAttributes.index );
	this.addAttribute( 'position', CommonAttributes.position );

}

PopupGeometry.prototype = Object.create( BufferGeometry.prototype );

var commonGeometry = null;

function Popup( container ) {

	if ( commonGeometry === null ) commonGeometry = new PopupGeometry();

	Mesh.call( this, commonGeometry );

	this.lines = [];
	this.layers.set( LEG_CAVE );
	this.type = 'Popup';
	this.renderOrder = Infinity;
	this.container = container;

	return this;

}

Popup.prototype = Object.create( Mesh.prototype );

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

	ctx.fillStyle = Cfg.themeColorCSS( 'popup.background' );
	ctx.fillRect( 0, 0, popupWidth, popupHeight );

	ctx.strokeStyle = Cfg.themeColorCSS( 'popup.border' );
	ctx.lineWidth = 2.0;
	ctx.strokeRect( 0, 0, popupWidth, popupHeight );

	// write text contents

	ctx.textAlign = 'left';
	ctx.font = fontSize + 'px ' + 'normal helvetica,sans-serif';
	ctx.fillStyle = Cfg.themeColorCSS( 'popup.text' );

	var i;

	for ( i = 0; i < lineCount; i++ ) {

		ctx.fillText( lines[ i ], 10 , cellSize * ( i + 1 ) - 6 );

	}

	const texture = new CanvasTexture( canvas );

	texture.onUpdate = function _dropCanvas ( texture ) { texture.image = null; };

	const material = new PopupMaterial( this.container, texture, 0 );

	this.material = material;
	this.material.needsUpdate = true;

	return this;

};

Popup.prototype.close = function () {

	this.parent.remove( this );

	this.material.dispose();
	this.material.texture.dispose();

};

export { Popup };
