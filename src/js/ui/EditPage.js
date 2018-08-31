import { SHADING_PATH, MOUSE_MODE_ROUTE_EDIT, MOUSE_MODE_TRACE_EDIT, MOUSE_MODE_NORMAL } from '../core/constants';

import { replaceExtension } from '../core/lib';
import { Page } from './Page';
import { Viewer } from '../viewer/Viewer';


const mode = {
	'mode.none': MOUSE_MODE_NORMAL,
	'mode.route': MOUSE_MODE_ROUTE_EDIT,
	'mode.trace': MOUSE_MODE_TRACE_EDIT
};

function EditPage ( fileSelector ) {

	Page.call( this, 'icon_route', 'edit', _onTop, _onLeave );

	const routes = Viewer.getRoutes();
	const routeNames = routes.getRouteNames();
	const controls = [];
	const self = this;

	var routeSelector;
	var getNewRouteName;
	var lastShadingMode;

	this.addHeader( 'header' );

	this.addRadioBoxes( 'mode', Viewer, 'editMode', mode );

	routeSelector = this.addSelect( 'routes.current', routeNames, routes, 'setRoute' );

	controls.push( this.addButton( 'routes.save', _saveRoute ) );

	controls.push( this.addTextBox( 'routes.new', '---', function ( getter ) { getNewRouteName = getter; } ) );

	controls.push( this.addButton( 'routes.add', _newRoute ) );

	controls.push( this.addDownloadButton( 'routes.download', Viewer.getMetadata, replaceExtension( fileSelector.file, 'json' ) ) );

	Page.setControlsVisibility( controls, false );

	this.addListener( routes, 'changed', Page.handleChange );

	this.onChange = _onChange;

	return this;

	function _onChange ( event ) {

		// change UI dynamicly to only display useful controls
		if ( event.name === 'routeEdit' ) {

			Page.setControlsVisibility( controls, Viewer.routeEdit );

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
		Viewer.shadingMode = SHADING_PATH;

		// display first route if present

		if ( ! routes.setRoute && routeNames.length > 0 ) routes.setRoute = routeNames[ 0 ];

	}

	function _onLeave () {

		Viewer.shadingMode = lastShadingMode;

	}

}

EditPage.prototype = Object.create( Page.prototype );

export { EditPage };


// EOF