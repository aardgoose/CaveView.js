import { Color, FileLoader, EventDispatcher, MathUtils } from '../Three';
import x18n from 'x18n';
import lang_en from './defaultLanguage.json';
import { defaultTheme } from './defaultTheme';

// setup default language

x18n.register( 'en', lang_en );
x18n.set( 'en' );

class Cfg extends EventDispatcher {

	constructor ( envs ) {

		super();

		this.environment = new Map();
		this.themeColors = new Map();
		this.i18n = x18n.t;

		if ( envs === undefined ) return;

		for ( const pName in envs ) {

			this.environment.set ( pName, envs[ pName ] );

		}

		if ( Cfg.home !== undefined ) this.environment.set( 'home', Cfg.home );

		this.setLanguage( this.value( 'language', navigator.language.slice( 0, 2 ) ) );

	}

	setLanguage ( lang ) {

		if ( lang === 'en' ) {

			x18n.set( 'en' );

		} else {

			// attempt to register non-default language

			console.log( 'loading language file for:', lang );

			const loader = new FileLoader().setPath( this.value( 'home' ) + 'lib/' );

			loader.load( 'lang-' + lang + '.json', _languageLoaded, null, _languageError );

		}

		const self = this;

		x18n.on( [ 'lang:change' ], function () { self.dispatchEvent( { type: 'change', name: 'language' } ); } );

		return;

		function _languageLoaded ( response ) {

			console.log( 'loaded language [' + lang + ']' );

			x18n.register( lang, JSON.parse( response ) );
			x18n.set( lang );

		}

		function _languageError () {

			console.log( 'error loading language file', lang );

		}

	}

	value ( item, defaultValue ) {

		if ( this.environment.has( item ) ) {

			return this.environment.get( item );

		} else {

			return defaultValue;

		}

	}

	setPropertyValue ( item, defaultValue ) {

		// set to defined value or default
		this.environment.set ( item, this.value( item, defaultValue ) );

		Object.defineProperty( this, item, {

			set: function ( value ) {

				this.environment.set ( item, value );
				this.dispatchEvent( { type: 'change', name: item } );

			},
			get: function () {
				return this.environment.get( item ); }
		} );

	}

	themeValue ( name ) {

		const theme = this.environment.get( 'theme' );
		const parts = name.split( '.' );

		let value;

		if ( theme !== undefined ) {

			value = this.treeValue( theme, parts );

		}

		if ( value === undefined ) {

			value = this.treeValue( defaultTheme, parts);

		}

		return value;

	}

	themeAngle ( name ) {

		return MathUtils.degToRad( this.themeValue ( name ) );

	}

	treeValue ( theme, parts ) {

		let top = theme;

		for ( let i = 0; i < parts.length; i++ ) {

			const part = parts[ i ];

			if ( top[ part ] === undefined ) return undefined;

			top = top[ part ];

		}

		return top;

	}

	themeColorCSS ( name ) {

		return this.themeColor( name ).getStyle();

	}

	themeColor ( name ) {

		let color = this.themeColors.get( name );

		if ( color === undefined ) {

			const savedColorName = window.localStorage.getItem( 'cv-color:' + name );

			color = new Color( savedColorName ? savedColorName : this.themeValue( name ) );
			this.themeColors.set( name, color );

		}

		return color;

	}

	themeColorHex ( name ) {

		return '#' + this.themeColor( name ).getHexString();

	}

	setThemeColorCSS ( name, color ) {

		const ls = window.localStorage;
		const c = new Color( color );

		this.themeColors.set( name, c );
		ls.setItem( 'cv-color:' + name, '#' + c.getHexString() );

		this.dispatchEvent( { type: 'colors', name: name } );

	}

	resetColors () {

		this.themeColors.clear();
		window.localStorage.clear();

		this.dispatchEvent( { type: 'colors', name: 'all' } );

	}

}

if ( document.currentScript !== undefined ) {

	Cfg.home = document.currentScript.src.match( /^(.*\/)js\// )[ 1 ];

}

export { Cfg };