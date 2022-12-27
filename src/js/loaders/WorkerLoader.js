class WorkerLoader {

	constructor ( file, script ) {

		this.file = file;
		this.worker = new Worker( script );

	}

	load ( loadingContext, progress, surveyData ) {

		const worker = this.worker;

		return new Promise( ( resolve, reject ) => {

			worker.onmessage = event => {

				const data = event.data;

				switch ( data.status ) {

				case 'progress':

					progress( data );
					return;

				case 'ok':

					surveyData.limits.copy( data.boundingBox ); // FIXME to integrate with surveys
					surveyData.models.push( data );

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