import { SelectionCommonPage } from './SelectionCommonPage';

function SelectionPage ( frame, viewer, container, fileSelector ) {

	SelectionCommonPage.call( this, frame, viewer, container, fileSelector );

	const self = this;
	var depth = 0;

	this.addSlide( _displaySection( self.currentTop ), depth );

	var redraw = container.clientHeight; /* lgtm[js/unused-local-variable] */ // eslint-disable-line no-unused-vars

	this.handleNext = function ( target, node ) {

		if ( node !== undefined && node !== self.surveyTree ) {

			self.replaceSlide( _displaySection( node ), ++depth );

		} else if ( target.id === 'ui-path' ) {

			viewer.section = self.currentTop;

		}

	};

	this.handleBack = function ( target ) {

		if ( target.id === 'surveyBack' ) {

			if ( self.currentTop === self.surveyTree ) return;

			self.replaceSlide( _displaySection( self.currentTop.parent ), --depth );

		}

	};

	this.handleRefresh = function () {

		this.replaceSlide( _displaySection( this.currentTop ), depth );

	};

	return this;

	function _displaySection ( top ) {

		self.nodes = new WeakMap();

		var tmp;

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

		return self.displaySectionCommon( top );

	}

}

SelectionPage.prototype = Object.create( SelectionCommonPage.prototype );

export { SelectionPage };