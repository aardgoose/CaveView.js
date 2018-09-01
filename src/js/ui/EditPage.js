import { SHADING_PATH, MOUSE_MODE_ROUTE_EDIT, MOUSE_MODE_TRACE_EDIT, MOUSE_MODE_NORMAL } from '../core/constants';

import { replaceExtension } from '../core/lib';
import { Page } from './Page';
import { Viewer } from '../viewer/Viewer';


const mode = {
	'modes.none': MOUSE_MODE_NORMAL,
	'modes.route': MOUSE_MODE_ROUTE_EDIT,
	'modes.trace': MOUSE_MODE_TRACE_EDIT
};

function EditPage ( fileSelector ) {

	Page.call( this, 'icon_route', 'edit', _onTop, _onLeave );

	const routes = Viewer.getRoutes();
	const routeNames = routes.getRouteNames();
	const routeControls = [];
	const self = this;

	var routeSelector;
	var getNewRouteName;
	var lastShadingMode;

	this.addHeader( 'header' );

	this.addSelect( 'mode', mode, Viewer, 'editMode' );

	routeSelector = this.addSelect( 'routes.current', routeNames, routes, 'setRoute' );

	routeControls.push( routeSelector );

	routeControls.push( this.addButton( 'routes.save', _saveRoute ) );

	routeControls.push( this.addTextBox( 'routes.new', '---', function ( getter ) { getNewRouteName = getter; } ) );

	routeControls.push( this.addButton( 'routes.add', _newRoute ) );

	routeControls.push( this.addDownloadButton( 'routes.download', Viewer.getMetadata, replaceExtension( fileSelector.file, 'json' ) ) );

	Page.setControlsVisibility( routeControls, false );

	this.addListener( routes, 'changed', Page.handleChange );

	this.onChange = _onChange;

	return this;

	function _onChange ( event ) {

		// change UI dynamicly to only display useful controls
		if ( event.name === 'editMode' ) {

			if ( Viewer.editMode === MOUSE_MODE_ROUTE_EDIT ) {

				Page.setControlsVisibility( routeControls, true );
				Viewer.shadingMode = SHADING_PATH;

			} else {

				Page.setControlsVisibility( routeControls, false );
				Viewer.shadingMode = lastShadingMode;

			}

		}

	}

	function _newRoute () {

		routes.addRoute( getNewRouteName() );

		// update selector

		routeSelector = self.addSelect( 'Current Route', routes.getRouteNames(), routes, 'setRoute', routeSelector );

	}

	function _saveRoute () {

		routes.saveCurrent();

	}

	function _onTop () {

		// when selecting route editing mode - select correct leg shading mode
		lastShadingMode = Viewer.shadingMode;

		// display first route if present

//		if ( ! routes.setRoute && routeNames.length > 0 ) routes.setRoute = routeNames[ 0 ];

	}

	function _onLeave () {

		Viewer.shadingMode = lastShadingMode;

	}

}

EditPage.prototype = Object.create( Page.prototype );

export { EditPage };


// EOF