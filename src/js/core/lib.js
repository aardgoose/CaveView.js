
import { Color, FileLoader, EventDispatcher, Math as _Math } from '../Three';
import x18n from 'x18n';
import lang_en from './defaultLanguage.json';
import { defaultTheme } from './defaultTheme';

const environment = new Map();
const themeColors = new Map();

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

	x18n.on( [ 'lang:change' ], function () { Cfg.dispatchEvent( { type: 'change', name: 'language' } ); } );

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

Cfg.themeAngle = function getThemeAngle ( name ) {

	return _Math.degToRad( Cfg.themeValue ( name ) );

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

	return Cfg.themeColor( name ).getStyle();

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