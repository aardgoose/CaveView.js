import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import { babel } from '@rollup/plugin-babel';
import { glconstants, glslThree, glsl } from './rollup-gl';

export default [
	{
		input: 'src/js/CV2.js',
		output: [
			{
				name: 'CV2',
				file: 'build/CaveView/js/CaveView2.babel.js',
				format: 'umd'
			},
			{
				name: 'CV2',
				file: 'build/CaveView/js/CaveView2.babel.min.js',
				format: 'umd',
				plugins: [ terser() ]
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
			babel( { babelHelpers: 'runtime' } )
		]
	}, {
		input: 'src/js/workers/webTileWorker.js',
		output: [ {
			file: 'build/CaveView/js/workers/webTileWorker.babel.js',
			format: 'umd',
			name: 'webTileWorker',
		},
		{
			file: 'build/CaveView/js/workers/webTileWorker.babel.min.js',
			format: 'umd',
			name: 'webTileWorker',
			plugins: [ terser() ]
		} ],
		plugins: [
			nodeResolve( {} )
		]

	}, {
		input: 'src/js/workers/webMeshWorker.js',
		output: [
			{
				file: 'build/CaveView/js/workers/webMeshWorker.babel.js',
				format: 'umd',
				name: 'webMeshWorker'
			}, {
				file: 'build/CaveView/js/workers/webMeshWorker.babel.min.js',
				format: 'umd',
				name: 'webMeshWorker',
				plugins: [ terser() ]
			}
		],
		plugins: [
			nodeResolve( {} ),
			commonjs( {
				include: 'node_modules/**',  // Default: undefined
				sourceMap: false,  // Default: true
			} )
		]
	}, {
		input: 'src/js/workers/gltfWorker.js',
		output: [
			{
				file: 'build/CaveView/js/workers/.babel.js',
				name: 'gltfWorker',
				format: 'umd'
			}, {
				file: 'build/CaveView/js/workers/gltfWorker.babel.min.js',
				name: 'gltfWorker',
				format: 'umd',
				plugins: [ terser() ]
			}
		],
		plugins: [
			nodeResolve( {} )
		]
	}
];