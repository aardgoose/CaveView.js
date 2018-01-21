
import { lang_en } from './default-lang';

x18n.register( 'en', lang_en );
x18n.set( 'en' );

const t = x18n.t;

console.log( t( 'settings.visibility.hud' ) );

function Page( id, x18nPrefix, onTop, onLeave ) {

	const tab  = document.createElement( 'div' );
	const page = document.createElement( 'div' );

	var frame = Page.frame;
	var tabBox = Page.tabBox;

	page.classList.add( 'page' );

	tab.id = id;
	tab.classList.add( 'tab' );

	tab.addEventListener( 'click', this.tabHandleClick );

	if ( onTop !== undefined ) {

		// callback when this page is made visible
		tab.addEventListener( 'click', onTop );

	}

	if ( frame === null ) {

		// create UI side panel and reveal tabs
		frame = document.createElement( 'div' );

		frame.id = 'cv-frame';

		Page.frame = frame;

	}

	if ( tabBox === null ) {

		// create UI box to contain tabs - reorients for small screen widths
		tabBox = document.createElement( 'div' );

		tabBox.id = 'cv-tab-box';

		const close = document.createElement( 'div' );

		close.id = 'close';
		close.classList.add( 'tab' );

		close.addEventListener( 'click', _closeFrame );

		tabBox.appendChild( close );

		Page.tabBox = tabBox;

	}

	tabBox.appendChild( tab );
	frame.appendChild( page );

	Page.pages.push( { tab: tab, page: page, owner: this } );

	this.page = page;
	this.onLeave = onLeave;
	this.slide = undefined;
	this.x18nPrefix = x18nPrefix + '.';

	function _closeFrame ( /* event */ ) {

		Page.tabBox.classList.remove( 'onscreen' );
		Page.frame.classList.remove( 'onscreen' );

	}

}

Page.pages     = [];
Page.listeners = [];
Page.inHandler = false;
Page.controls  = [];
Page.frame = null;
Page.tabBox = null;
Page.seq = 0;

Page.setParent = function ( parent ) {

	parent.appendChild( Page.tabBox );
	parent.appendChild( Page.frame );

};

Page.clear = function () {

	const frame  = Page.frame;
	const tabBox = Page.tabBox;

	if ( frame  !== null ) frame.parentElement.removeChild( frame );
	if ( tabBox !== null ) tabBox.parentElement.removeChild( tabBox );

	var i, l;

	for ( i = 0, l = Page.listeners.length; i < l; i++ ) {

		const listener = Page.listeners[ i ];

		listener.obj.removeEventListener( listener.name, listener.handler );

	}

	Page.listeners = [];
	Page.pages     = [];
	Page.inHandler = false;
	Page.controls  = [];
	Page.frame     = null;
	Page.tabBox    = null;

};

Page.addTopButton= function ( id, handler ) {

	const tabBox = this.tabBox;
	const fullscreen = document.createElement( 'div' );

	fullscreen.id = id;
	fullscreen.classList.add( 'tab' );
	fullscreen.classList.add( 'collapse' );

	fullscreen.addEventListener( 'click', handler );

	tabBox.appendChild( fullscreen );

	return fullscreen;

};

Page.addListener = function ( obj, name, handler ) {

	obj.addEventListener( name, handler );

	Page.listeners.push( {
		obj: obj,
		name: name,
		handler: handler
	} );

};

Page.handleChange = function ( event ) {

	const obj = event.target;
	const property = event.name;

	if ( ! Page.inHandle ) {

		if ( Page.controls[ property ] ) {

			const ctrl = Page.controls[ property ];

			switch ( ctrl.type ) {

			case 'checkbox':

				ctrl.checked = obj[ property ];

				break;

			case 'select-one':
			case 'range':

				ctrl.value = obj[ property ];

				break;

			case 'download':

				ctrl.href = obj[ property ];

				break;

			}

		}

	}

};

Page.prototype.constructor = Page;

Page.prototype.i18n = function ( text ) {

	const tr = x18n.t( this.x18nPrefix + text );

	return ( tr === undefined ) ? text : tr;

};

Page.prototype.addListener = function ( obj, name, handler ) {

	Page.addListener( obj, name, handler ); // redirect to :: method - allows later rework to page specific destruction

};

Page.prototype.tabHandleClick = function ( event ) {

	const tab = event.target;
	const pages = Page.pages;

	tab.classList.add( 'toptab' );
	Page.tabBox.classList.add( 'onscreen' );
	Page.frame.classList.add( 'onscreen' );

	var i, l;

	for ( i = 0, l = pages.length; i < l; i++ ) {

		const otherTab  = pages[ i ].tab;
		const otherPage = pages[ i ].page;
		const owner     = pages[ i ].owner;

		if ( otherTab === tab ) {

			otherPage.style.display = 'block';

		} else {

			otherPage.style.display = 'none';

			if ( otherTab.classList.contains( 'toptab' ) ) {

				otherTab.classList.remove( 'toptab' );

				if ( owner.onLeave !== undefined ) owner.onLeave();

			}

		}

	}

};

Page.prototype.appendChild = function ( domElement ) {

	this.page.appendChild( domElement );

};

Page.prototype.addHeader = function ( text ) {

	const div = document.createElement( 'div' );

	div.classList.add( 'header' );
	div.textContent = this.i18n( text );

	this.page.appendChild( div );

	return div;

};

Page.prototype.addText = function ( text ) {

	const p = document.createElement( 'p' );

	p.textContent = text;
	this.page.appendChild( p );

	return p;

};

Page.prototype.addLink = function ( url, text ) {

	const a = document.createElement( 'a' );

	a.href = url;
	a.textContent = text;
	a.target = '_blank';

	this.page.appendChild( a );

	return a;

};

Page.prototype.addSelect = function ( title, obj, trgObj, property, replace ) {

	const div    = document.createElement( 'div' );
	const label  = document.createElement( 'label' );
	const select = document.createElement( 'select' );


	div.classList.add( 'control' );

	if ( obj instanceof Array ) {

		for ( var i = 0, l = obj.length; i < l; i++ ) {

			const opt = document.createElement( 'option' );

			opt.value = obj[ i ];
			opt.text  = obj[ i ];

			if ( opt.text === trgObj[ property ] ) opt.selected = true;

			select.add( opt, null );

		}

	} else {

		for ( var p in obj ) {

			const opt = document.createElement( 'option' );

			opt.text  = this.i18n( p );
			opt.value = obj[ p ];

			if ( opt.value == trgObj[ property ] ) opt.selected = true;

			select.add( opt, null );

		}

	}

	this.addListener( select, 'change', function ( event ) { Page.inHandler = true; trgObj[ property ] = event.target.value; Page.inHandler = false; } );

	label.textContent = this.i18n( title );

	Page.controls[ property ] = select;

	div.appendChild( label );
	div.appendChild( select );

	if ( replace === undefined ) {

		this.page.appendChild( div );

	} else {

		this.page.replaceChild( div, replace );

	}

	return div;

};

Page.prototype.addCheckbox = function ( title, obj, property ) {

	const label = document.createElement( 'label' );
	const cb    = document.createElement( 'input' );
	const div   = document.createElement( 'div' );

	const id = 'cv-' + Page.seq++;

	div.classList.add( 'cv-checkbox' );

	cb.type    = 'checkbox';
	cb.checked = obj[ property ];
	cb.id = id;

	label.textContent = this.i18n( title );
	label.htmlFor = id;

	this.addListener( cb, 'change', _checkboxChanged );

	Page.controls[ property ] = cb;
	div.appendChild( cb );
	div.appendChild( label );

	this.page.appendChild( div );

	return div;

	function _checkboxChanged ( event ) {

		Page.inHandler = true;

		obj[ property ] = event.target.checked;

		Page.inHandler = false;

	}

};

Page.prototype.addRange = function ( title, obj, property ) {

	const div = document.createElement( 'div' );
	const label = document.createElement( 'label' );
	const range = document.createElement( 'input' );

	div.classList.add( 'control' );

	range.type = 'range';

	range.min = 0;
	range.max = 1;

	range.step = 0.05;
	range.value = obj[ property ];

	this.addListener( range, 'input', _rangeChanged );
	this.addListener( range, 'change', _rangeChanged ); // for IE11 support

	label.textContent = this.i18n( title );

	Page.controls[ property ] = range;

	div.appendChild( label );
	div.appendChild( range );

	this.page.appendChild( div );

	return div;

	function _rangeChanged ( event ) {

		Page.inHandler = true;

		obj[ property ] = event.target.value;

		Page.inHandler = false;

	}

};

Page.prototype.addSlide = function ( domElement, depth, handleClick ) {

	const slide = document.createElement( 'div' );

	slide.classList.add( 'slide' );
	slide.style.zIndex = 200 - depth;

	slide.addEventListener( 'click', handleClick );
	slide.appendChild( domElement );

	this.page.appendChild( slide );

	this.slide = slide;
	this.slideDepth = depth;

	return slide;

};

Page.prototype.replaceSlide = function ( domElement, depth, handleClick ) {

	const newSlide = document.createElement( 'div' );
	const oldSlide = this.slide;
	const page = this.page;

	var redraw; // eslint-disable-line no-unused-vars

	newSlide.classList.add( 'slide' );
	newSlide.style.zIndex = 200 - depth;
	newSlide.addEventListener( 'click', handleClick );

	if ( depth < this.slideDepth ) {

		newSlide.classList.add( 'slide-out' );

	}

	newSlide.appendChild( domElement );

	page.appendChild( newSlide );

	if ( depth > this.slideDepth ) {

		oldSlide.addEventListener( 'transitionend', afterSlideOut );
		oldSlide.classList.add( 'slide-out' );

		redraw = oldSlide.clientHeight;

	} else if ( depth < this.slideDepth ) {

		newSlide.addEventListener( 'transitionend', afterSlideIn );

		redraw = newSlide.clientHeight;

		newSlide.classList.remove( 'slide-out' );

	} else {

		page.removeChild( oldSlide );

	}

	this.slide = newSlide;
	this.slideDepth = depth;

	return;

	function afterSlideOut () {

		oldSlide.removeEventListener( 'transitionend', afterSlideOut );
		page.removeChild( oldSlide );

	}

	function afterSlideIn () {

		page.removeChild( oldSlide );
		newSlide.removeEventListener( 'transitionend', afterSlideIn );

	}

};

Page.prototype.addButton = function ( title, func ) {

	const button = document.createElement( 'button' );

	button.type = 'button';
	button.textContent = this.i18n( title );

	this.addListener( button, 'click', func );

	this.page.appendChild( button );

	return button;

};


Page.prototype.addTextBox = function ( labelText, placeholder, getResultGetter ) {

	const div = document.createElement( 'div' );
	const label = document.createElement( 'label' );

	label.textContent = this.i18n( labelText );

	const input = document.createElement( 'input' );

	var value;

	input.type = 'text';
	input.placeholder = placeholder;

	div.appendChild( label );
	div.appendChild( input );

	this.page.appendChild( div );

	this.addListener( input, 'change', function ( e ) { value = e.target.value; return true; } ) ;

	getResultGetter( _result );

	return div;

	function _result() {

		input.value = '';
		return value;

	}

};

Page.prototype.addDownloadButton = function ( title, urlProvider, fileName ) {

	const a = document.createElement( 'a' );

	if ( typeof a.download === 'undefined' ) return null;

	this.addListener( a, 'click', _setHref );

	a.textContent = this.i18n( title );
	a.type = 'download';
	a.download = fileName;
	a.href = 'javascript:void();';

	a.classList.add( 'download' );

	this.page.appendChild( a );

	return a;

	function _setHref() {

		a.href = urlProvider();

	}

};

export { Page };

// EOF