
import { EventDispatcher } from '../Three';

function FileSelector ( container ) {

	this.fileList = [];
	this.fileCount = 0;
	this.currentIndex = Infinity;

	const self = this;

	container.addEventListener( 'drop', _handleDrop );
	container.addEventListener( 'dragover', _handleDragover );

	Object.defineProperty( this, 'file', {
		get: function () { return this.selectedFile; },
		set: this.selectFile
	} );

	return this;

	function _handleDragover ( event ) {

		event.preventDefault();
		event.dataTransfer.dropEffect = 'copy';

	}

	function _handleDrop ( event ) {

		const dt = event.dataTransfer;

		event.preventDefault();

		if ( dt.files.length === 1 ) self.selectFile( dt.files[ 0 ], null );

	}

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

	this.selectedFile = file instanceof File ? file.name : file;

	this.dispatchEvent( { type: 'selected', file: this.selectedFile, section: section } );

};

export { FileSelector};


// EOF