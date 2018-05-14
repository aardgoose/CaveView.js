
export default {
	treeshake: true,
	input: 'src/js/workers/webMeshWorker.js',
	output: {
		file: 'build/CaveView/js/workers/webMeshWorker.js',
		format: 'umd'
	}
};
