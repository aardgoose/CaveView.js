import { Panel } from './Panel';

class EntrancePanel extends Panel  {

	constructor ( page, viewer ) {

		super( page );

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

}

export { EntrancePanel };