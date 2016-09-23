import { getEnvironmentValue } from '../core/constants.js';

function WorkerPool ( script ) {

	this.script = getEnvironmentValue( "home", "" ) + "js/workers/" + script;
	this.workers = [];

}

WorkerPool.prototype.constructor = WorkerPool;

WorkerPool.prototype.getWorker = function () {

	if ( this.workers.length === 0 ) {

		return new Worker( this.script );

	} else {

		return this.workers.pop();

	}

}

WorkerPool.prototype.putWorker = function ( worker ) {

	if ( this.workers.length <  4 ) {

		this.workers.push( worker );

	} else {

		worker.terminate();

	}

}

WorkerPool.prototype.dispose = function () {

	for ( var i = 0; i < this.workers.length; i++ ) {

		this.workers[ i ].terminate();

	}

}

export { WorkerPool };
