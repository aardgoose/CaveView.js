import { SHADING_PATH } from '../core/constants';

import { replaceExtension } from '../core/lib';
import { Page } from './Page';
import { Viewer } from '../viewer/Viewer';


function RoutePage ( fileSelector ) {

	Page.call( this, 'icon_route', 'routes', _onTop, _onLeave );

	const routes = Viewer.getRoutes();
	const routeNames = routes.getRouteNames();
	const controls = [];
	const self = this;

	var routeSelector;
	var getNewRouteName;
	var lastShadingMode;

	this.addHeader( 'routes.header' );

	this.addCheckbox( 'routes.edit', Viewer, 'routeEdit' );

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

RoutePage.prototype = Object.create( Page.prototype );

export { RoutePage };


// EOF