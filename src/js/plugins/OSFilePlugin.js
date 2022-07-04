class OSFilePlugin {

	constructor ( ctx ) {

		const viewer = ctx.viewer;

		if ( 'launchQueue' in window && 'files' in LaunchParams.prototype) {

			console.log( 'os lauch supported' );

			window.launchQueue.setConsumer( ( launchParams ) => {

				// Nothing to do when the queue is empty.
				if ( ! launchParams.files.length ) {
					return;
				}

				const filePromises = [];

				for ( const fileHandle of launchParams.files ) {

					console.log( 'file', fileHandle.name );
					filePromises.push( fileHandle.getFile() );

				}

				Promise.all( filePromises)
					.then( files => viewer.loadCaves( files ) )
					.catch( console.warn( 'error opening files' ) );

			} );

		}

	}

}

export { OSFilePlugin };