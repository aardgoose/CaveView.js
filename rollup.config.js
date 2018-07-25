import json from 'rollup-plugin-json';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

function glsl () {
	return {
		transform ( code, id ) {
			if ( !/\.glsl$/.test( id ) ) return;

			return 'export default ' + JSON.stringify(
				code
					.replace( /[ \t]*\/\/.*\n/g, '' )
					.replace( /[ \t]*\/\*[\s\S]*?\*\//g, '' )
					.replace( /\n{2,}/g, '\n' )
			) + ';';
		}
	};
}

export default {
	input: 'src/js/CV.js',
	output: {
		name: 'CV',
		file: 'build/CaveView/js/CaveView.js',
		format: 'umd'
	},
	plugins: [
		glsl(),
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
		nodeResolve({
			jsnext: true,
			main: true
		}),
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
			sourceMap: false,  // Default: true
		})
	]
};

