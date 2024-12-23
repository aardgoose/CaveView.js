import { Page } from './Page';

class CreditPage extends Page {

	constructor ( frame, viewer, fileSelector ) {

		super( 'icon_copyright', 'info' );

		frame.addPage( this );

		this.addHeader( 'header' );

		this.addHeader( 'stats.header' );

		this.addText( this.i18n( 'more' ) + ': ' );
		this.addLink( 'https://aardgoose.github.io/CaveView.js/', this.i18n( 'github' ) );

	}

}

export { CreditPage };