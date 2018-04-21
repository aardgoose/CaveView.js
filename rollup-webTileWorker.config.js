
export default {
	treeshake: true,
	input: 'src/js/workers/webTileWorker.js',
	output: {
		file: 'build/CaveView/js/workers/webTileWorker.js',
		format: 'umd'
	}
};
