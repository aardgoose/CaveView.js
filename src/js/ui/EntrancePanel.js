
import { Viewer } from '../viewer/Viewer';
import { Panel } from './Panel';


function EntrancePanel ( page ) {

	Panel.call( this, page );

	const self = this;

	var deleteControls = [];

	this.add( page.addHeader( 'entrance.header' ) );

	page.addListener( Viewer, 'selectedEntrance', _onSelect );

	this.onShow = function () {

		deleteControls.forEach ( function _deleteControls ( element ) {

			element.parentElement.removeChild( element );

		} );

		deleteControls = [];

	};

	return this;

	function _onSelect ( event ) {

		self.onShow();
		if ( event.entrance === undefined ) return;

		deleteControls.push(
			self.add( page.addLine( event.entrance ) )
		);

	}

}

EntrancePanel.prototype = Object.create( Panel.prototype );


export { EntrancePanel };


// EOF