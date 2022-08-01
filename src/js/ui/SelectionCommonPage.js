import { SHADING_SURVEY, STATION_ENTRANCE } from '../core/constants';
import { Page } from './Page';

class SelectionCommonPage extends Page {

	constructor ( frame, viewer, container, fileSelector ) {

		const _onTop = () => { this.isOntop = true; };
		const _onLeave = () => { this.isOntop = false; };

		super( 'icon_explore', 'selection', _onTop, _onLeave );

		this.isOntop = false;

		frame.addPage( this );

		this.surveyTree = viewer.getSurveyTree();
		this.currentTop = this.surveyTree;

		this.nodes = new WeakMap();
		this.leafSections = new WeakSet();
		this.lastSelected = null;
		this.lastSection = 0;
		this.lastShadingMode = viewer.shadingMode;
		this.currentHover = null;
		this.stringCompare = new Intl.Collator( 'en-GB', { numeric: true } ).compare;

		const titleBar = document.createElement( 'div' );
		const cfg = viewer.ctx.cfg;

		titleBar.id = 'ui-path';
		titleBar.classList.add( 'header' );

		if ( viewer.isClipped ) {

			const span = document.createElement( 'span' );
			span.textContent = '\u25c0 ';

			this.addListener( titleBar, 'click', __handleLoadFull );

			titleBar.classList.add( 'reload' );

			const txt = document.createTextNode( this.currentTop.name );

			titleBar.appendChild( span );
			titleBar.appendChild( txt );

		} else {

			titleBar.textContent = this.currentTop.name;

			this.nodes.set( titleBar, this.currentTop );

		}

		this.titleBar = titleBar;
		this.appendChild( titleBar );

		this.addListener( this.page, 'mouseover', _handleMouseover );
		this.addListener( this.page, 'mouseleave', _handleMouseleave );

		this.addListener( this.page, 'click', _handleSelectSurveyClick );
		this.addListener( this.page, 'dblclick', _handleSelectSurveyDblClick );

		const self = this;

		const redraw = container.clientHeight; /* lgtm[js/unused-local-variable] */ // eslint-disable-line no-unused-vars

		this.addLine = function ( ul, child ) {

			if ( child === null ) return;

			const connections = child.isStation() ? child.effectiveConnections() : null;

			// track which sections have stations as children

			if ( connections !== null && ! this.leafSections.has( ul) ) this.leafSections.add( ul );

			// omit splays if now displaying

			if ( connections === 0 && ! viewer.splays && ! ( child.type & STATION_ENTRANCE ) ) return;

			const li  = document.createElement( 'li' );
			const text = ( child.comment === undefined ) ? child.name : child.name + ' ( ' + child.comment + ' )';
			const txt = document.createTextNode( text );

			let key;

			this.nodes.set( li, child );

			if ( viewer.section === child ) li.classList.add( 'selected' );

			if ( child.type === 0 ) {

				key = _makeKey( '\u2588 ', '#444444' );

				li.classList.add( 'section' );

			} else if ( child.type & STATION_ENTRANCE ) {

				key = _makeKey( '\u2229 ', cfg.themeColorCSS( 'stations.entrances.marker' ) );
				key.classList.add( 'cv-entrance' );

			} else if ( connections > 2 ) { // station at junction

				key = _makeKey( '\u25fc ', cfg.themeColorCSS( 'stations.junctions.marker' ) );

			} else if ( connections === 0 ) { // end of splay

				key = _makeKey( '\u25fb ', cfg.themeColorCSS( 'stations.default.marker' ) );

			} else { // normal station in middle or end of leg

				key = _makeKey( '\u25fc ', cfg.themeColorCSS( 'stations.default.marker' ) );

			}

			li.appendChild( key );
			li.appendChild( txt );

			if ( child.next ) {

				let next = child.next;
				let count = 1;

				while ( next && next !== child ) {

					count++;
					next = next.next;

				}

				const duplicateTag = document.createElement( 'span' );

				duplicateTag.textContent = ` [linked station ${count}]`;
				duplicateTag.classList.add( 'duplicate' );

				li.appendChild( duplicateTag );

			}

			if ( child.children.length > 0 ) {

				const descend = document.createElement( 'div' );

				descend.classList.add( 'descend-tree' );

				self.nodes.set( descend, child );

				li.appendChild( descend );

			}

			ul.appendChild( li );

		};

		this.displaySectionCommon = function ( top ) {

			const children = top.children;

			if ( ! top.sorted ) {

				children.sort( ( s1, s2 ) => this.stringCompare( s1.name, s2.name ) );

				top.sorted = true;

			}

			const ul = document.createElement( 'ul' );
			ul.classList.add( 'cv-tree' );

			top.forEachChild( child => this.addLine( ul, child ) );

			_colourSections( ul );

			this.currentTop = top;
			// this.lastSelected = null;
			this.lastShadingMode = viewer.shadingMode;

			return ul;

		};

		this.reloadSections = function () {

			const uls = this.page.getElementsByTagName( 'UL' );
			const targetSections = [];

			// find leaf sections that need reloading

			for ( let i = 0; i < uls.length; i++ ) {

				const ul = uls[ i ];
				if ( this.leafSections.has( ul ) ) targetSections.push( ul );

			}

			targetSections.forEach( ul => {

				const node = this.nodes.get( ul.previousSibling ) || this.currentTop;

				if ( node ) ul.replaceWith( this.displaySectionCommon( node ) );

			} );

		};

		this.onChange = _onChange;


		return;

		function _makeKey ( text, color ) {

			const key = document.createElement( 'span' );

			key.style.color = color;
			key.textContent = text;

			return key;

		}

		function _handleMouseleave ( /* event */ ) {

			viewer.highlight = self.surveyTree;
			viewer.popup = self.surveyTree;

		}

		function _handleMouseover ( event ) {

			const target = event.target;

			if ( target.nodeName !== 'LI' ) return;

			const node = self.nodes.get( target );

			if ( node !== self.currentHover ) {

				viewer.highlight = ( viewer.section !== node ) ? node : self.surveyTree;
				viewer.popup = node;

				self.currentHover = node;

			}

		}

		function _handleSelectSurveyClick ( event ) {

			event.stopPropagation();
			event.preventDefault();

			const target = event.target;
			const node = self.nodes.get( target );

			switch ( target.tagName ) {

			case 'LI':

				viewer.section = node;
				viewer.setPOI = true;

				target.classList.add( 'selected' );

				if ( self.lastSelected !== null ) self.lastSelected.classList.remove( 'selected' );

				self.lastSelected = target;

				break;

			case 'DIV':

				self.handleNext( target, node );
				break;

			case 'SPAN':

				if ( target.classList.contains( 'duplicate' ) ) {

					const node = self.nodes.get( target.parentNode );
					self.selectNode( node.next );

				} else {
					self.handleBack( target );
				}

				break;

			}

		}

		function _handleSelectSurveyDblClick ( event ) {

			event.stopPropagation();
			event.preventDefault();

			const target = event.target;
			const node = self.nodes.get( target );

			if ( ! target.classList.contains( 'section' ) ) return;

			if ( node !== self.surveyTree ) viewer.cut = true;

		}

		function _onChange ( event ) {

			if ( ! viewer.surveyLoaded ) return;

			if ( event.name === 'splays' ) {

				self.reloadSections();
				return;
			}

			if (
				( self.lastSection !== viewer.section ) ||
				( self.lastShadingMode === SHADING_SURVEY && viewer.shadingMode !== SHADING_SURVEY ) ||
				( self.lastShadingMode !== SHADING_SURVEY && viewer.shadingMode === SHADING_SURVEY )
			) {

				_colourSections();

				self.lastShadingMode = viewer.shadingMode;
				self.lastSection = viewer.section;

			}

		}

		function _colourSections ( ul ) {

			const root = ( ul === undefined ) ? self.page : ul;
			const lis = root.getElementsByTagName( 'li' );

			const surveyColourMapper = viewer.ctx.surveyColourMapper;
			const surveyColourMap = ( viewer.shadingMode === SHADING_SURVEY ) ? surveyColourMapper.getColourMap( viewer.section ) : null;

			for ( let i = 0; i < lis.length; i++ ) {

				const li = lis[ i ];
				const node = self.nodes.get( lis[ i ] );

				if ( node !== undefined && ! node.isStation() ) {

					const span = li.firstChild;
					const id = node.id;
					let colour;

					if ( surveyColourMap?.[ id ] !== undefined ) {

						colour = '#' + surveyColourMap[ id ].getHexString();

					} else {

						colour = '#444444';

					}

					span.style.color = colour;

				}

			}

		}

		function __handleLoadFull () {

			fileSelector.reload();

		}

	}

	selectNode () {} // not implemented for side scrolling tree structure

}

export { SelectionCommonPage };