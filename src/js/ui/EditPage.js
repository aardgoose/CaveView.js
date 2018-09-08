import { SHADING_PATH, MOUSE_MODE_ROUTE_EDIT, MOUSE_MODE_TRACE_EDIT, MOUSE_MODE_NORMAL, MOUSE_MODE_ENTRANCES } from '../core/constants';

import { replaceExtension } from '../core/lib';
import { Page } from './Page';
import { Viewer } from '../viewer/Viewer';


const mode = {
	'modes.none': MOUSE_MODE_NORMAL,
	'modes.route': MOUSE_MODE_ROUTE_EDIT,
	'modes.trace': MOUSE_MODE_TRACE_EDIT,
	'modes.entrances': MOUSE_MODE_ENTRANCES
};

function Panel ( page ) {

	this.page = page;
	this.elements = [];

}

Panel.prototype.add = function ( element ) {

	this.elements.push( element );

};

Panel.prototype.setVisibility = function ( visible ) {

	Page.setControlsVisibility( this.elements, visible );

};

function RoutePanel ( page, fileSelector ) {

	Panel.call( this, page );

	const self = this;
	const metadata = Viewer.getMetadata();
	const routeNames = Viewer.routeNames;

	var routeSelector = page.addSelect( 'routes.current', routeNames, Viewer, 'route' );
	var getNewRouteName;

	this.add( routeSelector );

	this.add( page.addButton( 'routes.save', _saveRoute ) );

	this.add( page.addTextBox( 'routes.new', '---', function ( getter ) { getNewRouteName = getter; } ) );

	this.add( page.addButton( 'routes.add', _newRoute ) );

	this.add( page.addDownloadButton( 'routes.download', metadata.getURL, replaceExtension( fileSelector.file, 'json' ) ) );

	function _newRoute () {

		console.log( getNewRouteName );
		//routes.addRoute( getNewRouteName() );

		// update selector

		routeSelector = self.addSelect( 'Current Route', Viewer.routeNames, Viewer, 'route', routeSelector );

	}

	function _saveRoute () {

		//routes.saveCurrent();

	}

}

RoutePanel.prototype = Object.create( Panel.prototype );


function TracePanel ( page ) {

	Panel.call( this, page );

	const self = this;

	this.div = null;
	this.stations = [];
	this.trace = null;

	page.addListener( Viewer, 'selected', _onSelect );

	return this;

	function _onSelect ( event ) {

		if ( event.station !== undefined ) {

			if ( self.stations.length === 2 ) self.stations = [];

			self.stations.push( event.station );

		} else if ( event.trace !== undefined ) {

			self.stations = [];
			self.trace = event.trace;

		}

		self.updatePanel();

	}

}

TracePanel.prototype = Object.create( Panel.prototype );

TracePanel.prototype.updatePanel = function () {

	const stations = this.stations;

	var div = this.div;

	if ( div !== null ) div.parentElement.removeChild( div );

	div = document.createElement( 'div' );

	if ( stations[ 0 ] !== undefined ) {

		const line = document.createElement( 'div' );

		line.textContent = 'Start: ' + stations[ 0 ].getPath();
		div.appendChild( line );

	}

	if ( stations[ 1 ] !== undefined ) {

		const line = document.createElement( 'div' );

		line.textContent = 'End: ' + stations[ 1 ].getPath();
		div.appendChild( line );

		// FIXME add <add> button
	}

	const trace = this.trace;

	if ( trace !== null ) {

		console.log( trace.object.getTraceStations( trace.faceIndex ) );

		// FIXME add <delete> button

	}

	this.add( this.page.appendChild( div ) );
	this.div = div;

};


function EditPage ( fileSelector ) {

	Page.call( this, 'icon_route', 'edit', _onTop, _onLeave );

	const metadata = Viewer.getMetadata();
	const self = this;

	var lastShadingMode;
	var routePanel = null;
	var tracePanel = null;

	this.addHeader( 'header' );

	this.addSelect( 'mode', mode, Viewer, 'editMode' );

	this.addListener( metadata, 'change', _onMetadataChange );

	this.onChange = _onChange;

	return this;

	function _onMetadataChange ( event ) {

		console.log( 'event:', event.type, 'name:', event.name );

	}

	function _onChange ( event ) {

		// change UI dynamicly to only display appropriate controls
		if ( event.name === 'editMode' ) {

			switch ( Viewer.editMode ) {

			case MOUSE_MODE_TRACE_EDIT:

				if ( tracePanel === null ) tracePanel = new TracePanel( self );

				Viewer.traces = true;
				Viewer.shadingMode = lastShadingMode;

				break;

			case MOUSE_MODE_ROUTE_EDIT:

				if ( routePanel === null ) routePanel = new RoutePanel( self, fileSelector );

				Viewer.shadingMode = SHADING_PATH;

				break;

			case MOUSE_MODE_ENTRANCES:

				Viewer.entrances = true;

				break;

			default:

				Viewer.shadingMode = lastShadingMode;

			}

			if ( routePanel !== null ) routePanel.setVisibility( Viewer.editMode === MOUSE_MODE_ROUTE_EDIT );
			if ( tracePanel !== null ) tracePanel.setVisibility( Viewer.editMode === MOUSE_MODE_TRACE_EDIT );

		}

	}

	function _onTop () {

		// when selecting route editing mode - select correct leg shading mode
		lastShadingMode = Viewer.shadingMode;

		_onChange( { type: 'change', name: 'editMode' } );

	}

	function _onLeave () {

		Viewer.shadingMode = lastShadingMode;

	}

}

EditPage.prototype = Object.create( Page.prototype );

export { EditPage };


// EOF