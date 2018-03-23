import { Cfg } from './lib';

function WorkerPool ( script ) {

	this.script = Cfg.value( 'home', '' ) + 'js/workers/' + script;

	if ( WorkerPool.workers[ script ] === undefined ) {

		// no existing workers running
		WorkerPool.workers[ script ] = [];

	}

	this.workers = WorkerPool.workers[ script ];

}

WorkerPool.workers = {};
WorkerPool.activeWorkers = new Set();

WorkerPool.terminateActive = function () {

	const activeWorkers = WorkerPool.activeWorkers;

	activeWorkers.forEach( function ( worker ) { worker.terminate(); } );

	activeWorkers.clear();

};

WorkerPool.prototype.getWorker = function () {

	if ( this.workers.length === 0 ) {

		const worker = new Worker( this.script );

		WorkerPool.activeWorkers.add( worker );

		return worker;

	} else {

		return this.workers.pop();

	}

};

WorkerPool.prototype.putWorker = function ( worker ) {

	WorkerPool.activeWorkers.delete( worker );

	if ( this.workers.length <  4 ) {

		this.workers.push( worker );

	} else {

		worker.terminate();

	}

};

WorkerPool.prototype.dispose = function () {

	for ( var i = 0; i < this.workers.length; i++ ) {

		this.workers[ i ].terminate();

	}

};

export { WorkerPool };
