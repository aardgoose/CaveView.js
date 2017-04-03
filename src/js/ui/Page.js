

function Page( id ) {

	var tab  = document.createElement( 'div' );
	var page = document.createElement( 'div' );

	var frame = Page.frame;

	page.classList.add( 'page' );

	tab.id = id;
	tab.classList.add( 'tab' );
	tab.addEventListener( 'click', this.tabHandleClick );
	tab.style.top = ( Page.position++ * 40 ) + 'px';

	if ( frame === null ) {

		// create UI side panel and reveal tabs
		frame = document.createElement( 'div' );

		frame.id = 'frame';
		frame.style.display = 'block';

		Page.frame = frame;

		var close = document.createElement( 'div' );

		close.id = 'close';

		close.addEventListener( 'click', _closeFrame );

		frame.appendChild( close );

	}

	frame.appendChild( tab );
	frame.appendChild( page );

	Page.pages.push( { tab: tab, page: page } );

	this.page = page;
	this.slide = undefined;

	function _closeFrame ( event ) {

		event.target.parentElement.classList.remove( 'onscreen' );

	}

}

Page.pages     = [];
Page.position  = 0;
Page.inHandler = false;
Page.controls  = [];
Page.frame = null;

Page.reset = function () {

	Page.pages     = [];
	Page.position  = 0;
	Page.inHandler = false;
	Page.controls  = [];
	Page.frame     = null;

};

Page.clear = function () {

	Page.frame.addEventListener( 'transitionend', _afterReset );
	Page.frame.classList.remove( 'onscreen' );

	function _afterReset ( event ) {

		var frame = event.target;

		frame.removeEventListener( 'transitionend', _afterReset );

		if ( frame !== null ) frame.parentElement.removeChild( frame );

	}

};

Page.handleChange = function ( event ) {

	var obj = event.target;
	var property = event.name;

	if ( !Page.inHandle ) {

		if ( Page.controls[ property ] ) {

			var ctrl = Page.controls[ property ];

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

Page.prototype.tabHandleClick = function ( event ) {

	var tab = event.target;
	var pages = Page.pages;

	tab.classList.add( 'toptab' );
	tab.parentElement.classList.add( 'onscreen' );

	for ( var i = 0, l = pages.length; i < l; i++ ) {

		var otherTab  = pages[ i ].tab;
		var otherPage = pages[ i ].page;

		if ( otherTab === tab ) {

			otherPage.style.display = 'block';

		} else {

			otherTab.classList.remove( 'toptab' );
			otherPage.style.display = 'none';

		}

	}

};

Page.prototype.appendChild = function ( domElement ) {

	this.page.appendChild( domElement );

};

Page.prototype.addHeader = function ( text ) {

	var div = document.createElement( 'div' );

	div.classList.add( 'header' );
	div.textContent = text;
	this.page.appendChild( div );

	return div;

};

Page.prototype.addSelect = function ( title, obj, trgObj, property ) {

	var div    = document.createElement( 'div' );
	var label  = document.createElement( 'label' );
	var select = document.createElement( 'select' );
	var opt;

	div.classList.add( 'control' );

	if ( obj instanceof Array ) {

		for ( var i = 0, l = obj.length; i < l; i++ ) {

			opt = document.createElement( 'option' );

			opt.value = i;
			opt.text  = obj[ i ];

			if ( opt.text === trgObj[ property ] ) opt.selected = true;

			select.add( opt, null );

		}

		select.addEventListener( 'change', function ( event ) { Page.inHandler = true; trgObj[ property ] = obj[ event.target.value ]; Page.inHandler = false; } );

	} else {

		for ( var p in obj ) {

			opt = document.createElement( 'option' );

			opt.text  = p;
			opt.value = obj[ p ];

			if ( opt.value == trgObj[ property ] ) opt.selected = true;

			select.add( opt, null );

		}

		select.addEventListener( 'change', function ( event ) { Page.inHandler = true; trgObj[ property ] = event.target.value; Page.inHandler = false; } );

	}

	label.textContent = title;

	Page.controls[ property ] = select;

	div.appendChild( label );
	div.appendChild( select );

	this.page.appendChild( div );

	return div;

};

Page.prototype.addCheckbox = function ( title, obj, property ) {

	var label = document.createElement( 'label' );
	var cb    = document.createElement( 'input' );

	label.textContent = title;

	cb.type    = 'checkbox';
	cb.checked = obj[ property ];

	cb.addEventListener( 'change', _checkboxChanged );

	Page.controls[ property ] = cb;

	label.appendChild( cb );

	this.page.appendChild( label );

	return;

	function _checkboxChanged ( event ) {

		Page.inHandler = true;

		obj[ property ] = event.target.checked;

		Page.inHandler = false;

	}

};

Page.prototype.addRange = function ( title, obj, property ) {

	var div = document.createElement( 'div' );
	var label = document.createElement( 'label' );
	var range = document.createElement( 'input' );

	div.classList.add( 'control' );

	range.type = 'range';

	range.min  = 0;
	range.max  = 1;

	range.step = 0.05;
	range.value = obj[ property ];

	range.addEventListener( 'input', _rangeChanged );
	range.addEventListener( 'change', _rangeChanged ); // for IE11 support

	label.textContent = title;

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

	var slide = document.createElement( 'div' );

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

	var newSlide = document.createElement( 'div' );
	var oldSlide = this.slide;
	var page = this.page;
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

Page.prototype.addDownloadButton = function ( title, obj, property, fileName ) {

	var a = document.createElement( 'a' );

	if ( typeof a.download === 'undefined' ) return false;

	a.textContent = title;
	a.type = 'download';
	a.download = fileName;
	a.href = obj[ property ];

	Page.controls[ property ] = a;

	this.page.appendChild( a );

};

export { Page };

// EOF