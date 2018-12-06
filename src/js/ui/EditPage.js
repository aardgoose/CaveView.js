import { SHADING_PATH, MOUSE_MODE_ROUTE_EDIT, MOUSE_MODE_TRACE_EDIT, MOUSE_MODE_NORMAL, MOUSE_MODE_ENTRANCES, MOUSE_MODE_ANNOTATE } from '../core/constants';

import { Page } from './Page';
import { Viewer } from '../viewer/Viewer';
import { RoutePanel } from './RoutePanel';
import { TracePanel } from './TracePanel';
import { AnnotatePanel } from './AnnotatePanel';
import { EntrancePanel } from './EntrancePanel';


const mode = {
	'modes.none': MOUSE_MODE_NORMAL,
	'modes.annotate': MOUSE_MODE_ANNOTATE,
	'modes.entrances': MOUSE_MODE_ENTRANCES,
	'modes.route': MOUSE_MODE_ROUTE_EDIT,
	'modes.trace': MOUSE_MODE_TRACE_EDIT
};


function EditPage ( fileSelector ) {

	Page.call( this, 'icon_route', 'edit', _onTop, _onLeave );

	const self = this;
	const intro = [];

	var initialState;

	var annotatePanel = null;
	var routePanel = null;
	var tracePanel = null;
	var entrancePanel = null;

	this.addHeader( 'header' );

	this.addSelect( 'mode', mode, Viewer, 'editMode' );

	intro.push( this.addText( this.i18n( 'intro' ) ) );

	this.onChange = _onChange;

	return this;

	function _onChange ( event ) {

		// change UI dynamicly to only display appropriate controls
		if ( event.name === 'editMode' ) {

			const newState = Object.assign( {}, initialState );

			switch ( Viewer.editMode ) {

			case MOUSE_MODE_TRACE_EDIT:

				if ( tracePanel === null ) tracePanel = new TracePanel( self );

				newState.traces = true;

				break;

			case MOUSE_MODE_ROUTE_EDIT:

				if ( routePanel === null ) routePanel = new RoutePanel( self, fileSelector );

				newState.shadingMode = SHADING_PATH;

				break;

			case MOUSE_MODE_ENTRANCES:

				if ( entrancePanel === null ) entrancePanel = new EntrancePanel( self );

				newState.entrances = true;

				break;

			case MOUSE_MODE_ANNOTATE:

				if ( annotatePanel === null ) annotatePanel = new AnnotatePanel( self );

				newState.stations = true;
				newState.annotations = true;

				break;

			}

			Viewer.setView( newState );

			Page.setControlsVisibility( intro, Viewer.editMode === MOUSE_MODE_NORMAL );

			if ( annotatePanel !== null ) annotatePanel.setVisibility( Viewer.editMode === MOUSE_MODE_ANNOTATE );
			if ( entrancePanel !== null ) entrancePanel.setVisibility( Viewer.editMode === MOUSE_MODE_ENTRANCES );
			if ( routePanel !== null ) routePanel.setVisibility( Viewer.editMode === MOUSE_MODE_ROUTE_EDIT );
			if ( tracePanel !== null ) tracePanel.setVisibility( Viewer.editMode === MOUSE_MODE_TRACE_EDIT );

		}

	}

	function _onTop () {

		// save initial view settings

		initialState = {
			annotations: Viewer.annotations,
			shadingMode: Viewer.shadingMode,
			entrances: Viewer.entrances,
			stations: Viewer.stations,
			traces: Viewer.traces
		};

		_onChange( { type: 'change', name: 'editMode' } );

	}

	function _onLeave () {

		// restore inital view settings

		Viewer.setView( initialState );

	}

}

EditPage.prototype = Object.create( Page.prototype );

export { EditPage };


// EOF