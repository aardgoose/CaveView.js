import { SHADING_PATH, MOUSE_MODE_ROUTE_EDIT, MOUSE_MODE_TRACE_EDIT, MOUSE_MODE_NORMAL, /* MOUSE_MODE_ENTRANCES, MOUSE_MODE_ANNOTATE */ } from '../core/constants';

import { Page } from './Page';
import { RoutePanel } from './RoutePanel';
import { TracePanel } from './TracePanel';
//import { AnnotatePanel } from './AnnotatePanel';
//import { EntrancePanel } from './EntrancePanel';

const mode = {
	'modes.none': MOUSE_MODE_NORMAL,
	//	'modes.annotate': MOUSE_MODE_ANNOTATE,
	// 'modes.entrances': MOUSE_MODE_ENTRANCES,
	'modes.route': MOUSE_MODE_ROUTE_EDIT,
	'modes.trace': MOUSE_MODE_TRACE_EDIT
};


function EditPage ( frame, viewer, fileSelector ) {

	Page.call( this, 'icon_route', 'edit', _onTop, _onLeave );

	frame.addPage( this );

	const self = this;
	const intro = [];

	var initialState;

	// var annotatePanel = null;
	var routePanel = null;
	var tracePanel = null;
	// var entrancePanel = null;

	this.addHeader( 'header' );

	this.addSelect( 'mode', mode, viewer, 'editMode' );

	intro.push( this.addText( this.i18n( 'intro' ) ) );

	this.onChange = _onChange;

	return this;

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
			/*
			case MOUSE_MODE_ENTRANCES:

				if ( entrancePanel === null ) entrancePanel = new EntrancePanel( self, viewer );

				newState.entrances = true;

				break;

			case MOUSE_MODE_ANNOTATE:

				if ( annotatePanel === null ) annotatePanel = new AnnotatePanel( self, viewer );

				newState.stations = true;
				newState.annotations = true;

				break;
			*/

			}

			viewer.setView( newState );

			frame.setControlsVisibility( intro, viewer.editMode === MOUSE_MODE_NORMAL );

			// if ( annotatePanel !== null ) annotatePanel.setVisibility( viewer.editMode === MOUSE_MODE_ANNOTATE );
			// if ( entrancePanel !== null ) entrancePanel.setVisibility( viewer.editMode === MOUSE_MODE_ENTRANCES );
			if ( routePanel !== null ) routePanel.setVisibility( viewer.editMode === MOUSE_MODE_ROUTE_EDIT );
			if ( tracePanel !== null ) tracePanel.setVisibility( viewer.editMode === MOUSE_MODE_TRACE_EDIT );

		}

	}

	function _onTop () {

		// save initial view settings

		initialState = {
			// annotations: viewer.annotations,
			shadingMode: viewer.shadingMode,
			// entrances: viewer.entrances,
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

EditPage.prototype = Object.create( Page.prototype );

export { EditPage };


// EOF