class WorkerLoader {

	constructor( file, script ) {

		this.file = file;
		this.script = script;

	}

	load ( loadingContext, progress, model ) {

		const worker = new Worker( this.script );

		return new Promise( ( resolve, reject ) => {

			worker.onmessage = event => {

				const data = event.data;

				if ( data.status == 'progress' ) {

					progress( data );
					return;

				}

				model.limits.copy( data.boundingBox );
				model.models.push( data );

				resolve( data.status == 'ok' )

				worker.terminate();

			}

			worker.postMessage( { file: this.file, loadingContext: loadingContext } );

		} );

	}

}

export { WorkerLoader };