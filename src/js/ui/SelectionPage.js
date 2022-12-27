import { SelectionCommonPage } from './SelectionCommonPage';

class SelectionPage extends SelectionCommonPage {

	constructor ( frame, viewer, container, fileSelector ) {

		super( frame, viewer, container, fileSelector );

		const self = this;
		let depth = 0;

		this.addSlide( _displaySection( self.currentTop ), depth );

		const redraw = container.clientHeight; /* lgtm[js/unused-local-variable] */ // eslint-disable-line no-unused-vars

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

		return this;

		function _displaySection ( top ) {

			self.nodes = new WeakMap();

			let tmp;

			self.titleBar.replaceChildren(); // remove all children

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

}

export { SelectionPage };