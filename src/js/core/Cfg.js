
import { Color, FileLoader, EventDispatcher, MathUtils } from '../Three';
import x18n from 'x18n';
import lang_en from './defaultLanguage.json';
import { defaultTheme } from './defaultTheme';

// setup default language

x18n.register( 'en', lang_en );
x18n.set( 'en' );

function Cfg ( envs ) {

	this.environment = new Map();
	this.themeColors = new Map();
	this.i18n = x18n.t;

	if ( envs === undefined ) return;

	var pName;

	for ( pName in envs ) {

		this.environment.set ( pName , envs[ pName ] );

	}

	this.setLanguage( this.value( 'language', navigator.language.slice( 0, 2 ) ) );

}

Cfg.prototype = Object.create( EventDispatcher.prototype );

Cfg.prototype.setLanguage = function ( lang ) {

	if ( lang === 'en' ) {

		x18n.set( 'en' );

	} else {

		// attempt to register non-default language

		console.log( 'loading language file for:', lang );
		const loader = new FileLoader().setPath( this.value( 'home' ) + 'lib/' );

		loader.load( 'lang-' + lang + '.json', _languageLoaded, null, _languageError );

	}

	x18n.on( [ 'lang:change' ], function () { this.dispatchEvent( { type: 'change', name: 'language' } ); } );

	return;

	function _languageLoaded ( response ) {

		console.log( 'loaded language [' + lang + ']' );

		x18n.register( lang, JSON.parse( response ) );
		x18n.set( lang );

	}

	function _languageError () {

		console.log( 'error loading language file', lang );

	}

};

Cfg.prototype.value = function ( item, defaultValue ) {

	if ( this.environment.has( item ) ) {

		return this.environment.get( item );

	} else {

		return defaultValue;

	}

};

Cfg.prototype.themeValue = function ( name ) {

	const theme = this.environment.get( 'theme' );

	const parts = name.split( '.' );
	var value;

	if ( theme !== undefined ) {

		value = this.treeValue( theme, parts );

	}

	if ( value === undefined ) {

		value = this.treeValue( defaultTheme, parts);

	}

	return value;


};

Cfg.prototype.themeAngle = function ( name ) {

	return MathUtils.degToRad( this.themeValue ( name ) );

};

Cfg.prototype.treeValue = function ( theme, parts ) {

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

Cfg.prototype.themeColorCSS = function ( name ) {

	return this.themeColor( name ).getStyle();

};

Cfg.prototype.themeColor = function ( name ) {

	var color = this.themeColors.get( name );

	if ( color === undefined ) {

		color = new Color( this.themeValue( name ) );

		this.themeColors.set( name, color );

	}

	return color;

};


export { Cfg };

// EOF