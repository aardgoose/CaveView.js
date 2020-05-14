import { SHADING_SURVEY } from '../core/constants';
import { SelectionCommonPage } from './SelectionCommonPage';

import { Page } from './Page';

function SelectionPage ( frame, viewer, container, fileSelector ) {

	SelectionCommonPage.call( this, frame, viewer, container, fileSelector );

	this.selectionType = 1;

	const self = this;
	var depth = 0;

	this.addSlide( _displayPanel( self.currentTop ), depth );

	var redraw = container.clientHeight; /* lgtm[js/unused-local-variable] */ // eslint-disable-line no-unused-vars

	this.handleNext = function ( target, node ) {

		if ( node !== undefined && node !== self.surveyTree ) {

			self.replaceSlide( _displayPanel( node ), ++depth );

		} else if ( target.id === 'ui-path' ) {

			viewer.section = self.currentTop;

		}

	};

	this.handleBack = function ( target ) {

		if ( target.id === 'surveyBack' ) {

			if ( self.currentTop === self.surveyTree ) return;

			self.replaceSlide( _displayPanel( self.currentTop.parent ), --depth );

		}

	};

	this.handleRefresh = function () {

		this.replaceSlide( _displayPanel( this.currentTop ), depth );

	};

	return this;

	function _displayPanel ( top ) {

		const surveyColourMapper = viewer.ctx.surveyColourMapper;
		const surveyColourMap = ( viewer.shadingMode === SHADING_SURVEY ) ? surveyColourMapper.getColourMap( viewer.section ) : null;

		self.nodes = new WeakMap();

		var tmp;

		self.lastShadingMode = viewer.shadingMode;

		while ( tmp = self.titleBar.firstChild ) self.titleBar.removeChild( tmp ); // eslint-disable-line no-cond-assign

		if ( top === self.surveyTree ) {

			self.titleBar.textContent = ( top.name === '' ) ? '[model]' : top.name;
			self.nodes.set( self.titleBar, top );

		} else {

			const span = document.createElement( 'span' );

			span.id ='surveyBack';
			span.textContent = ' \u25C4';

			self.nodes.set( span, top );

			self.titleBar.appendChild( span );
			self.titleBar.appendChild( document.createTextNode( ' ' + top.name ) );

		}

		const ul = document.createElement( 'ul' );

		const children = top.children;

		if ( ! top.sorted ) {

			children.sort( _sortSurveys );
			top.sorted = true;

		}

		top.forEachChild( function ( child ) { self.addLine( ul, child, surveyColourMap ); } );

		self.currentTop = top;
		self.lastSelected = null;

		return ul;

		function _sortSurveys ( s1, s2 ) {

			return self.stringCompare( s1.name, s2.name );

		}

	}

}

SelectionPage.prototype = Object.create( Page.prototype );

export { SelectionPage };