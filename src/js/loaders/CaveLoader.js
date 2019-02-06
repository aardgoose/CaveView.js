
import { Cfg, replaceExtension } from '../core/lib';
import { Svx3dHandler } from './svx3dHandler';
import { loxHandler } from './loxHandler';
import { pltHandler } from './pltHandler';
import { FileLoader, EventDispatcher } from '../Three';
import { Handler } from './Handler';

function CaveLoader ( callback ) {

	if ( ! callback ) {

		alert( 'No callback specified' );

	}

	this.callback = callback;
	this.dataResponse = null;
	this.metadataResponse = null;
	this.requests = [];

	this.reset();

}

CaveLoader.prototype = Object.create( EventDispatcher.prototype );

CaveLoader.prototype.constructor = CaveLoader;

CaveLoader.prototype.reset = function () {

	this.files = null;
	this.handler = null;
	this.section = null;

	this.requests.forEach( function ( request ) { request.abort(); } );
	this.requests = [];
	this.models = new Handler();

};

CaveLoader.prototype.setHandler = function ( fileName ) {

	const extention = fileName.split( '.' ).reverse().shift().toLowerCase();

	switch ( extention ) {

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

		console.warn( 'CaveView: unknown file extension [', extention, ']' );
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
	const loadMetadata = Cfg.value( 'loadMetadata', false );

	// setup file handler
	if ( ! this.setHandler( fileName ) ) return false;

	const taskCount = loadMetadata ? 2 : 1;

	var doneCount = 0;

	const loader = new FileLoader().setPath( prefix );

	if ( loadMetadata ) {

		loader.setResponseType( 'json' );

		this.requests.push( loader.load( replaceExtension( fileName, 'json' ), _metadataLoaded, undefined, _metadataError ) );

	}

	loader.setResponseType( this.handler.type );

	this.requests.push( loader.load( fileName, _dataLoaded, _progress, _dataError ) );

	return true;

	function _dataLoaded ( result ) {

		self.dataResponse = result;

		if ( ++doneCount === taskCount ) self.callHandler();

	}

	function _metadataLoaded ( result ) {

		self.metadataResponse = result;

		if ( ++doneCount === taskCount ) self.callHandler();

	}

	function _progress ( event ) {

		self.dispatchEvent( { type: 'progress', name: 'set', progress: Math.round( 100 * event.loaded / event.total ) } );

	}

	function _dataError ( event ) {

		if ( event.type === 'abort' ) return;

		console.warn( 'error event', event );

		if ( ++doneCount === taskCount ) self.callHandler();

	}

	function _metadataError ( event ) {

		if ( event.type === 'abort' ) return;

		if ( ++doneCount === taskCount ) self.callHandler();

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

	const moreFiles = files !== null && files.length > 0;

	// start the next download to overlap parsing previous file
	const handler = this.handler;

	this.handler = null;

	if ( moreFiles ) this.loadFile( files.pop() );

	handler.parse( this.models, data, metadata, section );

	if ( ! moreFiles ) {

		this.callback( this.models );
		this.dispatchEvent( { type: 'progress', name: 'end' } );

	}

};

export { CaveLoader };

// EOF