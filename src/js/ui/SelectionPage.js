import { STATION_ENTRANCE, SHADING_SURVEY } from '../core/constants';
import { Page } from './Page';

function SelectionPage ( frame, viewer, container, fileSelector ) {

	Page.call( this, 'icon_explore', 'explore' );

	frame.addPage( this );

	const titleBar = document.createElement( 'div' );
	const surveyTree = viewer.getSurveyTree();
	const self = this;

	var nodes = null;
	var depth = 0;
	var currentHover = 0;
	var currentTop;
	var lastSelected = null;
	var lastShadingMode = viewer.shadingMode;

	const stringCompare = new Intl.Collator( 'en-GB', { numeric: true } ).compare;

	currentTop = surveyTree;

	this.addHeader( 'Selection' );

	titleBar.id = 'ui-path';
	titleBar.classList.add( 'header' );

	if ( viewer.isClipped ) {

		titleBar.classList.add( 'reload' );
		this.addListener( titleBar, 'click', __handleLoadFull );

	}

	this.appendChild( titleBar );

	this.addSlide( _displayPanel( currentTop ), depth );

	this.addListener( this.page, 'dblclick', _handleSelectSurveyDblClick );
	this.addListener( this.page, 'click', _handleSelectSurveyClick );

	this.addListener( this.page, 'mouseover', _handleMouseover );
	this.addListener( this.page, 'mouseleave', _handleMouseleave );

	var redraw = container.clientHeight; // eslint-disable-line no-unused-vars

	this.onChange = _onChange;

	return this;

	function _onChange( event ) {

		if ( ! viewer.surveyLoaded ) return;

		if (
			( event.name === 'splays' ) ||
			( lastShadingMode === SHADING_SURVEY && viewer.shadingMode !== SHADING_SURVEY ) ||
			( lastShadingMode !== SHADING_SURVEY && viewer.shadingMode === SHADING_SURVEY )
		) {

			self.replaceSlide( _displayPanel( currentTop ), depth );

		}

	}

	function _displayPanel ( top ) {

		const surveyColourMapper = viewer.ctx.surveyColourMapper;
		const surveyColourMap = ( viewer.shadingMode === SHADING_SURVEY ) ? surveyColourMapper.getColourMap( viewer.section ) : null;
		const cfg = viewer.ctx.cfg;

		nodes = new WeakMap();

		var tmp;

		lastShadingMode = viewer.shadingMode;

		while ( tmp = titleBar.firstChild ) titleBar.removeChild( tmp ); // eslint-disable-line no-cond-assign

		if ( top === surveyTree ) {

			titleBar.textContent = ( top.name === '' ) ? '[model]' : top.name;
			nodes.set( titleBar, top );

		} else {

			const span = document.createElement( 'span' );

			span.id ='surveyBack';
			span.textContent = ' \u25C4';

			nodes.set( span, top );

			titleBar.appendChild( span );
			titleBar.appendChild( document.createTextNode( ' ' + top.name ) );

		}

		const ul = document.createElement( 'ul' );

		const children = top.children;

		if ( ! top.sorted ) {

			children.sort( _sortSurveys );
			top.sorted = true;

		}

		top.forEachChild( _addLine );

		currentTop = top;
		lastSelected = null;

		return ul;

		function _addLine ( child ) {

			const connections = ( child.p === undefined ) ? null : child.p.connections;

			if ( connections === 0 && ! viewer.splays && child.type !== STATION_ENTRANCE ) return; // skip spays if not displayed

			const li  = document.createElement( 'li' );

			const text = ( child.comment === undefined ) ? child.name : child.name + ' ( ' + child.comment + ' )';

			const txt = document.createTextNode( text );

			var key;

			nodes.set( li, child );

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
				descend.textContent = '\u25bA';

				nodes.set( descend, child );

				li.appendChild( descend );

			}

			ul.appendChild( li );

		}

		function _sortSurveys ( s1, s2 ) {

			return stringCompare( s1.name, s2.name );

		}

	}

	function _makeKey ( text, color ) {

		const key = document.createElement( 'span' );

		key.style.color = color;
		key.textContent = text;

		return key;

	}

	function _handleMouseleave ( /* event */ ) {

		viewer.highlight = surveyTree;
		viewer.popup = surveyTree;

	}

	function _handleMouseover ( event ) {

		const target = event.target;

		if ( target.nodeName !== 'LI' ) return;

		const node = nodes.get( target );

		if ( node !== currentHover ) {

			viewer.highlight = ( viewer.section !== node ) ? node : surveyTree;
			viewer.popup = node;

			currentHover = node;

		}

	}

	function _handleSelectSurveyClick ( event ) {

		const target = event.target;

		const node = nodes.get( target );

		switch ( target.tagName ) {

		case 'LI':

			viewer.section = node;
			viewer.setPOI = true;

			target.classList.add( 'selected' );

			if ( lastSelected !== null ) lastSelected.classList.remove( 'selected' );

			lastSelected = target;

			break;

		case 'DIV':

			if ( node !== undefined && node !== surveyTree ) {

				self.replaceSlide( _displayPanel( node ), ++depth );

			} else if ( target.id === 'ui-path' ) {

				viewer.section = currentTop;

			}

			break;

		case 'SPAN':

			if ( target.id === 'surveyBack' ) {

				if ( currentTop === surveyTree ) return;

				self.replaceSlide( _displayPanel( currentTop.parent ), --depth );

			}

		}

	}

	function _handleSelectSurveyDblClick ( event ) {

		const target = event.target;

		const node = nodes.get( target );

		if ( ! target.classList.contains( 'section' ) ) return;

		if ( node !== surveyTree ) viewer.cut = true;

	}

	function __handleLoadFull () {

		fileSelector.reload();

	}

}

SelectionPage.prototype = Object.create( Page.prototype );

export { SelectionPage };


// EOF