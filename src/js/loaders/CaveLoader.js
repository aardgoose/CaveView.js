
import { Cfg, replaceExtension } from '../core/lib';
import { Svx3dHandler } from './svx3dHandler';
import { loxHandler } from './loxHandler';
import { pltHandler } from './pltHandler';
import { FileLoader, EventDispatcher } from '../Three';

function CaveLoader ( callback ) {

	if ( ! callback ) {

		alert( 'No callback specified' );

	}

	this.callback = callback;
	this.dataResponse = null;
	this.metadataResponse = null;
	this.taskCount = 0;
	this.section = null;
	this.handler = null;
	this.extention = null;
	this.files = null;

}

CaveLoader.prototype = Object.create( EventDispatcher.prototype );

CaveLoader.prototype.constructor = CaveLoader;

CaveLoader.prototype.setHandler = function ( fileName ) {

	const extention = fileName.split( '.' ).reverse().shift().toLowerCase();

	if ( this.extention !== null && extention !== this.extention ) {

		alert( 'CaveView: mismatched file extension for [' + fileName + ']' );
		return false;

	}

	if ( this.handler !== null ) return true;

	this.extention = extention;

	switch ( this.extention ) {

	case '3d':

		this.handler = new Svx3dHandler( fileName );

		break;

	case 'lox':

		this.handler = new loxHandler( fileName );

		break;

	case 'plt':

		this.handler = new pltHandler( fileName );

		break;

	default:

		console.warn( 'CaveView: unknown file extension [', this.extention, ']' );
		return false;

	}

	return true;

};

CaveLoader.prototype.loadFile = function ( file, section ) {

	if ( file instanceof File ) {

		this.loadLocalFile( file, section );

	} else {

		this.loadURL( file, section );

	}

};

CaveLoader.prototype.loadFiles = function ( files ) {

	this.files = files;
	this.loadFile( files.pop() );

};

CaveLoader.prototype.loadURL = function ( fileName, section ) {

	this.dispatchEvent( { type: 'progress', name: 'start' } );

	if ( section !== undefined ) this.section = section;

	const self = this;
	const prefix = Cfg.value( 'surveyDirectory', '' );

	// setup file handler
	if ( ! this.setHandler( fileName ) ) return false;

	const handler = this.handler;

	this.doneCount = 0;
	this.taskCount = 2;

	const loader = new FileLoader().setPath( prefix );

	loader.setResponseType( 'json' ).load( replaceExtension( fileName, 'json' ), _metadataLoaded, undefined, _metadataError );

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

		self.dispatchEvent( { type: 'progress', name: 'set', progress: Math.round( 100 * e.loaded / e.total ) } );

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

CaveLoader.prototype.loadLocalFile = function ( file, section ) {

	this.dispatchEvent( { type: 'progress', name: 'start' } );

	if ( section !== undefined ) this.section = section;

	const self = this;
	const fileName = file.name;

	if ( ! this.setHandler( fileName ) ) return false;

	const fLoader = new FileReader();

	fLoader.addEventListener( 'load', _loaded );
	fLoader.addEventListener( 'progress', _progress );

	switch ( this.handler.type ) {

	case 'arraybuffer':

		fLoader.readAsArrayBuffer( file );

		break;

	case 'text':

		fLoader.readAsText( file );

		break;

	default:

		alert( 'unknown file data type' );
		return false;

	}

	return true;

	function _loaded () {

		self.dataResponse = fLoader.result;
		self.callHandler();

		fLoader.removeEventListener( 'load', _loaded );
		fLoader.removeEventListener( 'progress', _progress );

	}

	function _progress ( e ) {

		self.dispatchEvent( { type: 'progress', name: 'set', progress: Math.round( 100 * e.loaded / e.total ) } );

	}

};

CaveLoader.prototype.callHandler = function () {

	if ( this.dataResponse === null ) {

		this.callback( false );
		this.dispatchEvent( { type: 'progress', name: 'stop' } );

		return;

	}

	const data = this.dataResponse;
	const metadata = this.metadataResponse;
	const section = this.section;
	const files = this.files;

	this.dataResponse = null;
	this.metadataResponse = null;
	this.section = null;

	const moreFiles = files !== null && files.length > 0;

	// start the next download to overlap parsing previous file

	if ( moreFiles ) this.loadFile( files.pop() );

	this.handler.parse( data, metadata, section );

	if ( ! moreFiles ) {

		this.callback( this.handler.end() );
		this.dispatchEvent( { type: 'progress', name: 'end' } );

		this.handler = null;
		this.extention = null;

	}

};

export { CaveLoader };

// EOF