import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';

export default {
	treeshake: true,
	input: 'src/js/workers/webMeshWorker.js',
	output: {
		file: 'build/CaveView/js/workers/webMeshWorker.js',
		format: 'umd'
	},
	plugins: [
		nodeResolve({
			jsnext: true,
			main: true
		}),
		commonjs({
			include: 'node_modules/**',  // Default: undefined
			sourceMap: false,  // Default: true
		}),
		json({
			// All JSON files will be parsed by default,
			// but you can also specifically include/exclude files
			include: 'node_modules/**',
			exclude: [ 'node_modules/foo/**', 'node_modules/bar/**' ],

			// for tree-shaking, properties will be declared as
			// variables, using either `var` or `const`
			preferConst: true, // Default: false

			// specify indentation for the generated default export —
			// defaults to '\t'
			indent: '  '
		})
	]
};
