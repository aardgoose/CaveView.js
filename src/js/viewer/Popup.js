
import { LEG_CAVE } from '../core/constants';
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

	var indexAttribute = new Uint16BufferAttribute( [ 0, 2, 1, 0, 3, 2 ], 1 );

	// unit square
	var positions = [
		0, 0, 0,
		0, 1, 0,
		1, 1, 0,
		1, 0, 0
	];

	var positionAttribute = new Float32BufferAttribute( positions, 3 );

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

	var cellSize = 32;
	var lines = this.lines;
	var lineCount = lines.length;

	var popupWidth = 300;
	var popupHeight = cellSize * lineCount;

	var canvas = document.createElement( 'canvas' );

	if ( ! canvas ) console.error( 'creating canvas for Popup failed' );

	canvas.width  = popupWidth;
	canvas.height = popupHeight;

	var ctx = canvas.getContext( '2d' );

	if ( ! ctx ) console.error( 'cannot obtain 2D canvas' );

	// set background

	ctx.fillStyle = 'rgba( 0, 1, 0, 1 )';
	ctx.fillRect( 0, 0, popupWidth, popupHeight );

	// write text contents

	var fontSize = 20;

	ctx.textAlign = 'left';
	ctx.font = fontSize + 'px ' + 'normal helvetica,sans-serif';
	ctx.fillStyle = '#ffffff';

	var line;

	for ( var i = 0; i < lineCount; i++ ) {

		line = lines[ i ];
		ctx.fillText( line, 0 , cellSize * i - 6 );

	}

	var material = new PopupMaterial( this.container, new CanvasTexture( canvas ), 0 );

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
