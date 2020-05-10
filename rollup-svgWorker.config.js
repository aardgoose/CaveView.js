import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';


export default {
	treeshake: true,
	input: 'src/js/workers/svgWorker.js',
	output: {
		file: 'build/CaveView/js/workers/svgWorker.js',
		format: 'umd'
	},
	plugins: [
		nodeResolve( {} ),
		commonjs({
			include: 'node_modules/**',  // Default: undefined
			sourceMap: false,  // Default: true
		}),
	]
};
