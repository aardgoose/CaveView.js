import { SelectionCommonPage } from './SelectionCommonPage';

function SelectionTreePage ( frame, viewer, container, fileSelector ) {

	SelectionCommonPage.call( this, frame, viewer, container, fileSelector );

	const self = this;
	const domTop = _displayPanel( this.currentTop );

	this.appendChild( domTop );

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

	viewer.addEventListener( 'select', _selectNode );

	return this;

	function _selectNode ( event ) {

		console.log( 'select', event );
		// traverse DOM to find existing tree elements and add required
		// until selected node is visible and can be highlighted

		var top = domTop; // start from top of tree

	}

	function _displayPanel ( top ) {

		const ul = self.displayPanelCommon( top );
		ul.classList.add( 'cv-tree' );

		return ul;

	}

}

SelectionTreePage.prototype = Object.create( SelectionCommonPage.prototype );

export { SelectionTreePage };