import * as fs from 'fs';

var outro = `
Object.defineProperty( exports, 'AudioContext', {
	get: function () {
		return exports.getAudioContext();
	}
});`;

var footer = "";

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
	entry: 'src/js/CV.js',
	dest: 'build/CaveView/js/CaveView.js',
	moduleName: 'CV',
	format: 'umd',
	plugins: [
		glsl()
	],

	outro: outro,
	footer: footer
};
