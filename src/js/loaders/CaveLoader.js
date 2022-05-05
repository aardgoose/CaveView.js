import { replaceExtension } from '../core/lib';
import { Svx3dHandler } from './svx3dHandler';
import { loxHandler } from './loxHandler';
import { pltHandler } from './pltHandler';
import { FileLoader, EventDispatcher } from '../Three';
import { Handler } from './Handler';

const setProgressEvent = { type: 'progress', name: 'set', progress: 0 };

class CaveLoader extends EventDispatcher {

	constructor ( ctx, callback ) {

		super();

		if ( ! callback ) {

			alert( 'No callback specified' );

		}

		this.callback = callback;
		this.dataResponse = null;
		this.metadataResponse = null;
		this.requests = [];
		this.ctx = ctx;

		this.reset();

	}

	reset () {

		this.files = null;
		this.handler = null;
		this.section = null;

		this.requests.forEach( request => request.abort() );
		this.requests = [];
		this.models = new Handler( this.ctx );

	}

	setHandler ( fileName ) {

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

	}

	loadFile ( file, section ) {

		if ( file instanceof File ) {

			this.loadLocalFile( file, section );

		} else {

			this.loadURL( file, section );

		}

	}

	loadFiles ( files ) {

		this.files = files;
		this.loadFile( files.pop() );

	}

	progress ( v ) {

		setProgressEvent.progress = v;
		this.dispatchEvent( setProgressEvent );

	}

	loadURL ( fileName, section ) {

		const cfg = this.ctx.cfg;

		this.dispatchEvent( { type: 'progress', name: 'start' } );

		if ( section !== undefined ) this.section = section;

		const self = this;
		const prefix = cfg.value( 'surveyDirectory', '' );
		const loadMetadata = cfg.value( 'loadMetadata', false );

		// setup file handler
		if ( ! this.setHandler( fileName ) ) return false;

		const taskCount = loadMetadata ? 2 : 1;

		let doneCount = 0;

		const loader = new FileLoader().setPath( prefix );

		if ( loadMetadata ) {

			loader.setResponseType( 'json' );

			const req = loader.load( replaceExtension( fileName, 'json' ), _metadataLoaded, undefined, _metadataError );
			if ( req ) this.requests.push( req );

		}

		loader.setResponseType( this.handler.type );

		const req = loader.load( fileName, _dataLoaded, _progress, _dataError );
		if ( req ) this.requests.push( req );

		return true;

		function _dataLoaded ( result ) {

			self.dataResponse = result;

			self.progress( 75 );

			if ( ++doneCount === taskCount ) self.callHandler();

		}

		function _metadataLoaded ( result ) {

			self.metadataResponse = result;

			if ( ++doneCount === taskCount ) self.callHandler();

		}

		function _progress ( event ) {

			if ( event.total > 0 ) self.progress( Math.round( 75 * event.loaded / event.total ) );

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

	}

	loadLocalFile ( file, section ) {

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

			self.progress( 75 );

			fLoader.removeEventListener( 'load', _loaded );
			fLoader.removeEventListener( 'progress', _progress );

		}

		function _progress ( e ) {

			if ( e.total > 0 ) self.progress( Math.round( 75 * e.loaded / e.total ) );

		}

	}

	callHandler () {

		if ( this.dataResponse === null ) {

			this.callback( false );
			this.dispatchEvent( { type: 'progress', name: 'end' } );

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

		const progress = this.progress.bind( this );

		handler.parse( this.models, data, metadata, section, progress ).then( models => {

			if ( ! moreFiles ) {

				this.callback( models );
				this.dispatchEvent( { type: 'progress', name: 'end' } );

			}

		} );

	}

}


export { CaveLoader };