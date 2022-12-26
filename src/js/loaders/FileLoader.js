import { replaceExtension } from '../core/lib';

class FileLoader {

	constructor ( file ) {

		this.file = file;
		this.requests = [];

	}

	load ( type, loadingContext, progress ) {

		const results = { data: null, metadata: null };
		const file = this.file;

		if ( file instanceof File ) {

			return new Promise( ( resolve, reject ) => {

				const fileReader = new FileReader();

				fileReader.addEventListener( 'load', _loaded );
				fileReader.addEventListener( 'progress', progress );

				this.requests.push( fileReader );

				switch ( type ) {

				case 'arraybuffer':

					fileReader.readAsArrayBuffer( file );
					break;

			   case 'text':

					fileReader.readAsText( file );
					break;

				default:

					reject( 'unknown file data type' );
					return;

				}

				function _loaded ( event ) {

					fileReader.removeEventListener( 'load', _loaded );
					fileReader.removeEventListener( 'progress', progress );

					results.data = event.target.result;

					resolve( results )

				}

			} );


		} else {

			return new Promise( ( resolve, reject ) => {

				let jobs = 1;

				const dataReq = new XMLHttpRequest();

				dataReq.addEventListener( 'load', _dataLoaded );
		    	dataReq.addEventListener( 'progress', progress );
				dataReq.addEventListener( 'error', _dataError );

				dataReq.open( 'GET', loadingContext.prefix + file.name );
				dataReq.responseType = type;

				dataReq.send();

				this.requests.push( dataReq );

				if ( loadingContext.loadMetadata ) {

					jobs++;

					const metadataReq = new XMLHttpRequest();

					metadataReq.addEventListener( 'load', _metadataLoaded );
					metadataReq.addEventListener( 'error', _metadataError );

					metadataReq.open( 'GET', loadingContext,prefix + replaceExtension( file.name, 'json' ) ); // FIXME extension
					metadataReq.responseType = 'json';

					metadataReq.send();
					this.requests.push( metadataReq );

				}

				function _dataLoaded ( event ) {

					results.data = event.target.response;

					if ( --jobs === 0 ) resolve( results );

				}

				function _dataError ( event ) {

					if ( event.type === 'abort' ) return;

					if ( --jobs === 0 ) reject( `error loading data with error: ${dataReq.statusText}` );

				}

				function _metadataLoaded ( event ) {

					results.metadata = event.target.response;

					if ( --jobs === 0 ) resolve( results );

				}


				function _metadataError ( event ) {

					if ( event.type === 'abort' ) return;

					if ( --jobs === 0 ) resolve( results );

				}

			} );

		}

	}

	abort () {

		this.requests.forEach( request => request.abort() );

	}

}

export { FileLoader }