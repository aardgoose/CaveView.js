function WorkerPool ( script ) {

	this.script = script;
	this.workers = [];
	this.activeWorkers = new Set();

}

const cpuCount = window.navigator.hardwareConcurrency;

WorkerPool.maxActive = cpuCount === undefined ? 4 : cpuCount;

WorkerPool.pendingWork = [];
WorkerPool.activeWorkers = 0;

WorkerPool.prototype.terminateActive = function () {

	const activeWorkers = this.activeWorkers;

	activeWorkers.forEach( worker => worker.terminate() );
	activeWorkers.clear();

	// remove any pending work for this pool
	WorkerPool.pendingWork = WorkerPool.pendingWork.filter( p => p.pool != this );

};

WorkerPool.prototype.getWorker = function () {

	let worker;

	if ( this.workers.length === 0 ) {

		worker = new Worker( this.script );

	} else {

		worker = this.workers.pop();

	}

	this.activeWorkers.add( worker );

	worker.pool = this;

	return worker;

};

WorkerPool.prototype.putWorker = function ( worker ) {

	this.activeWorkers.delete( worker );

	if ( this.workers.length < 4 ) {

		this.workers.push( worker );

	} else {

		worker.terminate();

	}

	const pendingWork = WorkerPool.pendingWork;

	if ( pendingWork.length > 0 ) {

		const pending = pendingWork.shift();

		// resubmit to orginal pool

		pending.pool.queueWork( pending.message, pending.callback );

	}

};

WorkerPool.prototype.runWorker = function ( message, callback ) {

	WorkerPool.activeWorkers++;

	const worker = this.getWorker();

	worker.onmessage = e => {

		worker.pool.putWorker( worker );
		callback( e.data );

	};

	worker.postMessage( message );

	return worker;

};

WorkerPool.prototype.queueWork = function ( message, callback ) {

	if ( WorkerPool.activeWorkers === WorkerPool.maxActive ) {

		WorkerPool.pendingWork.push( { pool: this, message: message, callback: callback } );
		return;

	}

	this.runWorker( message, callback );

};

WorkerPool.prototype.dispose = function () {

	this.workers.forEach( worker => worker.terminate() );

	this.workers = null;
	this.activeWorkers = null;

};

class WorkerPoolCache {

	constructor ( cfg ) {

		const pools = new Map();

		this.getPool = function ( scriptFile ) {

			const script = cfg.value( 'home', '' ) + 'js/workers/' + scriptFile;

			let pool = pools.get( script );

			if ( pool === undefined ) {

				// no existing pool
				pool = new WorkerPool( script );
				pools.set( script, pool );

			}

			return pool;

		};

		this.terminateActive = function () {

			pools.forEach( pool => pool.terminateActive() );

		};

		this.dispose = function () {

			pools.forEach( pool => {

				pool.terminateActive();
				pool.dispose();

			} );

			pools.clear();

		};

	}

}

export { WorkerPool, WorkerPoolCache };