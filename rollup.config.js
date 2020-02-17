import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import less from 'rollup-plugin-less';

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

function glslThree() {

	return {

		transform( code, id ) {

			if ( /\.glsl.js$/.test( id ) === false ) return;

			code = code.replace( /\/\* glsl \*\/\`((.*|\n|\r\n)*)\`/, function ( match, p1 ) {

				return JSON.stringify(
					p1
						.trim()
						.replace( /\r/g, '' )
						.replace( /[ \t]*\/\/.*\n/g, '' ) // remove //
						.replace( /[ \t]*\/\*[\s\S]*?\*\//g, '' ) // remove /* */
						.replace( /\n{2,}/g, '\n' ) // # \n+ to \n
				);

			} );

			return {
				code: code,
				map: { mappings: '' }
			};

		}

	};

}

export default {
	input: 'src/js/CV2.js',
	output: {
		name: 'CV2',
		file: 'build/CaveView/js/CaveView2.js',
		format: 'umd'
	},
	plugins: [
		less( {
			include: 'src/css/*.less',
			output: 'build/CaveView/css/caveview.css'
		}),
		glsl(),
		glslThree(),
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
		nodeResolve({}),
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

