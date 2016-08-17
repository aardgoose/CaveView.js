import * as fs from 'fs';

export default {
	entry: 'src/js/workers/tileWorker.js',
	dest: 'build/CaveView/js/workers/tileWorker.js',
	format: 'umd',
	banner: 'importScripts( "../../lib/three.js" );'
};
