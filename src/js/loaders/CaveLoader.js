
import { getEnvironmentValue, replaceExtension } from '../core/lib';
import { Svx3dHandler } from './svx3dHandler';
import { loxHandler } from './loxHandler';
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

}

CaveLoader.prototype.constructor = CaveLoader;

CaveLoader.prototype.parseName = function ( name ) {

	var type;
	var rev = name.split( '.' ).reverse();

	this.extention = rev.shift();
	this.basename  = rev.reverse().join( '.' );

	switch ( this.extention ) {

	case '3d':

		type = 'arraybuffer';

		break;

	case 'lox':

		type = 'arraybuffer';

		break;

	case 'reg':
	case 'json':

		type = 'json';

		break;

	default:

		console.log( 'Cave: unknown response extension [', self.extention, ']' );

	}

	return type;

};

CaveLoader.prototype.loadURL = function ( fileName ) {

	var self = this;
	var prefix = getEnvironmentValue( 'surveyDirectory', '' );

	// parse file name
	var type = this.parseName( fileName );

	if ( ! type ) {

		alert( 'Cave: unknown file extension [', self.extention, ']' );
		return false;

	}

	this.doneCount = 0;

	var loader = new FileLoader().setPath( prefix );

	loader.setResponseType( type ).load( fileName, _dataLoaded, _progress, _error );

	// request metadata file

	loader.setResponseType( 'json' ).load( replaceExtension( fileName, 'json' ), _metadataLoaded, undefined, _error );

	return true;

	function _dataLoaded ( result ) {

		self.doneCount++;
		self.dataResponse = result;

		if ( self.doneCount === 2 ) self.callHandler( fileName );

	}

	function _metadataLoaded ( result ) {

		self.doneCount++;
		self.metadataResponse = result;

		if ( self.doneCount === 2 ) self.callHandler( fileName );

	}

	function _progress ( e ) {

		if ( self.progress) self.progress( Math.round( 100 * e.loaded / e.total ) );

	}

	function _error ( event ) {

		self.doneCount++;

		if ( event.currentTarget.responseType !== 'json' ) console.log( ' error event', event );

		if ( self.doneCount === 2 ) self.callHandler( fileName );

	}

};

CaveLoader.prototype.loadFile = function ( file ) {

	var self = this;
	var fileName = file.name;

	var type = this.parseName( fileName );

	if ( ! type ) {

		alert( 'Cave: unknown file extension [', self.extention, ']' );
		return false;

	}

	var fLoader = new FileReader();

	fLoader.addEventListener( 'load', _loaded );
	fLoader.addEventListener( 'progress', _progress );

	switch ( type ) {

	case 'arraybuffer':

		fLoader.readAsArrayBuffer( file );

		break;

	/*case 'arraybuffer':

		fLoader.readAsArrayText( file );

		break;*/

	default:

		alert( 'unknown file data type' );
		return false;

	}

	return true;

	function _loaded () {

		self.dataResponse = fLoader.result;
		self.callHandler( fileName );

	}

	function _progress ( e ) {

		if ( self.progress ) self.progress( Math.round( 100 * e.loaded / e.total ) );

	}

};

CaveLoader.prototype.callHandler = function ( fileName ) {

	if ( this.dataResponse === null ) {

		this.callback( false );
		return;

	}

	var handler;
	var data = this.dataResponse;
	var metadata = this.metadataResponse;

	switch ( this.extention ) {

	case '3d':

		handler = new Svx3dHandler( fileName, data, metadata );

		break;

	case 'lox':

		handler = new loxHandler( fileName, data, metadata );

		break;

	case 'reg':

		handler = new RegionHandler( fileName, data, metadata );

		break;

	default:

		alert( 'Cave: unknown response extension [', this.extention, ']' );
		handler = false;

	}

	this.callback( handler );

};

export { CaveLoader };

// EOF