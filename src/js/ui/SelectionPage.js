import { STATION_ENTRANCE, SHADING_SURVEY } from '../core/constants';

import { Page } from './Page';
import { Viewer } from '../viewer/Viewer';
import { SurveyColours } from '../core/SurveyColours';
import { Cfg } from '../core/lib';

function SelectionPage ( container ) {

	Page.call( this, 'icon_explore', 'explore' );

	const titleBar = document.createElement( 'div' );
	const surveyTree = Viewer.getSurveyTree();
	const self = this;

	var nodes = null;
	var depth = 0;
	var currentHover = 0;
	var currentTop;
	var lastSelected = null;
	var lastShadingMode = Viewer.shadingMode;

	const stringCompare = new Intl.Collator( 'en-GB', { numeric: true } ).compare;

	currentTop = surveyTree;

	if ( ! Viewer.surveyLoaded ) return;

	this.addHeader( 'Selection' );

	titleBar.id = 'ui-path';

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

		if ( ! Viewer.surveyLoaded ) return;

		if (
			( event.name === 'splays' ) ||
			( lastShadingMode === SHADING_SURVEY && Viewer.shadingMode !== SHADING_SURVEY ) ||
			( lastShadingMode !== SHADING_SURVEY && Viewer.shadingMode === SHADING_SURVEY )
		) {

			self.replaceSlide( _displayPanel( currentTop ), depth );

		}

	}

	function _displayPanel ( top ) {

		const surveyColourMap = ( Viewer.shadingMode === SHADING_SURVEY ) ? SurveyColours.getSurveyColourMap( Viewer.section ) : null;

		nodes = new WeakMap();

		var tmp;

		lastShadingMode = Viewer.shadingMode;

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

		if ( ! children.sorted ) {

			children.sort( _sortSurveys );
			children.sorted = true;

		}

		top.forEachChild( _addLine );

		currentTop = top;
		lastSelected = null;

		return ul;

		function _addLine ( child ) {

			const connections = ( child.p === undefined ) ? null : child.p.connections;

			if ( connections === 0 && ! Viewer.splays && child.type !== STATION_ENTRANCE ) return; // skip spays if not displayed

			const li  = document.createElement( 'li' );
			const txt = document.createTextNode( child.name );

			var key;

			nodes.set( li, child );

			if ( Viewer.section === child ) li.classList.add( 'selected' );

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

				key = _makeKey( '\u2229 ', Cfg.themeColorCSS( 'stations.entrances.marker' ) );

			} else if ( connections > 2 ) { // station at junction

				key = _makeKey( '\u25fc ', Cfg.themeColorCSS( 'stations.junctions.marker' ) );

			} else if ( connections === 0 ) { // end of splay

				key = _makeKey( '\u25fb ', Cfg.themeColorCSS( 'stations.default.marker' ) );

			} else { // normal station in middle or end of leg

				key = _makeKey( '\u25fc ', Cfg.themeColorCSS( 'stations.default.marker' ) );

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

		Viewer.highlight = surveyTree;

	}

	function _handleMouseover ( event ) {

		const target = event.target;

		if ( target.nodeName !== 'LI' ) return;

		const node = nodes.get( target );

		if ( node !== currentHover ) {

			Viewer.highlight = ( Viewer.section !== node ) ? node : surveyTree;
			currentHover = node;

		}

	}

	function _handleSelectSurveyClick ( event ) {

		const target = event.target;

		const node = nodes.get( target );

		switch ( target.tagName ) {

		case 'LI':

			Viewer.section = node;
			Viewer.setPOI = true;

			target.classList.add( 'selected' );

			if ( lastSelected !== null ) lastSelected.classList.remove( 'selected' );

			lastSelected = target;

			break;

		case 'DIV':

			if ( node !== undefined && node !== surveyTree ) {

				self.replaceSlide( _displayPanel( node ), ++depth );

			} else if ( target.id === 'ui-path' ) {

				Viewer.section = currentTop;

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

		if ( node !== surveyTree ) Viewer.cut = true;

	}

}

SelectionPage.prototype = Object.create( Page.prototype );

export { SelectionPage };


// EOF