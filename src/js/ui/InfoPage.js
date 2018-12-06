import { VERSION, LEG_CAVE } from '../core/constants';

import { Page } from './Page';
import { Viewer } from '../viewer/Viewer';

function InfoPage ( fileSelector ) {

	Page.call( this, 'icon_info', 'info' );

	this.addHeader( 'header' );

	this.addHeader( 'stats.header' );

	this.addText( 'file: ' + fileSelector.file );

	const stats = Viewer.getLegStats ( LEG_CAVE );

	this.addLine( this.i18n( 'stats.legs' ) + ': ' + stats.legCount );
	this.addLine( this.i18n( 'stats.totalLength' ) + ': ' + stats.legLength.toFixed( 2 ) + '\u202fm' );
	this.addLine( this.i18n( 'stats.minLength' ) + ': ' + stats.minLegLength.toFixed( 2 ) + '\u202fm' );
	this.addLine( this.i18n( 'stats.maxLength' ) + ': ' + stats.maxLegLength.toFixed( 2 ) + '\u202fm' );

	this.addHeader( 'CaveView v' + VERSION + '.' );
	this.addText( 'A WebGL 3d cave viewer for Survex (.3d) and Therion (.lox) models.' );

	this.addText( 'For more information see: ' );
	this.addLink( 'https://aardgoose.github.io/CaveView.js/', 'CaveView on GitHub' );
	this.addText( '© Angus Sawyer, 2018' );

}

InfoPage.prototype = Object.create( Page.prototype );

export { InfoPage };


// EOF