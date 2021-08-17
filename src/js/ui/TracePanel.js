import { Panel } from './Panel';

class TracePanel extends Panel {

	constructor ( page, viewer ) {

		super( page );

		const self = this;

		const start = page.i18n( 'trace.start' ) + ':';
		const end = page.i18n( 'trace.end' ) + ':';

		page.addListener( viewer, 'selectedTrace', _onSelect );

		this.add( page.addHeader( 'trace.header' ) );

		const line1 = this.add( page.addLine( start ) );
		const line2 = this.add( page.addLine( end ) );

		function _initPanel () {

			self.onShow();
			line1.textContent = start;
			line2.textContent = end;

		}

		function _onSelect ( event ) {

			if ( event.add !== undefined ) {

				_showStations( event );

			} else if ( event.delete !== undefined ) {

				_showTrace ( event );

			}

		}

		function _showTrace ( event ) {

			const traceInfo = event.trace;

			_initPanel();

			line1.textContent = start + ' ' + traceInfo.start;
			line2.textContent = end + ' ' + traceInfo.end;

			self.addDynamic( page.addButton( 'trace.delete', function() {
				event.delete();
				_initPanel();
			} ) );

		}

		function _showStations ( event ) {

			_initPanel();

			if ( event.start !== undefined ) line1.textContent = start + ' ' + event.start;

			if ( event.end !== undefined ) {

				line2.textContent = end + ' ' + event.end;

				self.addDynamic( page.addButton( 'trace.add', function() {
					event.add();
					_initPanel();
				} ) );

			}

		}

	}

}

export { TracePanel };