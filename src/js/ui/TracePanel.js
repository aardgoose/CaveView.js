
import { Viewer } from '../viewer/Viewer';
import { Panel } from './Panel';


function TracePanel ( page ) {

	Panel.call( this, page );

	const self = this;

	page.addListener( Viewer, 'selectedTrace', _onSelect );

	this.add( page.addHeader( 'trace.header' ) );

	var line1 = this.add( page.addLine( 'Start:' ) );
	var line2 = this.add( page.addLine( 'End:' ) );

	function _initPanel () {

		self.onShow();
		line1.textContent = 'Start:';
		line2.textContent = 'End:';

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

		line1.textContent = 'Start: ' + traceInfo.start;
		line2.textContent = 'End: ' + traceInfo.end;

		self.addDynamic( page.addButton( 'trace.delete', function() {
			event.delete();
			_initPanel();
		} ) );

	}

	function _showStations ( event ) {

		_initPanel();

		if ( event.start !== undefined ) line1.textContent = 'Start: ' + event.start;

		if ( event.end !== undefined ) {

			line2.textContent = 'End: ' + event.end;

			self.addDynamic( page.addButton( 'trace.add', function() {
				event.add();
				_initPanel();
			} ) );

		}

	}

}

TracePanel.prototype = Object.create( Panel.prototype );

export { TracePanel };

// EOF