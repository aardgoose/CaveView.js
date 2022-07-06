import { EventDispatcher } from '../Three';
import { ModelSource } from '../core/ModelSource';

class FileSelector extends EventDispatcher {

	constructor ( container, ctx ) {

		super();

		this.sourceList = [];
		this.sourceCount = 0;
		this.currentIndex = Infinity;
		this.loadedSource = null;

		this.splash = null;

		const self = this;

		container.addEventListener( 'drop', _handleDrop );
		container.addEventListener( 'dragenter', _handleDragenter );
		container.addEventListener( 'dragover', _handleDragover );
		container.addEventListener( 'dragleave', _handleDragleave );

		function _closeSpash () {

			const splash = self.splash;
			container.classList.remove( 'cv-splash' );

			if ( splash !== null ) {

				splash.parentNode.removeChild( splash );
				self.splash = null;

			}

		}

		function _handleDragenter ( event ) {

			event.preventDefault();

			if ( self.splash !== null ) return;

			const splash = document.createElement( 'div' );

			splash.innerHTML = ctx.cfg.i18n( 'dnd.splash_text' ) || 'dnd.splash_text';
			splash.id = 'cv-splash';

			container.appendChild( splash );
			container.classList.add( 'cv-splash' );

			self.splash = splash;

		}

		function _handleDragover ( event ) {

			event.preventDefault();
			event.dataTransfer.dropEffect = 'copy';

		}


		function _handleDragleave ( event ) {

			event.preventDefault();
			if ( event.relatedTarget === container.parentNode ) _closeSpash();

		}

		function _handleDrop ( event ) {

			_closeSpash();

			const dt = event.dataTransfer;

			event.preventDefault();

			self.launchFiles( dt.files );

		}

		this.dispose = function () {

			container.removeEventListener( 'drop', _handleDrop );
			container.removeEventListener( 'dragover', _handleDragover );
			container.removeEventListener( 'dragleave', _handleDragleave );
			container.removeEventListener( 'dragenter', _handleDragenter );

		};

	}

	loadLocalFiles ( list ) {

		const count = list.length;
		const source = new ModelSource( [], true );

		if ( count > 0 ) {

			for ( let i = 0; i < count; i++ ) {

				source.files.push( list[ i ] );

			}

			// FIXME ( add to list??)
			this.sourceList.push( source );
			this.selectSource( source, null );

		}

	}

	addNetList ( list ) {

		const sourceList = this.sourceList;

		list.forEach( name => {

			sourceList.push( new ModelSource( [ { name: name } ], false ) );

		} );

		this.sourceCount = list.length;

	}

	nextFile () {

		const sourceList = this.sourceList;

		//cycle through caves in list provided
		if ( this.sourceCount === 0 ) return false;

		if ( ++this.currentIndex >= this.sourceCount ) this.currentIndex = 0;

		this.selectSource( sourceList[ this.currentIndex ] );

	}

	selectSource ( source, section = null ) {

		this.loadedSource = source;

		this.dispatchEvent( { type: 'selected', source: source, section: section } );

	}

	reload () {

		this.selectSource( this.loadedSource );

	}

}

export { FileSelector};