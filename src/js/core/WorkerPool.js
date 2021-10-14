const cpuCount = window.navigator.hardwareConcurrency;

class WorkerPool {

	static pendingWork = [];
	static activeWorkers = 0;
	static maxActive = cpuCount === undefined ? 4 : cpuCount;

	constructor ( script ) {

		this.script = script;
		this.workers = [];
		this.activeWorkers = new Set();

	}

	terminateActive () {

		const activeWorkers = this.activeWorkers;

		activeWorkers.forEach( worker => worker.terminate() );
		activeWorkers.clear();

		// remove any pending work for this pool
		WorkerPool.pendingWork = WorkerPool.pendingWork.filter( p => p.pool != this );

		// remove all the saved workers onmessage handlers to remove references to callbacks
		// which may enclose objects and prevent GC
		this.workers.forEach( w => { w.onmessage = null; } );

	}

	getWorker () {

		let worker;

		if ( this.workers.length === 0 ) {

			worker = new Worker( this.script );

		} else {

			worker = this.workers.pop();

		}

		this.activeWorkers.add( worker );

		worker.pool = this;

		return worker;

	}

	putWorker ( worker ) {

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

	}

	runWorker ( message, callback ) {

		WorkerPool.activeWorkers++;

		const worker = this.getWorker();

		worker.onmessage = e => {

			worker.pool.putWorker( worker );
			callback( e.data );

		};

		worker.postMessage( message );

		return worker;

	}

	queueWork ( message, callback ) {

		if ( WorkerPool.activeWorkers === WorkerPool.maxActive ) {

			WorkerPool.pendingWork.push( { pool: this, message: message, callback: callback } );
			return;

		}

		this.runWorker( message, callback );

	}

	dispose () {

		this.workers.forEach( worker => worker.terminate() );

		this.workers = null;
		this.activeWorkers = null;

	}

}


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