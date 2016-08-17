
import { getEnvironmentValue } from '../core/constants.js';
import { Svx3dHandler } from './Svx3dHandler.js';
import { loxHandler } from './loxHandler.js';

function Loader ( callback, progress ) {

	if (!callback) {

		alert( "No callback specified");

	}

	this.callback = callback;
	this.progress = progress;

}

Loader.prototype.constructor = Loader;

Loader.prototype.parseName = function ( name ) {

	var rev = name.split( "." ).reverse();

	this.extention = rev.shift();
	this.basename  = rev.reverse().join( "." );

	switch ( this.extention ) {

	case '3d':

		this.dataType = "arraybuffer";

		break;

	case 'lox':

		this.dataType = "arraybuffer";

		break;

	default:

		alert( "Cave: unknown response extension [", self.extention, "]" );

	}

}

Loader.prototype.loadURL = function ( cave ) {

	var self     = this;
	var fileName = cave;
	var xhr;
	var prefix   = getEnvironmentValue( "surveyDirectory", "" );

	// parse file name
	this.parseName( cave );

	// load this file
	var type = this.dataType;

	if (!type) {

		alert( "Cave: unknown file extension [", self.extention, "]");
		return false;

	}

	xhr = new XMLHttpRequest();

	xhr.addEventListener( "load", _loaded );
	xhr.addEventListener( "progress", _progress );

	xhr.open( "GET", prefix + cave );

	if (type) {

		xhr.responseType = type; // Must be after open() to keep IE happy.

	}

	xhr.send();

	return true;

	function _loaded ( request ) {

		self.callHandler( fileName, xhr.response );

	}

	function _progress( e ) {

		if ( self.progress) self.progress( Math.round( 100 * e.loaded / e.total ) );

	}
}

Loader.prototype.loadFile = function ( file ) {

	var self = this;
	var fileName = file.name;

	this.parseName( fileName );

	var type = this.dataType;

	if ( !type ) {

		alert( "Cave: unknown file extension [", self.extention, "]");
		return false;

	}

	var fLoader = new FileReader();

	fLoader.addEventListener( "load",     _loaded );
	fLoader.addEventListener( "progress", _progress );

	switch ( type ) {

	case "arraybuffer":

		fLoader.readAsArrayBuffer( file );

		break;

	/*case "arraybuffer":

		fLoader.readAsArrayText( file );

		break;*/

	default:

		alert( "unknown file data type" );
		return false;

	}

	return true;

	function _loaded () {

		self.callHandler( fileName, fLoader.result );

	}

	function _progress( e ) {

		if (self.progress) self.progress( Math.round( 100 * e.loaded / e.total ) );

	}
}

Loader.prototype.callHandler = function( fileName, data) {

	var handler;

	switch ( this.extention ) {

	case '3d':

		handler = new Svx3dHandler( fileName, data );

		break;

	case 'lox':

		handler = new loxHandler( fileName, data );

		break;

	default:

		alert( "Cave: unknown response extension [", this.extention, "]" );
		handler = false;

	}

	this.callback( handler );

}

export { Loader };

// EOF