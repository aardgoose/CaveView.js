import { SHADING_SURVEY, STATION_ENTRANCE } from '../core/constants';
import { Page } from './Page';

function SelectionCommonPage ( frame, viewer, container, fileSelector ) {

	Page.call( this, 'icon_explore', 'selection', _onTop, _onLeave );

	frame.addPage( this );

	this.surveyTree = viewer.getSurveyTree();
	this.currentTop = this.surveyTree;

	this.nodes = new WeakMap();
	this.lastSelected = null;
	this.lastShadingMode = viewer.shadingMode;
	this.currentHover = null;
	this.stringCompare = new Intl.Collator( 'en-GB', { numeric: true } ).compare;
	this.isOntop = false;

	const titleBar = document.createElement( 'div' );
	const cfg = viewer.ctx.cfg;

	titleBar.id = 'ui-path';
	titleBar.classList.add( 'header' );

	if ( viewer.isClipped ) {

		this.addListener( titleBar, 'click', __handleLoadFull );
		titleBar.classList.add( 'reload' );
		titleBar.textContent = this.currentTop.name;

	} else {

		titleBar.textContent = this.currentTop.name;

		this.nodes.set( titleBar, this.currentTop );

	}

	this.titleBar = titleBar;
	this.appendChild( titleBar );

	this.addHeader( 'header' );

	this.addListener( this.page, 'mouseover', _handleMouseover );
	this.addListener( this.page, 'mouseleave', _handleMouseleave );

	this.addListener( this.page, 'click', _handleSelectSurveyClick );
	this.addListener( this.page, 'dblclick', _handleSelectSurveyDblClick );

	const self = this;
	var redraw = container.clientHeight; /* lgtm[js/unused-local-variable] */ // eslint-disable-line no-unused-vars

	this.addLine = function ( ul, child, surveyColourMap ) {

		const connections = ( child.p === undefined ) ? null : child.p.connections;

		if ( connections === 0 && ! viewer.splays && child.type !== STATION_ENTRANCE ) return; // skip spays if not displayed

		const li  = document.createElement( 'li' );
		const text = ( child.comment === undefined ) ? child.name : child.name + ' ( ' + child.comment + ' )';
		const txt = document.createTextNode( text );

		var key;

		self.nodes.set( li, child );

		if ( viewer.section === child ) li.classList.add( 'selected' );

		if ( connections === null ) {

			const id = child.id;

			let colour;

			if ( surveyColourMap !== null && surveyColourMap[ id ] !== undefined ) {

				colour = surveyColourMap[ id ].getHexString();

			} else {

				colour = '444444';

			}

			key = _makeKey( '\u2588 ', '#' + colour );

			li.classList.add( 'section' );

		} else if ( child.type !== undefined && child.type === STATION_ENTRANCE ) {

			key = _makeKey( '\u2229 ', cfg.themeColorCSS( 'stations.entrances.marker' ) );

		} else if ( connections > 2 ) { // station at junction

			key = _makeKey( '\u25fc ', cfg.themeColorCSS( 'stations.junctions.marker' ) );

		} else if ( connections === 0 ) { // end of splay

			key = _makeKey( '\u25fb ', cfg.themeColorCSS( 'stations.default.marker' ) );

		} else { // normal station in middle or end of leg

			key = _makeKey( '\u25fc ', cfg.themeColorCSS( 'stations.default.marker' ) );

		}

		li.appendChild( key );
		li.appendChild( txt );

		if ( child.children.length > 0 ) {

			const descend = document.createElement( 'div' );

			descend.classList.add( 'descend-tree' );

			self.nodes.set( descend, child );

			li.appendChild( descend );

		}

		ul.appendChild( li );

	};

	this.displayPanelCommon = function ( top ) {

		const children = top.children;
		const self = this;

		if ( ! top.sorted ) {

			children.sort( _sortSurveys );
			top.sorted = true;

		}

		const ul = document.createElement( 'ul' );
		const surveyColourMapper = viewer.ctx.surveyColourMapper;
		const surveyColourMap = ( viewer.shadingMode === SHADING_SURVEY ) ? surveyColourMapper.getColourMap( viewer.section ) : null;

		top.forEachChild( function ( child ) { self.addLine( ul, child, surveyColourMap ); } );

		this.currentTop = top;
		this.lastSelected = null;
		this.lastShadingMode = viewer.shadingMode;

		return ul;

		function _sortSurveys ( s1, s2 ) {

			return self.stringCompare( s1.name, s2.name );

		}

	};

	this.onChange = _onChange;

	return;

	function _makeKey ( text, color ) {

		const key = document.createElement( 'span' );

		key.style.color = color;
		key.textContent = text;

		return key;

	}

	function _handleMouseleave ( /* event */ ) {

		viewer.highlight = self.surveyTree;
		viewer.popup = self.surveyTree;

	}

	function _handleMouseover ( event ) {

		const target = event.target;

		if ( target.nodeName !== 'LI' ) return;

		const node = self.nodes.get( target );

		if ( node !== self.currentHover ) {

			viewer.highlight = ( viewer.section !== node ) ? node : self.surveyTree;
			viewer.popup = node;

			self.currentHover = node;

		}

	}

	function _handleSelectSurveyClick ( event ) {

		const target = event.target;
		const node = self.nodes.get( target );

		switch ( target.tagName ) {

		case 'LI':

			viewer.section = node;
			viewer.setPOI = true;

			target.classList.add( 'selected' );

			if ( self.lastSelected !== null ) self.lastSelected.classList.remove( 'selected' );

			self.lastSelected = target;

			break;

		case 'DIV':

			self.handleNext( target, node );
			break;

		case 'SPAN':

			self.handleBack( target );
			break;

		}

	}

	function _handleSelectSurveyDblClick ( event ) {

		const target = event.target;
		const node = self.nodes.get( target );

		if ( ! target.classList.contains( 'section' ) ) return;

		if ( node !== self.surveyTree ) viewer.cut = true;

	}

	function _onChange( event ) {

		if ( ! viewer.surveyLoaded ) return;

		if (
			( event.name === 'splays' ) ||
			( self.lastShadingMode === SHADING_SURVEY && viewer.shadingMode !== SHADING_SURVEY ) ||
			( self.lastShadingMode !== SHADING_SURVEY && viewer.shadingMode === SHADING_SURVEY )
		) {

			self.handleRefresh();

		}

	}

	function __handleLoadFull () {

		fileSelector.reload();

	}

	function _onTop( ) {

		self.isOntop = true;

	}

	function _onLeave( ) {

		self.isOntop = false;

	}

}

SelectionCommonPage.prototype = Object.create( Page.prototype );

export { SelectionCommonPage };