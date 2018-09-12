
import { Viewer } from '../viewer/Viewer';
import { Panel } from './Panel';


function TracePanel ( page ) {

	Panel.call( this, page );

	const self = this;

	this.onShow = _onShow;

	var line1 = null;
	var line2 = null;

	var deleteControls = [];

	page.addListener( Viewer, 'selectedTrace', _onSelect );

	this.add( page.addHeader( 'trace.header' ) );

	function _initPanel () {

		line1.textContent = 'Start:';
		line2.textContent = 'End:';

		deleteControls.forEach ( function _deleteControls ( element ) {

			element.parentElement.removeChild( element );

		} );

		deleteControls = [];

	}

	function _onShow () {

		if ( line1 === null ) line1 = this.add( page.addLine( 'line1' ) );
		if ( line2 === null ) line2 = this.add( page.addLine( 'line2' ) );

		_initPanel();

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

		const button = self.add( page.addButton( 'trace.delete', function() {
			event.delete();
			_initPanel();
		} ) );

		deleteControls.push( button );

	}

	function _showStations ( event ) {

		_initPanel();

		if ( event.start !== undefined ) line1.textContent = 'Start: ' + event.start;

		if ( event.end !== undefined ) {

			line2.textContent = 'End: ' + event.end;

			const button = self.add( page.addButton( 'trace.add', function() {
				event.add();
				_initPanel();
			} ) );

			deleteControls.push( button );

		}

	}

}

TracePanel.prototype = Object.create( Panel.prototype );

export { TracePanel };

// EOF