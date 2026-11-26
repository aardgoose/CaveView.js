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

		// what this configuration has subscribed to the catalogue with - see dispose()
		this.languageListener = null;

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

		if ( this.languageListener === null ) {

			this.languageListener = function () {

				// the catalogue may report a change a moment after it was made, by which
				// time the viewer this configuration belongs to may have been disposed

				if ( self.languageListener !== null ) self.dispatchEvent( { type: 'change', name: 'language' } );

			};

			x18n.on( [ 'lang:change' ], this.languageListener );

		}

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

	// the catalogue is shared by every viewer of the page and outlives each of them: a
	// configuration left subscribed to it would go on telling the user interface of a
	// disposed viewer to rebuild itself, at every change of language any other viewer made,
	// and would keep that viewer from ever being collected

	dispose () {

		if ( this.languageListener === null ) return;

		x18n.off( [ 'lang:change' ], this.languageListener );

		this.languageListener = null;

	}

	value ( item, defaultValue ) {

		if ( this.environment.has( item ) ) {

			return this.environment.get( item );

		} else {

			return defaultValue;

		}

	}

	setValue ( item, value ) {

		this.environment.set( item, value );

	}

	setPropertyValue ( item, defaultValue ) {

		// set to defined value or default
		this.environment.set( item, this.value( item, defaultValue ) );

		Object.defineProperty( this, item, {

			set( value ) {

				this.environment.set( item, value );
				this.dispatchEvent( { type: 'change', name: item } );

			},
			get() {
				return this.environment.get( item ); }
		} );

	}

	themeValue ( name, defaultValue = undefined ) {

		const theme = this.environment.get( 'theme' );
		const parts = name.split( '.' );

		let value;

		if ( theme !== undefined ) {

			value = this.treeValue( theme, parts );

		}

		if ( value === undefined ) {

			value = this.treeValue( defaultTheme, parts );

		}

		return value || defaultValue;

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

		const ls = window.localStorage;

		this.themeColors.forEach( ( colour, name ) => ls.removeItem( `cv-color:${name}` ) );
		this.themeColors.clear();

		this.dispatchEvent( { type: 'colors', name: 'all' } );

	}

}

if ( document.currentScript !== undefined ) {

	Cfg.home = document.currentScript.src.match( /^(.*\/)js\// )[ 1 ];

}

export { Cfg };