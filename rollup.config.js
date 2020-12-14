import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';

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
		postcss({
			extract: 'build/CaveView/css/caveview.css'
		}),
		glsl(),
		glslThree(),
		json({
			exclude: [ 'node_modules/**', 'build/**', 'tools/**' ],
			// for tree-shaking, properties will be declared as
			// variables, using either `var` or `const`
			preferConst: true, // Default: false
		}),
		nodeResolve({}),
		commonjs({
			sourceMap: false,  // Default: true
		})
	]
};

