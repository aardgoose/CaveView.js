
import { Color }  from '../../../../three.js/src/math/Color';
import { FileLoader, EventDispatcher } from '../../../../three.js/src/Three';

import { lang_en } from './default-lang';

var environment = new Map();
var themeColors = new Map();

var defaultTheme = {
	background: 0x000000,
	bezel: 0x888888,
	progress: 0x00ff00,
	scaleBar1: 0xffffff,
	scaleBar2: 0xff0000,
	compassTop1: 0xb03a14,
	compassTop2: 0x1ab4e5,
	compassBottom1: 0x581d0a,
	compassBottom2: 0x0c536a,
	ahiSky: 0x106f8d,
	ahiEarth: 0x802100,
	ahiBar: 0xffff00,
	ahiMarks: 0xffffff,
	boundingBox: 0x00ffff,
	single: 0xffffff,
	popupText: 0xffffff,
	popupBorder: 0xffffff,
	popupBackground: 0x222222,
	selectBox: 0x0000ff,
	highlightBox: 0xff0000
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

	var lang = Cfg.value( 'language' );

	if ( lang === undefined ) lang = navigator.language.split( '-' )[ 0 ];

	if ( lang === 'en' ) {

		x18n.set( 'en' );

	} else {

		// attempt to register non-default language

		console.log( 'loading language file for:', lang );
		const loader = new FileLoader().setPath( Cfg.value( 'home' ) + 'lib/' );

		loader.load( 'lang-' + lang + '.json', _languageLoaded, null, _languageError );

	}

	x18n.on( [ 'dict:change' ],function () { Cfg.dispatchEvent( { type: 'change', name: name } ); } );

	return;

	function _languageLoaded( response ) {

		console.log( 'loaded language', lang );

		x18n.register( lang, JSON.parse( response ) );
		x18n.set( lang );

	}

	function _languageError() {

		console.log( 'error loading language file' );

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

	var theme = environment.get( 'theme' );

	return ( theme !== undefined && theme[ name ] !== undefined ) ? theme[ name ] : defaultTheme[ name ];

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