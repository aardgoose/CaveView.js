import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';

import { glconstants, glsl, glslThree } from './rollup-gl';

let graph = require( 'rollup-plugin-graph' );

export default [
	{
		input: 'src/js/CV2Plugins.js',
		output: [
			{
				name: 'CV2Plugins',
				file: 'build/CaveView/js/CaveView2Plugins.js',
				format: 'umd'
			},
			{
				name: 'CV2Plugins',
				file: 'build/CaveView/js/CaveView2Plugins.min.js',
				format: 'umd',
			}
		],
		plugins: [
			glsl(),
			glslThree(),
			glconstants(),
			json( {
				exclude: [ 'node_modules/**', 'build/**', 'tools/**' ],
				preferConst: true, // Default: false
			} ),
			nodeResolve( {} ),
			commonjs( {
				sourceMap: false,  // Default: true
			} ),
			graph()
		]
	}
];