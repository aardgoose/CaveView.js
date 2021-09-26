import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

function glslStrip ( code ) {

	return JSON.stringify(
		code
			.trim()
			.replace( /[\r]/g, '' )
			.replace( /[ \t]*\/\/.*\n/g, '' ) // remove //
			.replace( /[ \t]*\/\*[\s\S]*?\*\//g, '' ) // remove /* */
			.replace( /\n{2,}/g, '\n' ) // # \n+ to \n
	);

}

function glsl () {
	return {
		transform ( code, id ) {
			if ( !/\.glsl$/.test( id ) ) return;
			return 'export default ' + glslStrip( code )  + ';';
		}
	};
}

function glslThree() {

	return {

		transform( code, id ) {

			if ( /\.glsl.js$/.test( id ) === false ) return;

			code = code.replace( /\/\* glsl \*\/\`(.*?)\`/sg, function ( match, p1 ) {

				return glslStrip( p1 );

			} );

			return {
				code: code,
				map: { mappings: '' }
			};

		}

	};

}

export default [
	{
		input: 'src/js/CV.js',
		output: [
			{
				name: 'CV',
				file: 'build/CaveView/js/CaveView.js',
				format: 'umd'
			},
			{
				name: 'CV',
				file: 'build/CaveView/js/CaveView.min.js',
				format: 'umd',
				plugins: [ terser() ]
			}
		],
		plugins: [
			glsl(),
			glslThree(),
			json( {
				exclude: [ 'node_modules/**', 'build/**', 'tools/**' ],
				preferConst: true, // Default: false
			} ),
			nodeResolve( {} ),
			commonjs( {
				sourceMap: false,  // Default: true
			} )
		]
	}
];