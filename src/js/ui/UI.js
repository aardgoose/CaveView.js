import { Cfg } from '../core/lib';
import { Page } from './Page';
import { Viewer } from '../viewer/Viewer';

import { HelpPage } from './HelpPage';
import { InfoPage } from './InfoPage';
import { SelectionPage } from './SelectionPage';
import { SettingsPage } from './SettingsPage';
import { SurfacePage } from './SurfacePage';
import { RoutePage } from './RoutePage';
import { initKeyboardControls } from './KeyboardControls';


var container;
var avenControls;
var fileSelector;

function FileSelector ( container ) {

	this.fileList = [];
	this.fileCount = 0;
	this.currentIndex = Infinity;

	container.addEventListener( 'drop', _handleDrop );
	container.addEventListener( 'dragover', _handleDragover );

	Object.defineProperty( this, 'file', {
		get: function () { return this.loadedFile; },
		set: this.loadFile
	} );

	return this;

	function _handleDragover ( event ) {

		event.preventDefault();
		event.dataTransfer.dropEffect = 'copy';

	}

	function _handleDrop ( event ) {

		const dt = event.dataTransfer;

		event.preventDefault();

		if ( dt.files.length === 1 ) loadCave( dt.files[ 0 ], null );

	}

}

FileSelector.prototype.addList = function ( list ) {

	this.fileList = list;
	this.fileCount = list.length;

};

FileSelector.prototype.nextFile = function () {

	const fileList = this.fileList;

	//cycle through caves in list provided
	if ( this.fileCount === 0 ) return false;

	if ( ++this.currentIndex >= this.fileCount ) this.currentIndex = 0;

	this.loadFile( fileList[ this.currentIndex ] );

};

FileSelector.prototype.loadFile = function ( file, section ) {

	this.loadedFile = file instanceof File ? file.name : file;

	Viewer.clearView();
	Viewer.loadCave( file, section );

};

function init ( domID, configuration ) { // public method

	container = document.getElementById( domID );

	if ( ! container ) {

		alert( 'No container DOM object [' + domID + '] available' );
		return;

	}

	// target with css for fullscreen on small screen devices
	container.classList.add( 'cv-container' );

	Viewer.init( domID, configuration );

	// event handlers

	Viewer.addEventListener( 'change', Page.handleChange );

	Viewer.addEventListener( 'newCave', initUI );

	// make sure we get new language strings if slow loading
	Cfg.addEventListener( 'change', refresh );

	avenControls = Cfg.value( 'avenControls', true );

	fileSelector = new FileSelector( container );

	initKeyboardControls( fileSelector, avenControls );

}

function refresh() {

	if ( Viewer.surveyLoaded ) {

		Page.clear();
		initUI();

	}

}

function initUI () {

	// create UI side panel and reveal tabs
	Page.clear();

	new SettingsPage( fileSelector );
	new SurfacePage();
	new SelectionPage( container );
	new RoutePage( fileSelector );
	new InfoPage( fileSelector );
	new HelpPage( avenControls );

	Page.setParent( container );

	Page.addFullscreenButton( 'fullscreen', Viewer, 'fullscreen' );

}

function loadCaveList ( list ) {

	fileSelector.addList( list );
	fileSelector.nextFile();

}

function loadCave ( file, section ) {

	Page.clear();
	Viewer.clearView();

	fileSelector.loadFile( file, section );

}

// export public interface

export const UI = {
	init:         init,
	loadCave:     loadCave,
	loadCaveList: loadCaveList
};


// EOF