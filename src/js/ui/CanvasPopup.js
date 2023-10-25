import { CanvasTexture } from '../Three';
import { Popup } from './Popup';
import { PopupMaterial } from '../materials/PopupMaterial';

class CanvasPopup extends Popup {

	constructor ( ctx ) {

		super( ctx );

		this.lines = [];
		this.type = 'CanvasPopup';

		return this;

	}

	i18n ( text ) {

		const tr = this.ctx.cfg.i18n( 'popup.' + text );

		return ( tr === undefined ) ? text : tr;

	}

	formatName ( name ) {

		let long = false;

		// reduce name length if too long

		while ( name.length > 20 ) {

			const tmp = name.split( '.' );
			tmp.shift();

			name = tmp.join( '.' );
			long = true;

		}

		if ( long ) name = '...' + name;

		return name;

	}

	addLine ( line ) {

		this.lines.push( line );

		return this;

	}

	addValue ( text, value ) {

		const n = isNaN( value ) ? value : `${Math.round(value)}\u202fm`;
		this.addLine( this.i18n( text ) + ': ' + n );

	}

	async finish ( position ) {

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
		ctx.font = fontSize + 'px normal helvetica,sans-serif';
		ctx.fillStyle = cfg.themeColorCSS( 'popup.color' );

		for ( let i = 0; i < lineCount; i++ ) {

			ctx.fillText( lines[ i ], 10, cellSize * ( i + 1 ) - 6 );

		}

		this.position.copy( position );

		const imageBitmap = await createImageBitmap( canvas, { imageOrientation: 'flipY' } );

		const texture = new CanvasTexture( imageBitmap );

		texture.onUpdate = function _dropCanvas ( texture ) { texture.image = null; };

		this.material = new PopupMaterial( container, texture, 0 );
		this.material.needsUpdate = true;


		return this;

	}

}

export { CanvasPopup };