import { replaceExtension } from '../core/lib';

class FileLoader {

	constructor ( file, type, loadingContext, progress ) {

		const results = { data: null, metadata: null };

		if ( file instanceof File ) {

			return new Promise( ( resolve, reject ) => {

				const fLoader = new FileReader();

				fLoader.addEventListener( 'load', _loaded );
				fLoader.addEventListener( 'progress', progress );

				switch ( type ) {

				case 'arraybuffer':

					fLoader.readAsArrayBuffer( file );
					break;

			   case 'text':

					fLoader.readAsText( file );
					break;

				default:

					alert( 'unknown file data type' );
					reject();
					return;

				}

				function _loaded ( event ) {

					fLoader.removeEventListener( 'load', _loaded );
					fLoader.removeEventListener( 'progress', progress );

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

				if ( loadingContext.loadMetadata ) {

					jobs++;

					const metadataReq = new XMLHttpRequest();

					metadataReq.addEventListener( 'load', _metadataLoaded );
					metadataReq.addEventListener( 'error', _metadataError );

					metadataReq.open( 'GET', loadingContext,prefix + file.name ); // FIXME extension
					metadataReq.responseType = 'json';

					metadataReq.send();

				}

				function _dataLoaded ( result ) {

					results.data = result.target.response;
					if ( --jobs === 0 ) resolve( results );

				}

				function _dataError ( event ) {

					if ( event.type === 'abort' ) return;
					console.warn( 'error event', event );

					if ( --jobs === 0 ) reject();

				}

				function _metadataLoaded ( result ) {

					results.metadata = result;
					if ( --jobs === 0 ) resolve( results );

				}


				function _metadataError ( event ) {

					if ( event.type === 'abort' ) return;

					if ( --jobs === 0 ) resolve( results );

				}

			} );

		}

	}

}

export { FileLoader }