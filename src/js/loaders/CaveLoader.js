
import { getEnvironmentValue } from '../core/constants.js';
import { Svx3dHandler } from './svx3dHandler.js';
import { loxHandler } from './loxHandler.js';
import { RegionHandler } from './RegionHandler.js';
import { RouteHandler } from './RouteHandler.js';

function CaveLoader ( callback, progress ) {

	if ( !callback ) {

		alert( "No callback specified" );

	}

	this.callback = callback;
	this.progress = progress;

}

CaveLoader.prototype.constructor = CaveLoader;

CaveLoader.prototype.parseName = function ( name ) {

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

	case 'reg':
	case 'json':

		this.dataType = "json";

		break;

	default:

		console.log( "Cave: unknown response extension [", self.extention, "]" );

	}

}

CaveLoader.prototype.loadURL = function ( cave ) {

	var self     = this;
	var fileName = cave;
	var xhr;
	var prefix   = getEnvironmentValue( "surveyDirectory", "" );

	// parse file name
	this.parseName( cave );

	// load this file
	var type = this.dataType;

	if ( !type ) {

		alert( "Cave: unknown file extension [", self.extention, "]");
		return false;

	}

	xhr = new XMLHttpRequest();

	xhr.addEventListener( "load", _loaded );
	xhr.addEventListener( "progress", _progress );

	xhr.open( "GET", prefix + cave );

	if ( type ) {

		xhr.responseType = type; // Must be after open() to keep IE happy.

	}

	xhr.send();

	return true;

	function _loaded ( request ) {

		self.callHandler( fileName, xhr.response );

	}

	function _progress ( e ) {

		if ( self.progress) self.progress( Math.round( 100 * e.loaded / e.total ) );

	}
}

CaveLoader.prototype.loadFile = function ( file ) {

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

		if ( self.progress ) self.progress( Math.round( 100 * e.loaded / e.total ) );

	}
}

CaveLoader.prototype.callHandler = function( fileName, data ) {

	if ( data === null ) {

		this.callback( false );
		return;

	}

	var handler;

	switch ( this.extention ) {

	case '3d':

		handler = new Svx3dHandler( fileName, data );

		break;

	case 'lox':

		handler = new loxHandler( fileName, data );

		break;

	case 'reg':

		handler = new RegionHandler( fileName, data );

		break;

	case 'json':

		handler = new RouteHandler( fileName, data );

		break;

	default:

		alert( "Cave: unknown response extension [", this.extention, "]" );
		handler = false;

	}

	this.callback( handler );

}

export { CaveLoader };

// EOF