import { Panel } from './Panel';

function EntrancePanel ( page, viewer ) {

	Panel.call( this, page );

	const self = this;

	this.add( page.addHeader( 'entrance.header' ) );

	page.addListener( viewer, 'selectedEntrance', _onSelect );

	return this;

	function _onSelect ( event ) {

		self.onShow();
		if ( event.entrance === undefined ) return;

		self.addDynamic( page.addLine( event.entrance.name ) );
		self.addDynamic( page.addLine( event.entrance.info.name ) );


	}

}

EntrancePanel.prototype = Object.create( Panel.prototype );


export { EntrancePanel };


// EOF