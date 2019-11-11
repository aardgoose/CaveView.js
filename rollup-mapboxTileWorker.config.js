import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';

export default {
	treeshake: true,
	input: 'src/js/workers/mapboxTileWorker.js',
	output: {
		file: 'build/CaveView/js/workers/mapboxTileWorker.js',
		format: 'umd'
	},
	plugins: [
		json({
			// All JSON files will be parsed by default,
			// but you can also specifically include/exclude files
			include: [ 'node_modules/**', 'src/js/**' ],
			exclude: [ 'node_modules/foo/**', 'node_modules/bar/**' ],

			// for tree-shaking, properties will be declared as
			// variables, using either `var` or `const`
			preferConst: true, // Default: false

			// specify indentation for the generated default export —
			// defaults to '\t'
			indent: '  '
		}),
		nodeResolve( {} ),

		commonjs({
			// non-CommonJS modules will be ignored, but you can also
			// specifically include/exclude files
			include: 'node_modules/**',  // Default: undefined

			// search for files other than .js files (must already
			// be transpiled by a previous plugin!)
			extensions: [ '.js' ],  // Default: [ '.js' ]
			// if true then uses of `global` won't be dealt with by this plugin
			ignoreGlobal: false,  // Default: false
			// if false then skip sourceMap generation for CommonJS modules
			sourceMap: false,  // Default: true,
			namedExports: {
				'node_modules/utf8/utf8.js': [ 'decode', 'encode' ]
			}
		})

	]
};
