
import { EventDispatcher } from '../Three';

function FileSelector ( container ) {

	this.fileList = [];
	this.fileCount = 0;
	this.currentIndex = Infinity;
	this.loadedFile = null;
	this.isMultiple = false;

	const self = this;

	container.addEventListener( 'drop', _handleDrop );
	container.addEventListener( 'dragover', _handleDragover );

	Object.defineProperty( this, 'file', {
		get: function () { return this.selectedFile; },
		set: this.selectFile
	} );

	function _handleDragover ( event ) {

		event.preventDefault();
		event.dataTransfer.dropEffect = 'copy';

	}

	function _handleDrop ( event ) {

		const dt = event.dataTransfer;

		event.preventDefault();

		const count = dt.files.length;
		const files = [];

		if ( count > 0 ) {

			for( var i = 0; i < count; i++ ) {

				files.push( dt.files[ i ] );

			}

			self.selectFile( files, null );

		}

	}

	this.dispose = function () {

		container.removeEventListener( 'drop', _handleDrop );
		container.removeEventListener( 'dragover', _handleDragover );

	};

}

FileSelector.prototype = Object.create( EventDispatcher.prototype );

FileSelector.prototype.addList = function ( list ) {

	this.fileList = list;
	this.fileCount = list.length;

};

FileSelector.prototype.nextFile = function () {

	const fileList = this.fileList;

	//cycle through caves in list provided
	if ( this.fileCount === 0 ) return false;

	if ( ++this.currentIndex >= this.fileCount ) this.currentIndex = 0;

	this.selectFile( fileList[ this.currentIndex ] );

};

FileSelector.prototype.selectFile = function ( file, section ) {

	if ( Array.isArray( file ) ) {

		if ( file.length === 1 ) {

			this.selectedFile = file.name;
			this.isMultiple = false;

		} else {

			this.selectedFile = '[multiple]';
			this.isMultiple = true;

		}

	} else {

		this.selectedFile = file;

	}

	this.loadedFile = file;

	this.dispatchEvent( { type: 'selected', file: file, section: section } );

};

FileSelector.prototype.reload = function () {

	this.selectFile( this.loadedFile );

};

export { FileSelector};


// EOF