
import { getEnvironmentValue } from '../core/constants.js';


function RegionLoader ( callback, progress ) {

	if (!callback) {

		alert( "No callback specified");

	}

	this.callback = callback;
	this.progress = progress;

}

RegionLoader.prototype.constructor = RegionLoader;

RegionLoader.prototype.load = function ( regionFile ) {

	var self = this;
	var prefix = getEnvironmentValue( "surveyDirectory", "" );

	var xhr = new XMLHttpRequest();

	xhr.addEventListener( "load", _loaded );
	xhr.addEventListener( "progress", _progress );

	xhr.open( "GET", prefix + regionFile );

	xhr.send();

	return true;

	function _loaded ( request ) {

		self.callback( JSON.parse( xhr.response ) );

	}

	function _progress( e ) {

		if ( self.progress) self.progress( Math.round( 100 * e.loaded / e.total ) );

	}
}

export { RegionLoader };

// EOF