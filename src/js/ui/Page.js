"use strict";

var CV = CV || {};

CV.Page = function ( frame, id ) {

	var tab  = document.createElement( "div" );
	var page = document.createElement( "div" );

	page.classList.add( "page" );

	tab.id = id;
	tab.classList.add( "tab" );
	tab.addEventListener( "click", this.tabHandleClick );
	tab.style.top = ( CV.Page.position++ * 40 ) + "px";

	frame.appendChild( tab );
	frame.appendChild( page );

	CV.Page.pages.push( { tab: tab, page: page } );

	this.page = page;
	this.slide = undefined;

}

CV.Page.pages     = [];
CV.Page.position  = 0;
CV.Page.inHandler = false;
CV.Page.controls  = [];

CV.Page.reset = function () {

	CV.Page.pages     = [];
	CV.Page.position  = 0;
	CV.Page.inHandler = false;
	CV.Page.controls  = [];

}

CV.Page.handleChange = function ( event ) {

	var obj = event.target;
	var property = event.name;

	if ( !CV.Page.inHandle ) {

		if ( CV.Page.controls[ property ] ) {

			var ctrl = CV.Page.controls[ property] ;

			switch ( ctrl.type ) {

			case "checkbox":

				ctrl.checked = obj[ property ];

				break;

			case "select-one":

				ctrl.value = obj[ property ];

				break;

			case "range":

				ctrl.value = obj[ property ];

				break;

			}

		}

	}

}

CV.Page.prototype.constructor = CV.Page;

CV.Page.prototype.tabHandleClick = function ( event ) {

	var tab = event.target;
	var pages = CV.Page.pages;

	tab.classList.add( "toptab" );
	tab.parentElement.classList.add( "onscreen" );

	for ( var i = 0, l = pages.length; i < l; i++ ) {

		var otherTab  = pages[ i ].tab;
		var otherPage = pages[ i ].page;

		if ( otherTab === tab ) {

			otherPage.style.display = "block";

		} else {

			otherTab.classList.remove( "toptab" );
			otherPage.style.display = "none";

		}

	}

}

CV.Page.prototype.appendChild = function ( domElement ) {

	this.page.appendChild( domElement );

}

CV.Page.prototype.addHeader = function ( text ) {

	var div = document.createElement( "div" );

	div.classList.add( "header" );
	div.textContent = text;
	this.page.appendChild( div );

	return div;

}

CV.Page.prototype.addSelect = function ( title, obj, trgObj, property ) {

	var div    = document.createElement( "div" );
	var label  = document.createElement( "label" );
	var select = document.createElement( "select" );
	var opt;

	div.classList.add( "control" );

	if ( obj instanceof Array ) {

		for ( var i = 0, l = obj.length; i < l; i++ ) {

			opt = document.createElement( "option" );

			opt.value = i;
			opt.text  = obj[ i ];

			if ( opt.text === trgObj[ property ] ) opt.selected = true;

			select.add( opt, null );

		}

		select.addEventListener( "change", function ( event ) { CV.Page.inHandler = true; trgObj[property] = obj[event.target.value]; CV.Page.inHandler = false; } );

	} else {

		for ( var p in obj ) {

			opt = document.createElement( "option" );

			opt.text  = p;
			opt.value = obj[ p ];

			if ( opt.value == trgObj[ property ] ) opt.selected = true;

			select.add( opt, null );

		}

		select.addEventListener( "change", function ( event ) { CV.Page.inHandler = true; trgObj[property] = event.target.value; CV.Page.inHandler = false; } );

	}

	label.textContent = title;

	CV.Page.controls[ property ] = select;

	div.appendChild( label );
	div.appendChild( select );

	this.page.appendChild( div );

	return div;

}

CV.Page.prototype.addCheckbox = function ( title, obj, property ) {

	var label = document.createElement( "label" );
	var cb    = document.createElement( "input" );

	label.textContent = title;

	cb.type    = "checkbox";
	cb.checked = obj[ property ];

	cb.addEventListener( "change", _checkboxChanged );

	CV.Page.controls[ property ] = cb;

	label.appendChild( cb );

	this.page.appendChild( label );

	return;

	function _checkboxChanged ( event ) {

		CV.Page.inHandler = true;

		obj[ property ] = event.target.checked; 

		CV.Page.inHandler = false;

	}

}

CV.Page.prototype.addRange = function ( title, obj, property ) {

	var div = document.createElement( "div" );
	var label = document.createElement( "label" );
	var range = document.createElement( "input" );

	div.classList.add( "control" );

	range.type = "range";

	range.min  = 0;
	range.max  = 1;

	range.step = 0.05;
	range.value = obj[ property ];

	range.addEventListener( "input", _rangeChanged );
	range.addEventListener( "change", _rangeChanged ); // for IE11 support
	
	label.textContent = title;

	CV.Page.controls[ property ] = range;

	div.appendChild( label );
	div.appendChild( range );

	this.page.appendChild( div );

	return div;

	function _rangeChanged ( event ) {

		CV.Page.inHandler = true;

		obj[ property ] = event.target.value; 

		CV.Page.inHandler = false;

	}

}

CV.Page.prototype.addSlide = function ( domElement, depth, handleClick ) {

	var slide = document.createElement( "div" );

	slide.classList.add( "slide" );
	slide.style.zIndex = 200 - depth;

	slide.addEventListener( "click", handleClick );
	slide.appendChild( domElement );

	this.page.appendChild( slide );

	this.slide = slide;
	this.slideDepth = depth;

	return slide;

}

CV.Page.prototype.replaceSlide = function ( domElement, depth, handleClick ) {

	var newSlide = document.createElement( "div" );
	var oldSlide = this.slide;
	var page = this.page;
	var redraw;

	newSlide.classList.add( "slide" );
	newSlide.style.zIndex = 200 - depth;
	newSlide.addEventListener( "click", handleClick );

	if (depth < this.slideDepth) {

		newSlide.classList.add( "slide-out" );

	}

	newSlide.appendChild( domElement );

	page.appendChild( newSlide );

	if ( depth > this.slideDepth ) {

		oldSlide.addEventListener( "transitionend", afterSlideOut );
		oldSlide.classList.add( "slide-out" );

		redraw = oldSlide.clientHeight;

	} else {

		newSlide.addEventListener( "transitionend", afterSlideIn );

		redraw = newSlide.clientHeight;

		newSlide.classList.remove( "slide-out" );

	}

	this.slide = newSlide;
	this.slideDepth = depth;

	return;	

	function afterSlideOut () {

		oldSlide.removeEventListener( "transitionend", afterSlideOut );
		page.removeChild(oldSlide);

	}

	function afterSlideIn () {

		page.removeChild(oldSlide);
		newSlide.removeEventListener( "transitionend", afterSlideIn );

	}

}

// EOF