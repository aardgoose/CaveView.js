import { PopupMaterial } from '../materials/PopupMaterial';
import { Popup } from './Popup';
import { CanvasTexture } from '../Three';

class CanvasPopup extends Popup {

	constructor ( ctx ) {

		super( ctx );

		this.lines = [];
		this.type = 'CanvasPopup';

		return this;

	}

	addLine ( line ) {

		this.lines.push( line );

		return this;

	}

	finish () {

		const cfg = this.ctx.cfg;
		const container = this.ctx.container;
		const cellSize = 32;
		const fontSize = 20;

		const lines = this.lines;
		const lineCount = lines.length;

		const popupWidth = 256;
		const popupHeight = cellSize * lineCount;

		const canvas = document.createElement( 'canvas' );

		if ( ! canvas ) console.error( 'creating canvas for CanvasPopup failed' );

		canvas.width  = popupWidth;
		canvas.height = popupHeight;

		const ctx = canvas.getContext( '2d' );

		if ( ! ctx ) console.error( 'cannot obtain 2D canvas' );

		// set background

		ctx.fillStyle = cfg.themeColorCSS( 'popup.background' );
		ctx.fillRect( 0, 0, popupWidth, popupHeight );

		ctx.strokeStyle = cfg.themeColorCSS( 'popup.border' );
		ctx.lineWidth = 2.0;
		ctx.strokeRect( 0, 0, popupWidth, popupHeight );

		// write text contents

		ctx.textAlign = 'left';
		ctx.font = fontSize + 'px ' + 'normal helvetica,sans-serif';
		ctx.fillStyle = cfg.themeColorCSS( 'popup.text' );

		for ( let i = 0; i < lineCount; i++ ) {

			ctx.fillText( lines[ i ], 10, cellSize * ( i + 1 ) - 6 );

		}

		const texture = new CanvasTexture( canvas );

		texture.onUpdate = function _dropCanvas ( texture ) { texture.image = null; };

		this.material = new PopupMaterial( container, texture, 0 );
		this.material.needsUpdate = true;

		return this;

	}

}

export { CanvasPopup };