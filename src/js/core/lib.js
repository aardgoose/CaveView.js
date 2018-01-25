
import { Color }  from '../../../../three.js/src/math/Color';
import { FileLoader, EventDispatcher } from '../../../../three.js/src/Three';
import { x18n } from './x18n';
import { lang_en } from './default-lang';

var environment = new Map();
var themeColors = new Map();

var defaultTheme = {
	background: 0x000000,
	hud: {
		progress: 0x00ff00,
		bezel: 0x888888,
		scale: {
			bar1: 0xffffff,
			bar2: 0xff0000,
		},
		compass: {
			top1: 0xb03a14,
			top2: 0x1ab4e5,
			bottom1: 0x581d0a,
			bottom2: 0x0c536a
		},
		ahi: {
			sky: 0x106f8d,
			earth: 0x802100,
			bar: 0xffff00,
			marks: 0xffffff
		},
	},
	box: {
		bounding: 0xffffff,
		select: 0x0000ff,
		highlight: 0xff0000
	},
	shading: {
		single: 0xffffff
	},
	popup: {
		text: 0xffffff,
		border: 0xffffff,
		background: 0x222222
	}
};

// setup default language

x18n.register( 'en', lang_en );
x18n.set( 'en' );

const Cfg = Object.create( EventDispatcher.prototype );

Cfg.i18n = x18n.t;

Cfg.set = function setConfig ( envs ) {

	if ( envs === undefined ) return;

	var pName;

	for ( pName in envs ) {

		environment.set ( pName , envs[ pName ] );

	}

	Cfg.setLanguage( Cfg.value( 'language', navigator.language.slice( 0, 2 ) ) );

};

Cfg.setLanguage = function ( lang ) {

	if ( lang === 'en' ) {

		x18n.set( 'en' );

	} else {

		// attempt to register non-default language

		console.log( 'loading language file for:', lang );
		const loader = new FileLoader().setPath( Cfg.value( 'home' ) + 'lib/' );

		loader.load( 'lang-' + lang + '.json', _languageLoaded, null, _languageError );

	}

	x18n.on( [ 'lang:change' ], function () { Cfg.dispatchEvent( { type: 'change', name: name } ); } );

	return;

	function _languageLoaded( response ) {

		console.log( 'loaded language [' + lang + ']' );

		x18n.register( lang, JSON.parse( response ) );
		x18n.set( lang );

	}

	function _languageError() {

		console.log( 'error loading language file', lang );

	}

};

Cfg.value = function getValue ( item, defaultValue ) {

	if ( environment.has( item ) ) {

		return environment.get( item );

	} else {

		return defaultValue;

	}

};

Cfg.themeValue = function getThemeValue ( name ) {

	const theme = environment.get( 'theme' );

	const parts = name.split( '.' );
	var value;

	if ( theme !== undefined ) {

		value = Cfg.treeValue( theme, parts );

	}

	if ( value === undefined ) {

		value = Cfg.treeValue( defaultTheme, parts);

	}

	return value;


};

Cfg.treeValue = function ( theme, parts ) {

	var i;
	var top = theme;
	var part;

	for ( i = 0; i < parts.length; i++ ) {

		part = parts[ i ];

		if ( top[ part ] === undefined ) return undefined;

		top = top[ part ];

	}

	return top;

};

Cfg.themeColorCSS = function getThemeColorCSS ( name ) {

	var color = '#' + Cfg.themeValue( name ).toString( 16 ).padStart( 6, '0' );

	return color;

};

Cfg.themeColor = function getThemeColor ( name ) {

	var color = themeColors.get( name );

	if ( color === undefined ) {

		color = new Color( Cfg.themeValue( name ) );

		themeColors.set( name, color );

	}

	return color;

};

function replaceExtension( fileName, newExtention ) {

	return fileName.split( '.' ).shift() + '.' + newExtention;

}

export { Cfg, replaceExtension };

// EOF