
class Frame {

	static seq = 0;

	constructor ( ctx ) {

		this.ctx = ctx;
		this.openPageId = null;
		this.reset();

	}

	reset () {

		const self = this;

		// create UI side panel and reveal tabs
		const frame = document.createElement( 'div' );
		frame.classList.add( 'cv-frame' );

		const frameHeader = document.createElement( 'div' );
		frameHeader.classList.add( 'cv-frame-header' );
		frameHeader.textContent = 'frame header';
		frame.appendChild( frameHeader );

		// create UI box to contain tabs - reorients for small screen widths
		const tabBox = document.createElement( 'div' );
		tabBox.classList.add( 'cv-tab-box' );

		if ( this.pages ) this.pages.forEach( p => p.owner.dispose() );

		this.frame = frame;
		this.header = frameHeader;
		this.tabBox = tabBox;
		this.pages = [];
		this.listeners = [];
		this.inHandler = false;
		this.controls = [];
		this.seq = 0;

		const close = document.createElement( 'div' );
		close.classList.add( 'close' );
		close.classList.add( 'tab' );

		this.addListener( close, 'click', _closeFrame );

		tabBox.appendChild( close );

		function _closeFrame ( /* event */ ) {

			self.openPageId = null;
			tabBox.classList.remove( 'onscreen' );
			frame.classList.remove( 'onscreen' );

		}

	}

	addPage ( page ) {

		const pageDiv = page.page;
		const tab = page.tab;

		page.frame = this;

		this.addListener( tab, 'click', page.tabHandleClick.bind( page ) );

		if ( page.onTop !== undefined ) {

			// callback when this page is made visible
			this.addListener( tab, 'click', page.onTop );

		}

		this.tabBox.appendChild( tab );
		this.frame.appendChild( pageDiv );

		this.pages.push( { tab: tab, page: pageDiv, owner: page } );

		if ( this.openPageId === page.id ) page.open();

		return this;

	}

	getSeq () {

		return Frame.seq++;

	}

	onScreen ( title ) {

		this.tabBox.classList.add( 'onscreen' );
		this.frame.classList.add( 'onscreen' );
		this.header.textContent = title;

	}

	setParent ( parent ) {

		parent.appendChild( this.tabBox );
		parent.appendChild( this.frame );

	}

	setControlsVisibility ( list, visible ) {

		const display = visible ? 'block' : 'none';

		list.forEach( element => {

			if ( element === null ) return;
			element.style.display = display;

		} );

	}

	clear () {

		const frame  = this.frame;
		const tabBox = this.tabBox;

		if ( frame  !== null && frame.parentElement  !== null ) frame.parentElement.removeChild( frame );
		if ( tabBox !== null && tabBox.parentElement !== null ) tabBox.parentElement.removeChild( tabBox );

		this.listeners.forEach( listener => listener.obj.removeEventListener( listener.name, listener.handler ) );

		this.reset();

		return;

	}

	addFullscreenButton ( id, obj, property ) {

		const tabBox = this.tabBox;
		const fullscreen = document.createElement( 'div' );

		fullscreen.classList.add( id );
		fullscreen.classList.add( 'tab' );

		this.addListener( fullscreen, 'click', _toggleButton );

		this.addListener( obj, 'change', _setButton );

		tabBox.appendChild( fullscreen );

		_setButton();

		return fullscreen;

		function _toggleButton () {

			obj[ property ] = ! obj[ property ];

			_setButton();

		}

		function _setButton () {

			if ( obj[ property ] ) {

				fullscreen.classList.remove( 'expand' );
				fullscreen.classList.add( 'collapse' );

			} else {

				fullscreen.classList.add( 'expand' );
				fullscreen.classList.remove( 'collapse' );

			}

		}

	}

	addListener ( obj, name, handler ) {

		obj.addEventListener( name, handler, false );

		this.listeners.push( {
			obj: obj,
			name: name,
			handler: handler
		} );

	}

	handleChange ( event ) {

		const obj = event.target;
		const property = event.name;

		if ( ! this.displayinHandle ) {

			if ( this.controls[ property ] ) {

				const ctrl = this.controls[ property ];

				switch ( ctrl.type ) {

				case 'checkbox':

					ctrl.checked = obj[ property ];

					break;

				case 'select-one':
				case 'range':
				case 'number':

					ctrl.value = obj[ property ];

					break;

				case 'download':

					ctrl.href = obj[ property ];

					break;

				}

			}

		}

		this.pages.forEach( p => {

			const page = p.owner;

			if ( page.onChange !== null ) page.onChange( event );

		} );

	}

}

export { Frame };