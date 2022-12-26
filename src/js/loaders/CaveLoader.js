import { EventDispatcher } from '../Three';
import { Svx3dLoader} from './svx3dLoader';
import { loxLoader } from './loxLoader';
import { pltLoader } from './pltLoader';
import { WorkerLoader } from './WorkerLoader';
import { Handler } from './Handler';

const setProgressEvent = { type: 'progress', name: 'set', progress: 0 };

class CaveLoader extends EventDispatcher {

	constructor ( ctx, callback ) {

		super();

		if ( ! callback ) {

			alert( 'No callback specified' );

		}

		this.callback = callback;
		this.handlers = [];
		this.loading = [];
		this.ctx = ctx;

		this.reset();

		this.loadingContext = {
			'prefix': ctx.cfg.value( 'surveyDirectory', '' ),
			'loadMetadata': ctx.cfg.value( 'loadMetadata', false )
		};

	}

	reset () {

		this.handlers.forEach( handler => handler.abort() );
		this.handlers = [];
		this.loading = [];
		this.models = new Handler( this.ctx );

	}

	getHandler ( file ) {

		const extention = file.name.split( '.' ).reverse().shift().toLowerCase();

		switch ( extention ) {

		case '3d':

			return new Svx3dLoader( file );

		case 'lox':

			return new loxLoader( file );

		case 'plt':

			return new pltLoader( file );

		case 'ply':

			return new WorkerLoader( file, this.ctx.cfg.value( 'home', '' ) + 'js/workers/plyLoaderWorker.js' );

		default:

			console.warn( `CaveView: unknown file extension [${extention}]` );
			return false;

		}

	}

	loadSource ( source, section = null ) {

		this.loadingContext.section = section;

		source.files.forEach( file => this.loadFile( file ) );

		// wait for all loaders to complete or fail
		Promise.all( this.loading ).then( () => this._end( this.models ) );

	}

	loadFile ( file )  {

		const handler = this.getHandler( file );
		const _progress = ( event ) => { if ( event.total > 0 ) this.progress( Math.round( 75 * event.loaded / event.total ) ); };

		if ( ! handler ) return false;

		this.dispatchEvent( { type: 'progress', name: 'start' } );

		this.handlers.push( handler );
		this.loading.push( handler.load( this.loadingContext, _progress , this.models ) );


	}

	progress ( v ) {

		setProgressEvent.progress = v;
		this.dispatchEvent( setProgressEvent );

	}

	_end ( result ) {

		this.callback( result );
		this.dispatchEvent( { type: 'progress', name: 'end' } );
		this.reset();

	}

}

export { CaveLoader };