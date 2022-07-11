import { SHADING_PATH, MOUSE_MODE_ROUTE_EDIT, MOUSE_MODE_TRACE_EDIT, MOUSE_MODE_NORMAL } from '../core/constants';
import { Page } from './Page';
import { RoutePanel } from './RoutePanel';
import { TracePanel } from './TracePanel';

const mode = {
	'modes.none': MOUSE_MODE_NORMAL,
	'modes.route': MOUSE_MODE_ROUTE_EDIT,
	'modes.trace': MOUSE_MODE_TRACE_EDIT
};

class EditPage extends Page {

	constructor ( frame, viewer, fileSelector ) {

		super( 'icon_route', 'edit', _onTop, _onLeave );

		frame.addPage( this );

		const self = this;
		const intro = [];

		let initialState;

		let routePanel = null;
		let tracePanel = null;

		this.addSelect( 'mode', mode, viewer, 'editMode' );

		intro.push( this.addText( this.i18n( 'intro' ) ) );

		this.onChange = _onChange;

		return;

		function _onChange ( event ) {

			// change UI dynamicly to only display appropriate controls
			if ( event.name === 'editMode' ) {

				const newState = Object.assign( {}, initialState );

				switch ( viewer.editMode ) {

				case MOUSE_MODE_TRACE_EDIT:

					if ( tracePanel === null ) tracePanel = new TracePanel( self, viewer );

					newState.traces = true;

					break;

				case MOUSE_MODE_ROUTE_EDIT:

					if ( routePanel === null ) routePanel = new RoutePanel( self, viewer, fileSelector );

					newState.shadingMode = SHADING_PATH;

					break;

				}

				viewer.setView( newState );

				frame.setControlsVisibility( intro, viewer.editMode === MOUSE_MODE_NORMAL );

				if ( routePanel !== null ) routePanel.setVisibility( viewer.editMode === MOUSE_MODE_ROUTE_EDIT );
				if ( tracePanel !== null ) tracePanel.setVisibility( viewer.editMode === MOUSE_MODE_TRACE_EDIT );

			}

		}

		function _onTop () {

			// save initial view settings

			initialState = {
				shadingMode: viewer.shadingMode,
				stations: viewer.stations,
				traces: viewer.traces
			};

			_onChange( { type: 'change', name: 'editMode' } );

		}

		function _onLeave () {

			// restore inital view settings

			viewer.setView( initialState );

		}

	}

}

export { EditPage };