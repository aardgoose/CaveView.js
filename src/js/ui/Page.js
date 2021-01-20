
function Page ( id, x18nPrefix, onTop, onLeave ) {

	const tab  = document.createElement( 'div' );
	const page = document.createElement( 'div' );

	page.classList.add( 'page' );

	tab.classList.add( id );
	tab.classList.add( 'tab' );

	this.page = page;
	this.tab = tab;
	this.onTop = onTop;
	this.frame = null;
	this.onLeave = onLeave;
	this.slide = undefined;
	this.x18nPrefix = x18nPrefix + '.';
	this.onChange = null;
	this.id = id;

}

Page.prototype.constructor = Page;

Page.prototype.i18n = function ( text ) {

	const cfg = this.frame.ctx.cfg;
	const tr = cfg.i18n( this.x18nPrefix + text );

	return ( tr === undefined ) ? text : tr;

};

Page.prototype.addListener = function ( obj, name, handler ) {

	this.frame.addListener( obj, name, handler );
	// redirect to frame method - allows later rework to page specific destruction

};

Page.prototype.tabHandleClick = function ( event ) {

	event.preventDefault();
	event.stopPropagation();

	this.open();

};

Page.prototype.open = function () {

	const tab = this.tab;
	const pages = this.frame.pages;

	tab.classList.add( 'toptab' );

	this.frame.onScreen( this.i18n( 'title' ) );
	this.frame.openPageId = this.id;

	pages.forEach( function ( page ) {

		const otherPage = page.page;
		const otherTab = page.tab;
		const owner = page.owner;

		if ( otherTab === tab ) {

			otherPage.style.display = 'block';

		} else {

			otherPage.style.display = 'none';

			if ( otherTab.classList.contains( 'toptab' ) ) {

				otherTab.classList.remove( 'toptab' );

				if ( owner.onLeave !== undefined ) owner.onLeave();

			}

		}

	} );

};

Page.prototype.appendChild = function ( domElement ) {

	this.page.appendChild( domElement );

	return domElement;

};

Page.prototype.addHeader = function ( text ) {

	const div = document.createElement( 'div' );

	div.classList.add( 'header' );
	div.textContent = this.i18n( text );

	this.page.appendChild( div );

	return div;

};

Page.prototype.addCollapsingHeader = function ( text ) {

	const div = document.createElement( 'div' );

	div.classList.add( 'header' );
	div.textContent = this.i18n( text );
	div.classList.add( 'header_full' );

	this.page.appendChild( div );

	const container = document.createElement( 'div' );

	container.classList.add( 'container_full' );

	this.page.appendChild( container );

	div.addEventListener( 'click', function () {

		var redraw; // eslint-disable-line no-unused-vars

		if ( div.classList.contains( 'header_collapsed' ) ) {

			container.style.display = 'block';

			container.addEventListener( 'transitionend', _onReveal );

			redraw = container.clientHeight; // lgtm
			container.classList.remove( 'container_collapsed' );

		} else {

			container.addEventListener( 'transitionend', _onCollapse );

			container.classList.add( 'container_collapsed' );

		}

		function _onReveal () {

			container.removeEventListener( 'transitionend', _onReveal );

			div.classList.remove( 'header_collapsed' );

		}

		function _onCollapse () {

			container.removeEventListener( 'transitionend', _onCollapse );

			div.classList.add( 'header_collapsed' );
			container.style.display = 'none';

		}

	} );

	return container;

};

Page.prototype.addText = function ( text ) {

	const p = this.addLine( text );

	p.classList.add( 'spaced' );

	return p;

};

Page.prototype.addLine = function ( text ) {

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

		obj.forEach( function ( element ) {

			const opt = document.createElement( 'option' );

			opt.value = element;
			opt.text = element;

			if ( opt.text === trgObj[ property ] ) opt.selected = true;

			select.add( opt, null );

		} );

	} else {

		for ( var p in obj ) {

			const opt = document.createElement( 'option' );
			const self = this;

			// translate each space delimited substring of ui text
			opt.text = p.split( ' ' ).reduce( function ( res, val) { return res + ' ' + self.i18n( val ); }, '' ).trim();
			opt.value = obj[ p ];

			if ( opt.value == trgObj[ property ] ) opt.selected = true;

			select.add( opt, null );

		}

	}

	const frame = this.frame;

	this.addListener( select, 'change', function onChange ( event ) { frame.inHandler = true; trgObj[ property ] = event.target.value; frame.inHandler = false; } );

	label.textContent = this.i18n( title );
	label.classList.add( 'cv-select' );

	frame.controls[ property ] = select;

	div.appendChild( label );
	div.appendChild( select );

	if ( replace === undefined ) {

		this.page.appendChild( div );

	} else {

		this.page.replaceChild( div, replace );

	}

	return div;

};

Page.prototype.addFileSelect = function ( title, obj, trgObj, property ) {

	const frame = this.frame;
	const div = this.addSelect( title, obj, trgObj, property );

	const label = div.firstChild;
	const id = 'cv-' + frame.getSeq();

	label.for = id;
	label.classList.add( 'cv-file-label' );

	const input = document.createElement( 'input' );

	input.id = id;
	input.classList.add( 'cv-file' );
	input.type = 'file';
	input.accept = '.svx,.lox,.plt';
	input.multiple = true;

	this.addListener( input, 'change', function _handleFileChange () {

		const count = input.files.length;
		const files = [];

		if ( count > 0 ) {

			for ( var i = 0; i < count; i++ ) files.push( input.files[ i ] );

			trgObj[ property ] = files;

		}

	} );

	label.appendChild( input );

	return div;

};

Page.prototype.addCheckbox = function ( title, obj, property ) {

	const frame = this.frame;
	const label = document.createElement( 'label' );
	const cb    = document.createElement( 'input' );
	const div   = document.createElement( 'div' );

	const id = 'cv-' + frame.getSeq();

	div.classList.add( 'control' );

	cb.type = 'checkbox';
	cb.checked = obj[ property ];
	cb.id = id;

	label.textContent = this.i18n( title );
	label.htmlFor = id;
	label.classList.add( 'check' );

	this.addListener( cb, 'change', _checkboxChanged );

	frame.controls[ property ] = cb;

	div.appendChild( cb );
	div.appendChild( label );

	this.page.appendChild( div );

	return div;

	function _checkboxChanged ( event ) {

		frame.inHandler = true;

		obj[ property ] = event.target.checked;

		frame.inHandler = false;

	}

};

Page.prototype.addRange = function ( title, obj, property ) {

	const frame = this.frame;
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
	label.classList.add( 'cv-range' );

	frame.controls[ property ] = range;

	div.appendChild( label );
	div.appendChild( range );

	this.page.appendChild( div );

	return div;

	function _rangeChanged ( event ) {

		frame.inHandler = true;

		obj[ property ] = event.target.value;

		frame.inHandler = false;

	}

};

Page.prototype.addSlide = function ( domElement, depth ) {

	const slide = document.createElement( 'div' );

	slide.classList.add( 'slide' );
	slide.style.zIndex = 200 - depth;

	slide.appendChild( domElement );

	this.page.appendChild( slide );

	this.slide = slide;
	this.slideDepth = depth;

	return slide;

};

Page.prototype.replaceSlide = function ( domElement, depth ) {

	const newSlide = document.createElement( 'div' );
	const page = this.page;

	var oldSlide = this.slide;

	var redraw; // eslint-disable-line no-unused-vars

	newSlide.classList.add( 'slide' );
	newSlide.style.zIndex = 200 - depth;

	if ( depth < this.slideDepth ) {

		newSlide.classList.add( 'slide-out' );

	}

	newSlide.appendChild( domElement );

	page.appendChild( newSlide );

	if ( depth > this.slideDepth ) {

		oldSlide.addEventListener( 'transitionend', afterSlideOut );
		oldSlide.classList.add( 'slide-out' );

		redraw = oldSlide.clientHeight; // lgtm

	} else if ( depth < this.slideDepth ) {

		newSlide.addEventListener( 'transitionend', afterSlideIn );

		redraw = newSlide.clientHeight; // lgtm

		newSlide.classList.remove( 'slide-out' );

	} else {

		page.removeChild( oldSlide );

	}

	this.slide = newSlide;
	this.slideDepth = depth;

	return newSlide;

	function afterSlideOut () {

		oldSlide.removeEventListener( 'transitionend', afterSlideOut );
		page.removeChild( oldSlide );

		oldSlide = null;

	}

	function afterSlideIn () {

		page.removeChild( oldSlide );
		newSlide.removeEventListener( 'transitionend', afterSlideIn );

		oldSlide = null;

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

		a.href = urlProvider( a );

	}

};

Page.canDownload = function () {

	const a = document.createElement( 'a' );
	return ( typeof a.download !== 'undefined' );

};

Page.prototype.download = function ( data, fileName ) {

	const a = document.createElement( 'a' );

	if ( typeof a.download === 'undefined' ) return null;

	a.type = 'download';
	a.download = fileName;
	a.href = data;
	a.click();

};

Page.prototype.addLogo = function () {

	const img = document.createElement( 'div' );

	img.classList.add( 'logo' );
	img.title = 'logo';

	this.appendChild( img );

};

Page.prototype.dispose = function () {
	if ( this._dispose ) this._dispose();
};

export { Page };