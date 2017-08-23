
import { getEnvironmentValue, replaceExtension } from '../core/lib';
import { Svx3dHandler } from './svx3dHandler';
import { loxHandler } from './loxHandler';
import { kmlHandler } from './kmlHandler';
import { RegionHandler } from './RegionHandler';
import { FileLoader } from '../../../../three.js/src/Three';

function CaveLoader ( callback, progress ) {

	if ( ! callback ) {

		alert( 'No callback specified' );

	}

	this.callback = callback;
	this.progress = progress;
	this.dataResponse = null;
	this.metadataResponse = null;
	this.taskCount = 0;

}

CaveLoader.prototype.constructor = CaveLoader;

CaveLoader.prototype.setHandler = function ( fileName ) {

	var rev = fileName.split( '.' ).reverse();

	this.extention = rev.shift().toLowerCase();

	var handler;

	switch ( this.extention ) {

	case '3d':

		handler = new Svx3dHandler( fileName );

		break;

	case 'lox':

		handler = new loxHandler( fileName );

		break;


	case 'kml':

		handler = new kmlHandler( fileName );

		break;

	case 'reg':
	case 'json':

		handler = new RegionHandler( fileName );

		break;

	default:

		console.warn( 'Cave: unknown response extension [', self.extention, ']' );
		return false;

	}

	this.handler = handler;

	return true;

};

CaveLoader.prototype.loadURL = function ( fileName ) {

	var self = this;
	var prefix = getEnvironmentValue( 'surveyDirectory', '' );

	// setup file handler
	if ( ! this.setHandler( fileName ) ) {

		alert( 'Cave: unknown file extension [' + self.extention + ']' );
		return false;

	}

	var handler = this.handler;

	this.doneCount = 0;
	this.taskCount = handler.isRegion ? 1 : 2;

	var loader = new FileLoader().setPath( prefix );

	// request metadata file if not a region

	if ( ! handler.isRegion ) {

		loader.setResponseType( 'json' ).load( replaceExtension( fileName, 'json' ), _metadataLoaded, undefined, _metadataError );

	}

	if ( handler.mimeType !== undefined ) loader.setMimeType( 'text/xml' );

	loader.setResponseType( handler.type );

	loader.load( fileName, _dataLoaded, _progress, _dataError );

	return true;

	function _dataLoaded ( result ) {

		self.doneCount++;
		self.dataResponse = result;

		if ( self.doneCount === self.taskCount ) self.callHandler();

	}

	function _metadataLoaded ( result ) {

		self.doneCount++;
		self.metadataResponse = result;

		if ( self.doneCount === self.taskCount ) self.callHandler();

	}

	function _progress ( e ) {

		if ( self.progress) self.progress( Math.round( 100 * e.loaded / e.total ) );

	}

	function _dataError ( event ) {

		self.doneCount++;

		console.warn( ' error event', event );

		if ( self.doneCount === self.taskCount ) self.callHandler( fileName );

	}

	function _metadataError ( /* event */ ) {

		self.doneCount++;

		if ( self.doneCount === self.taskCount ) self.callHandler( fileName );

	}

};

CaveLoader.prototype.loadFile = function ( file ) {

	var self = this;
	var fileName = file.name;

	if ( ! this.setHandler( fileName ) ) {

		alert( 'Cave: unknown file extension [' + this.extention +  ']' );
		return false;

	}

	var type = this.handler.type;
	var fLoader = new FileReader();

	fLoader.addEventListener( 'load', _loaded );
	fLoader.addEventListener( 'progress', _progress );

	switch ( type ) {

	case 'arraybuffer':

		fLoader.readAsArrayBuffer( file );

		break;

	default:

		alert( 'unknown file data type' );
		return false;

	}

	return true;

	function _loaded () {

		self.dataResponse = fLoader.result;
		self.callHandler();

	}

	function _progress ( e ) {

		if ( self.progress ) self.progress( Math.round( 100 * e.loaded / e.total ) );

	}

};

CaveLoader.prototype.callHandler = function () {

	if ( this.dataResponse === null ) {

		this.callback( false );
		return;

	}

	var data = this.dataResponse;
	var metadata = this.metadataResponse;

	this.dataResponse = null;
	this.metadataResponse = null;

	this.callback( this.handler.parse( data, metadata ) );

};

export { CaveLoader };

// EOF