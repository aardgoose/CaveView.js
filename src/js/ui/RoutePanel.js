
import { replaceExtension } from '../core/lib';
import { Viewer } from '../viewer/Viewer';
import { Panel } from './Panel';


function RoutePanel ( page, fileSelector ) {

	Panel.call( this, page );

	const self = this;
	const metadata = Viewer.getMetadata();
	const routeNames = Viewer.routeNames;

	this.add( page.addHeader( 'route.header' ) );

	var routeSelector = page.addSelect( 'route.current', routeNames, Viewer, 'route' );
	var getNewRouteName;

	this.add( routeSelector );

	this.add( page.addButton( 'route.save', _saveRoute ) );

	this.add( page.addTextBox( 'route.new', '---', function ( getter ) { getNewRouteName = getter; } ) );

	this.add( page.addButton( 'route.add', _newRoute ) );

	this.add( page.addDownloadButton( 'route.download', metadata.getURL, replaceExtension( fileSelector.file, 'json' ) ) );

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