import { Cfg } from './lib';

function WorkerPool ( script ) {

	this.script = Cfg.value( 'home', '' ) + 'js/workers/' + script;

	if ( WorkerPool.workers[ script ] === undefined ) {

		// no existing workers running
		WorkerPool.workers[ script ] = [];

	}

	this.workers = WorkerPool.workers[ script ];

	const cpuCount = window.navigator.hardwareConcurrency;

	WorkerPool.maxActive = cpuCount === undefined ? 4 : cpuCount;

}

WorkerPool.workers = {};
WorkerPool.activeWorkers = new Set();
WorkerPool.pendingWork = [];

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

	if ( WorkerPool.pendingWork.length > 0 ) {

		const pending = WorkerPool.pendingWork.shift();

		// resubit to orginal pool

		pending.pool.queueWork( pending.message, pending.callback );

	}

};

WorkerPool.prototype.queueWork = function ( message, callback ) {

	if ( WorkerPool.activeWorkers.size === WorkerPool.maxActive ) {

		WorkerPool.pendingWork.push( { pool: this, message: message, callback: callback } );
		return;

	}

	const worker = this.getWorker();

	worker.onmessage = callback;

	worker.postMessage( message );

};

WorkerPool.prototype.dispose = function () {

	for ( var i = 0; i < this.workers.length; i++ ) {

		this.workers[ i ].terminate();

	}

};

export { WorkerPool };
