
import { replaceExtension } from '../core/lib';
import { Viewer } from '../viewer/Viewer';
import { Panel } from './Panel';


function RoutePanel ( page, fileSelector ) {

	Panel.call( this, page );

	const self = this;
	const metadata = Viewer.getMetadata();
	const routeNames = Viewer.routeNames;

	this.add( page.addHeader( 'route.header' ) );

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



export { RoutePanel };


// EOF