
import { Viewer } from '../viewer/Viewer';
import { Panel } from './Panel';


function EntrancePanel ( page ) {

	Panel.call( this, page );

	const self = this;

	this.add( page.addHeader( 'entrance.header' ) );

	page.addListener( Viewer, 'selectedEntrance', _onSelect );

	return this;

	function _onSelect ( event ) {

		self.onShow();
		if ( event.entrance === undefined ) return;

		self.deleteControls.push(
			self.add( page.addLine( event.entrance.station ) ),
			self.add( page.addLine( event.entrance.info.name ) )
		);

	}

}

EntrancePanel.prototype = Object.create( Panel.prototype );


export { EntrancePanel };


// EOF