class Page {

	constructor ( id, x18nPrefix, onTop, onLeave ) {

		const tab  = document.createElement( 'div' );
		const page = document.createElement( 'div' );

		page.classList.add( 'page' );

		tab.classList.add( id, 'tab' );

		this.page = page;
		this.tab = tab;
		this.onTop = onTop;
		this.frame = null;
		this.onLeave = onLeave;
		this.slide = undefined;
		this.x18nPrefix = x18nPrefix + '.';
		this.onChange = null;
		this.id = id;
		this.lastScrollY = 0;

	}

	i18n ( text ) {

		const cfg = this.frame.ctx.cfg;
		const tr = cfg.i18n( this.x18nPrefix + text );

		return ( tr === undefined ) ? text : tr;

	}

	addListener ( obj, name, handler ) {

		this.frame.addListener( obj, name, handler );
		// redirect to frame method - allows later rework to page specific destruction

	}

	tabHandleClick ( event ) {

		event.preventDefault();
		event.stopPropagation();

		this.open();

	}

	open () {

		const thisTab = this.tab;
		const pages = this.frame.pages;
		const frameDiv = this.frame.frame;

		thisTab.classList.add( 'toptab' );

		this.frame.onScreen( this.i18n( 'title' ) );
		this.frame.openPageId = this.id;

		pages.forEach( page => {

			const pageDiv = page.page;
			const tabDiv = page.tab;
			const owner = page.owner;

			if ( tabDiv !== thisTab ) {

				if ( tabDiv.classList.contains( 'toptab' ) ) {

					// previously open page
					owner.lastScrollY = frameDiv.scrollTop;
					tabDiv.classList.remove( 'toptab' );

					if ( owner.id !== this.id && owner.onLeave !== undefined ) owner.onLeave();

				}

				pageDiv.style.display = 'none';

			}

		} );

		this.page.style.display = 'block';
		frameDiv.scrollTo( 0, this.lastScrollY );

		if ( this.onTop ) this.onTop();

	}

	appendChild ( domElement ) {

		return this.page.appendChild( domElement );

	}

	addHeader ( text ) {

		const div = document.createElement( 'div' );

		div.classList.add( 'header' );
		div.textContent = this.i18n( text );

		return this.page.appendChild( div );

	}

	addCollapsingHeader ( text, collapsed = false ) {

		const div = this.addHeader( text );

		div.classList.add( 'header_full' );
		if ( collapsed ) div.classList.add( 'header_collapsed' );

		const container = document.createElement( 'div' );

		container.classList.add( 'container_full' );
		if ( collapsed ) container.classList.add( 'container_collapsed' );

		this.page.appendChild( container );

		this.addListener( div, 'click', () => {

			if ( div.classList.contains( 'header_collapsed' ) ) {

				this.addListener( container, 'transitionend', _onReveal );
				container.classList.remove( 'container_collapsed' );

			} else {

				this.addListener( container, 'transitionend', _onCollapse );
				container.classList.add( 'container_collapsed' );

			}

			function _onReveal () {

				container.removeEventListener( 'transitionend', _onReveal );
				div.classList.remove( 'header_collapsed' );

			}

			function _onCollapse () {

				container.removeEventListener( 'transitionend', _onCollapse );
				div.classList.add( 'header_collapsed' );

			}

		} );

		return container;

	}

	addText ( text ) {

		const p = this.addLine( text );

		p.classList.add( 'spaced' );

		return p;

	}

	addLine ( text ) {

		const p = document.createElement( 'p' );

		p.textContent = text;

		return this.page.appendChild( p );

	}

	addBlankLine () {

		return this.page.appendChild( document.createElement( 'br' ) );

	}

	addLink ( url, text ) {

		const a = document.createElement( 'a' );

		a.href = url;
		a.textContent = text;
		a.target = '_blank';

		return this.page.appendChild( a );

	}

	makeLabel ( title, labelClass, idFor ) {

		const label = document.createElement( 'label' );

		label.textContent = this.i18n( title );
		label.htmlFor = idFor;
		label.classList.add( labelClass );

		return label;

	}

	addSelect ( title, obj, trgObj, property, replace ) {

		const div    = document.createElement( 'div' );
		const select = document.createElement( 'select' );
		const id = this.frame.getSeq();

		select.id = id;

		div.classList.add( 'control' );

		if ( obj instanceof Array ) {

			obj.forEach( element => {

				const opt = document.createElement( 'option' );

				opt.value = element;
				opt.text = element;

				if ( opt.value === trgObj[ property ] ) opt.selected = true;

				select.add( opt, null );

			} );

		} else {

			for ( const p in obj ) {

				const opt = document.createElement( 'option' );

				// translate each space delimited substring of ui text
				opt.text = p.split( ' ' ).reduce( ( res, val ) => { return res + ' ' + this.i18n( val ); }, '' ).trim();
				opt.value = obj[ p ];

				if ( opt.value == trgObj[ property ] ) opt.selected = true;

				select.add( opt, null );

			}

		}

		const frame = this.frame;

		this.addListener( select, 'change', function onChange ( event ) {

			frame.inHandler = true;
			trgObj[ property ] = event.target.value;
			frame.inHandler = false;

		} );

		frame.controls[ property ] = select;

		div.append( this.makeLabel( title, 'cv-select', id ), select );

		if ( replace === undefined ) {

			this.page.appendChild( div );

		} else {

			this.page.replaceChild( div, replace );

		}

		return div;

	}

	addFileSelect ( title, fileSelector ) {

		const frame = this.frame;
		const id = frame.getSeq();
		const sourceList = fileSelector.sourceList;
		const div = document.createElement( 'div' );
		const select = document.createElement( 'select' );
		const label = this.makeLabel( title, 'cv-select', id );

		select.id = id;

		div.classList.add( 'control' );
		label.classList.add( 'cv-file-label' );

		sourceList.forEach( source => {

			const opt = document.createElement( 'option' );

			opt.text = source.name;
			opt.value = source.id;

			if ( opt.value == fileSelector.loadedSource.id ) opt.selected = true;

			select.add( opt, null );

		} );

		this.addListener( select, 'change', function onChange ( event ) {


			frame.inHandler = true;

			fileSelector.selectSource( sourceList.find( source => source.id == event.target.value  ) );

			frame.inHandler = false;

		} );

		frame.controls[ 'fileSelector' ] = select;

		div.append( label, select );

		const input = document.createElement( 'input' );

		input.id = id;
		input.classList.add( 'cv-file' );
		input.type = 'file';
		input.accept = '.3d,.lox,.plt';
		input.multiple = true;

		this.addListener( input, 'change', function _handleFileChange () {

			fileSelector.loadLocalFiles( input.files );

		} );

		label.appendChild( input );

		return this.page.appendChild( div );

	}

	addCheckbox ( title, obj, property ) {

		const frame = this.frame;
		const cb    = document.createElement( 'input' );
		const div   = document.createElement( 'div' );

		const id = frame.getSeq();

		div.classList.add( 'control' );

		cb.type = 'checkbox';
		cb.checked = obj[ property ];
		cb.id = id;

		this.addListener( cb, 'change', _checkboxChanged );

		frame.controls[ property ] = cb;

		div.append( cb, this.makeLabel( title, 'check', id ) );

		return this.page.appendChild( div );

		function _checkboxChanged ( event ) {

			frame.inHandler = true;

			obj[ property ] = event.target.checked;

			frame.inHandler = false;

		}

	}

	addNumber ( title, obj, property ) {

		const frame = this.frame;
		const number    = document.createElement( 'input' );
		const div   = document.createElement( 'div' );

		const id = frame.getSeq();

		div.classList.add( 'control' );

		number.type = 'number';
		number.value = obj[ property ];
		number.id = id;
		number.disabled = true;

		frame.controls[ property ] = number;

		div.append( number, this.makeLabel( title, 'check', id ) );

		return this.page.appendChild( div );

	}

	addRange ( title, obj, property ) {

		const frame = this.frame;
		const div = document.createElement( 'div' );
		const range = document.createElement( 'input' );
		const id = frame.getSeq();

		range.id = id;

		div.classList.add( 'control' );

		range.type = 'range';

		range.min = 0;
		range.max = 1;

		range.step = 0.05;
		range.value = obj[ property ];

		this.addListener( range, 'input', _rangeChanged );

		frame.controls[ property ] = range;

		div.append( this.makeLabel( title, 'cv-range', id ), range );

		return this.page.appendChild( div );

		function _rangeChanged ( event ) {

			frame.inHandler = true;

			obj[ property ] = event.target.value;

			frame.inHandler = false;

		}

	}

	addSlide ( domElement, depth ) {

		const slide = document.createElement( 'div' );

		slide.classList.add( 'slide' );
		slide.style.zIndex = 200 - depth;

		slide.appendChild( domElement );

		this.slide = slide;
		this.slideDepth = depth;

		return this.page.appendChild( slide );

	}

	replaceSlide ( domElement, depth ) {

		const newSlide = document.createElement( 'div' );
		const page = this.page;

		let oldSlide = this.slide;

		let redraw; // eslint-disable-line no-unused-vars

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

			redraw = oldSlide.clientHeight; /* lgtm[js/unused-local-variable] */ // eslint-disable-line no-unused-vars

		} else if ( depth < this.slideDepth ) {

			newSlide.addEventListener( 'transitionend', afterSlideIn );

			redraw = newSlide.clientHeight; /* lgtm[js/unused-local-variable] */ // eslint-disable-line no-unused-vars

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

	}

	addButton ( title, func ) {

		const button = document.createElement( 'button' );

		button.type = 'button';
		button.textContent = this.i18n( title );

		this.addListener( button, 'click', func );

		return this.page.appendChild( button );

	}

	addTextBox ( title, placeholder, getResultGetter ) {

		const div = document.createElement( 'div' );
		const input = document.createElement( 'input' );
		const id = this.frame.getSeq();

		let value;

		input.type = 'text';
		input.id = id;
		input.placeholder = placeholder;


		this.addListener( input, 'change', function ( e ) { value = e.target.value; return true; } );

		getResultGetter( _result );

		div.append( this.makeLabel( title, 'text', id ), input );

		return this.page.appendChild( div );

		function _result() {

			input.value = '';
			return value;

		}

	}

	addDownloadButton ( title, urlProvider, fileName ) {

		const a = document.createElement( 'a' );

		this.addListener( a, 'click', () => { a.href = urlProvider( a ); } );

		a.textContent = this.i18n( title );
		a.type = 'download';
		a.download = fileName;
		a.href = 'javascript:void();';

		a.classList.add( 'download' );

		return this.page.appendChild( a );

	}

	download ( data, fileName ) {

		const a = document.createElement( 'a' );

		a.type = 'download';
		a.download = fileName;
		a.href = data;
		a.click();

	}

	addColor ( title, name ) {

		const frame = this.frame;
		const cb    = document.createElement( 'input' );
		const div   = document.createElement( 'div' );
		const cfg = frame.ctx.cfg;

		const id = frame.getSeq();

		div.classList.add( 'control', 'color' );

		cb.type = 'color';
		cb.value = cfg.themeColorHex( name ),

		cb.id = id;

		this.addListener( cb, 'change', _colorChanged );

		frame.controls[ name ] = cb;

		this.addListener( cfg, 'colors', e => { if (e.name === 'all' ) cb.value = cfg.themeColorHex( name ); } );

		div.append( cb, this.makeLabel( title, 'color', id ) );

		return this.page.appendChild( div );

		function _colorChanged ( event ) {

			frame.inHandler = true;

			cfg.setThemeColorCSS( name, event.target.value );

			frame.inHandler = false;

		}

	}

	addLogo () {

		const img = document.createElement( 'div' );

		img.classList.add( 'logo' );
		img.title = 'logo';

		this.appendChild( img );

	}

	dispose () {
		if ( this._dispose ) this._dispose();
	}

}

export { Page };