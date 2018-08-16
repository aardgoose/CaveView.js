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

	var depth = 0;
	var currentHover = 0;
	var currentTop;

	const stringCompare = new Intl.Collator( 'en-GB', { numeric: true } ).compare;

	currentTop = surveyTree;

	if ( ! Viewer.surveyLoaded ) return;

	this.addHeader( 'Selection' );

	titleBar.id = 'ui-path';

	this.appendChild( titleBar );

	this.addSlide( _displayPanel( currentTop ), depth );

	this.addListener( this.page, 'click', _handleSelectSurveyClick );
	this.addListener( this.page, 'dblclick', _handleSelectSurveyDblClick );

	this.addListener( this.page, 'mouseover', _handleMouseover );
	this.addListener( this.page, 'mouseleave', _handleMouseleave );

	var redraw = container.clientHeight; // eslint-disable-line no-unused-vars

	this.onChange = _onChange;

	return this;

	function _onChange( event ) {

		if ( ! Viewer.surveyLoaded ) return;

		if ( event.name === 'section' || event.name === 'shadingMode' || event.name === 'splays' ) {

			self.replaceSlide( _displayPanel( currentTop ), depth );

		}

	}

	function _displayPanel ( top ) {

		const surveyColourMap = SurveyColours.getSurveyColourMap( surveyTree, Viewer.section );

		var tmp;

		while ( tmp = titleBar.firstChild ) titleBar.removeChild( tmp ); // eslint-disable-line no-cond-assign

		if ( top === surveyTree ) {

			titleBar.textContent = ( top.name === '' ) ? '[model]' : top.name;

		} else {

			const span = document.createElement( 'span' );

			span.id ='surveyBack';
			span.textContent = ' \u25C4';

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

		return ul;

		function _addLine ( child ) {

			const id = child.id;
			const connections = ( child.p === undefined ) ? null : child.p.connections;

			if ( connections === 0 && ! Viewer.splays && child.type !== STATION_ENTRANCE ) return; // skip spays if not displayed

			const li  = document.createElement( 'li' );
			const txt = document.createTextNode( child.name );

			var key;

			li.id = 'sv' + id;

			if ( Viewer.section === id ) li.classList.add( 'selected' );

			if ( connections === null ) {

				let colour;

				if ( Viewer.shadingMode === SHADING_SURVEY && surveyColourMap[ id ] !== undefined ) {

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
				descend.id = 'ssv' + id;
				descend.textContent = '\u25bA';

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

	function _handleMouseleave ( event ) {

		event.stopPropagation();
		Viewer.highlight = 0;

	}

	function _handleMouseover ( event ) {

		event.stopPropagation();

		const target = event.target;

		if ( target.nodeName !== 'LI' ) return;

		const id = Number( target.id.split( 'v' )[ 1 ] );

		if ( id !== currentHover ) {

			Viewer.highlight = ( Viewer.section !== id ) ? id : 0;
			currentHover = id;

		}

		return false;

	}

	function _handleSelectSurveyClick ( event ) {

		const target = event.target;
		const id = Number( target.id.split( 'v' )[ 1 ] );

		event.stopPropagation();

		switch ( target.tagName ) {

		case 'LI':

		// Viewer.section = ( Viewer.section !== id ) ? id : 0;
			Viewer.section = id;
			Viewer.setPOI = true;

			break;

		case 'DIV':

			if ( id ) {

				self.replaceSlide( _displayPanel( currentTop.findById( id ) ), ++depth );

			} else if ( target.id === 'ui-path' ) {

				Viewer.section = currentTop.id;

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
		const id = Number( target.id.split( 'v' )[ 1 ] );

		if ( ! target.classList.contains( 'section' ) ) return;

		event.stopPropagation();

		if ( id !== 0 ) {

			Viewer.cut = true;

			Page.clear();

		}

	}

}

SelectionPage.prototype = Object.create( Page.prototype );

export { SelectionPage };


// EOF