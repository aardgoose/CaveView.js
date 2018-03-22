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

		nodeResolve({
			jsnext: true,
			main: true
		}),

		commonjs({
			// non-CommonJS modules will be ignored, but you can also
			// specifically include/exclude files
			include: 'node_modules/**',  // Default: undefined
			//exclude: [ 'node_modules/foo/**', 'node_modules/bar/**' ],  // Default: undefined
			// these values can also be regular expressions
			// include: /node_modules/

			// if false then skip sourceMap generation for CommonJS modules
			sourceMap: false,  // Default: true

			// explicitly specify unresolvable named exports
			// (see below for more details)
			//namedExports: { './node_modules/alpha-shape/alpha.js': [ 'alphaShape' ] },  // Default: undefined

		})
	]
};

