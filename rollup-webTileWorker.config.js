import nodeResolve from 'rollup-plugin-node-resolve';

export default {
	treeshake: true,
	input: 'src/js/workers/webTileWorker.js',
	output: {
		file: 'build/CaveView/js/workers/webTileWorker.js',
		format: 'umd'
	},
	plugins: [
		nodeResolve({
			jsnext: true,
			main: true
		})
	]
};
