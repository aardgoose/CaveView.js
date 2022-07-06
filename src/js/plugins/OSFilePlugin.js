import { ModelSource } from '../core/ModelSource';

class OSFilePlugin {

	constructor ( ctx ) {

		const viewer = ctx.viewer;

		if ( 'launchQueue' in window && 'files' in LaunchParams.prototype) {

			console.log( 'os lauch supported' );

			window.launchQueue.setConsumer( ( launchParams ) => {

				const filePromises = [];

				for ( const fileHandle of launchParams.files ) {

					console.log( 'file', fileHandle.name );
					filePromises.push( fileHandle.getFile() );

				}

				Promise.all( filePromises )
					.then( files => {

						if ( ctx.ui ) {

							console.log( 'load via ui' );
							const fs = ctx.ui.getFileSelector();
							fs.loadLocalFiles( files );

						} else {

							viewer.loadCave( new ModelSource( files, true ) );

						}

					} )
					.catch( console.warn( 'error opening files' ) );

			} );

		}

	}

}

export { OSFilePlugin };