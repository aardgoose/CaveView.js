class WorkerLoader {

	constructor ( file, script ) {

		this.file = file;
		this.worker = new Worker( script );

	}

	load ( loadingContext, progress, surveyDataCollector ) {

		const worker = this.worker;

		return new Promise( ( resolve, reject ) => {

			worker.onmessage = event => {

				const data = event.data;

				switch ( data.status ) {

				case 'progress':

					progress( data );
					return;

				case 'ok':

					surveyDataCollector.limits.union( data.boundingBox );
					surveyDataCollector.models.push( data );

					resolve();
					break;

				case 'error':

					reject( data.message );
					break;

				}

				worker.terminate();
				this.worker = null;

			}

			worker.postMessage( { file: this.file, loadingContext: loadingContext } );

		} );

	}

	abort () {

		if ( this.worker !== null ) this.worker.postMessage( { action: 'abort' } );

	}

}

export { WorkerLoader };