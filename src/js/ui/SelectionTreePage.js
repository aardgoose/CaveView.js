import { SHADING_SURVEY } from '../core/constants';
import { SelectionCommonPage } from './SelectionCommonPage';

function SelectionTreePage ( frame, viewer, container, fileSelector ) {

	SelectionCommonPage.call( this, frame, viewer, container, fileSelector );

	this.selectionType = 2;

	const self = this;

	this.appendChild( _displayPanel( this.currentTop ) );

	var redraw = container.clientHeight; /* lgtm[js/unused-local-variable] */ // eslint-disable-line no-unused-vars

	this.handleNext = function ( target, node ) {

		if ( node !== undefined && node !== self.surveyTree ) {

			const li = target.parentNode;

			if ( target.classList.contains( 'open' ) ) {

				li.removeChild( li.lastElementChild );
				target.classList.remove( 'open' );

			} else {

				li.appendChild( _displayPanel( node ) );
				target.classList.add( 'open' );

			}

		} else if ( target.id === 'ui-path' ) {

			viewer.section = self.currentTop;

		}

	};

	this.handleRefresh = function () {

		this.appendChild( _displayPanel( this.currentTop ) );

	};

	return this;

	function _displayPanel ( top ) {

		const surveyColourMapper = viewer.ctx.surveyColourMapper;
		const surveyColourMap = ( viewer.shadingMode === SHADING_SURVEY ) ? surveyColourMapper.getColourMap( viewer.section ) : null;

		self.lastShadingMode = viewer.shadingMode;

		const ul = document.createElement( 'ul' );
		ul.classList.add( 'cv-tree' );

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

SelectionTreePage.prototype = Object.create( SelectionCommonPage.prototype );

export { SelectionTreePage };