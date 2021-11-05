import { SelectionCommonPage } from './SelectionCommonPage';

class SelectionTreePage extends SelectionCommonPage {

	constructor ( frame, viewer, container, fileSelector ) {

		super( frame, viewer, container, fileSelector );

		const self = this;
		const frameDiv = frame.frame;

		const domTop = this.displaySectionCommon( this.currentTop );

		let hightlitElement = null;
		let lastHighlitScroll = 0;

		this.appendChild( domTop );

		let redraw = container.clientHeight; /* lgtm[js/unused-local-variable] */ // eslint-disable-line no-unused-vars

		this.handleNext = function ( target, node ) {

			if ( node !== undefined && node !== this.surveyTree ) {

				const li = target.parentNode;

				if ( target.classList.contains( 'open' ) ) {

					li.removeChild( li.lastElementChild );
					target.classList.remove( 'open' );

				} else {

					const ul = this.displaySectionCommon( node );
					li.appendChild( ul );
					target.classList.add( 'open' );

					return ul;

				}

			} else if ( target.id === 'ui-path' ) {

				viewer.section = this.currentTop;

			}

		};

		this.handleBack = function () {};

		this.selectNode = function ( station ) {

			if ( ! this.isOntop) return;

			// traverse DOM to find existing tree elements and add required
			// until selected node is visible and can be highlighted

			const selectedNode = station;

			if ( selectedNode === null  ) {

				_clearHighlitElement();
				return;

			}

			// get list of tree nodes from selectedNode to root - 1

			const path = [];
			let node = selectedNode;

			do {
				path.push( node );
				node = node.parent;
			} while ( node.id !== 0 );

			// search dom tree for list Element <LI> mapped to selected node

			// start from top of dom tree
			let children = domTop.childNodes;

			node = path.pop();

			while ( node !== undefined ) {

				let i = 0;
				let listElement;

				// find matching child
				for ( i = 0; i < children.length; i++ ) {

					listElement = children[ i ];
					if ( this.nodes.get( listElement ) === node ) break;

				}

				if ( i === children.length ) break;

				if ( node === selectedNode ) {

					_setHighlight( listElement );
					break;

				} else {

					let nextTopElement = listElement.lastElementChild;

					// expand tree if not already visible
					if ( nextTopElement.tagName === 'DIV' ) {

						nextTopElement = this.handleNext( nextTopElement, node );

					}

					node = path.pop();
					children = nextTopElement.childNodes;

				}

			}

		};

		this.addListener( viewer, 'station', _selectNode );

		return;


		function _selectNode( event ) {

			self.selectNode( event.node.station );

		}

		function _setHighlight( element ) {

			lastHighlitScroll = 0;
			frameDiv.addEventListener( 'scroll', _onScroll );

			element.classList.add( 'highlight' );
			element.scrollIntoView( { behavior: 'smooth', block: 'center' } );

			if ( hightlitElement !== null ) _clearHighlight();
			hightlitElement = element;

		}

		function _clearHighlitElement () {

			frameDiv.removeEventListener( 'scroll', _onScroll );

			if ( lastHighlitScroll > performance.now() - 1000 ) {

				setTimeout( _clearHighlight, 1000 );

			} else {

				_clearHighlight();

			}

		}

		function _clearHighlight () {

			if ( hightlitElement === null ) return;

			hightlitElement.classList.remove( 'highlight' );
			hightlitElement = null;
			lastHighlitScroll = 0;

		}

		function _onScroll( event ) {

			lastHighlitScroll = event.timeStamp;

		}

	}

}

export { SelectionTreePage };