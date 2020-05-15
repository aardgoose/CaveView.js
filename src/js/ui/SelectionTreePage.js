import { SelectionCommonPage } from './SelectionCommonPage';

function SelectionTreePage ( frame, viewer, container, fileSelector ) {

	SelectionCommonPage.call( this, frame, viewer, container, fileSelector );

	const self = this;
	const domTop = _displayPanel( this.currentTop );

	var hightlitElement = null;
	var lastHighlitScroll = 0;

	this.appendChild( domTop );

	var redraw = container.clientHeight; /* lgtm[js/unused-local-variable] */ // eslint-disable-line no-unused-vars

	this.handleNext = function ( target, node ) {

		if ( node !== undefined && node !== self.surveyTree ) {

			const li = target.parentNode;

			if ( target.classList.contains( 'open' ) ) {

				li.removeChild( li.lastElementChild );
				target.classList.remove( 'open' );

			} else {

				const ul = _displayPanel( node );
				li.appendChild( ul );
				target.classList.add( 'open' );

				return ul;

			}

		} else if ( target.id === 'ui-path' ) {

			viewer.section = self.currentTop;

		}

	};

	this.handleRefresh = function () {
		// FIXME
		this.appendChild( _displayPanel( this.currentTop ) );

	};

	this.handleBack = function () {};

	viewer.addEventListener( 'select', _selectNode );

	return this;

	function _selectNode ( event ) {

		if ( ! self.isOntop) return;

		// traverse DOM to find existing tree elements and add required
		// until selected node is visible and can be highlighted

		const selectedNode = event.node;

		if ( selectedNode === null  ) {

			_clearHighlitElement();
			return;

		}

		// get list of tree nodes from selectedNode to root - 1

		const path = [];
		var node = selectedNode;

		do {
			path.push( node );
			node = node.parent;
		} while ( node.id !== 0 );

		// search dom tree for list Element <LI> mapped to selected node

		var topElement = domTop; // start from top of dom tree
		var children = topElement.childNodes;

		node = path.pop();

		while ( node !== undefined ) {

			let i = 0;
			let listElement;

			// find matching child
			for ( i = 0; i < children.length; i++ ) {

				listElement = children[ i ];
				if ( self.nodes.get( listElement ) == node ) break;

			}

			if ( i == children.length ) break;

			if ( node === selectedNode ) {

				_setHighlight( listElement );
				break;

			} else {

				let nextTopElement = listElement.lastElementChild;

				// expand tree if not already visible
				if ( nextTopElement.tagName === 'DIV' ) {

					nextTopElement = self.handleNext( nextTopElement, node );

				}

				node = path.pop();
				children = nextTopElement.childNodes;
				topElement = nextTopElement;

			}

		}

	}

	function _displayPanel ( top ) {

		const ul = self.displayPanelCommon( top );
		ul.classList.add( 'cv-tree' );

		return ul;

	}

	function _setHighlight( element ) {

		lastHighlitScroll = 0;
		self.frame.frame.addEventListener( 'scroll', _onScroll );

		element.classList.add( 'highlight' );
		element.scrollIntoView( { behavior: 'smooth', block: 'center' } );

		if ( hightlitElement !== null ) _clearHighlight();
		hightlitElement = element;

	}

	function _clearHighlitElement () {

		self.frame.frame.removeEventListener( 'scroll', _onScroll );

		if ( lastHighlitScroll > performance.now() - 1000 ) {

			setTimeout( _clearHighlight, 1000 );

		} else {

			_clearHighlight();

		}

	}

	function _clearHighlight () {

		if ( hightlitElement == null ) return;

		hightlitElement.classList.remove( 'highlight' );
		hightlitElement = null;
		lastHighlitScroll = 0;

	}

	function _onScroll( event ) {

		lastHighlitScroll = event.timeStamp;

	}

}

SelectionTreePage.prototype = Object.create( SelectionCommonPage.prototype );

export { SelectionTreePage };