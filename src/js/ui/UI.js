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
import { FileSelector } from './FileSelector';


var container;
var avenControls;
var fileSelector;

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
	Cfg.addEventListener( 'change', initUI );

	avenControls = Cfg.value( 'avenControls', true );

	fileSelector = new FileSelector( container );

	fileSelector.addEventListener( 'selected', selectFile );

	initKeyboardControls( fileSelector, avenControls );

}

function selectFile( event ) {

	Page.clear();
	Viewer.clearView();

	Viewer.loadCave( event.file, event.section );

}

function initUI () {

	if ( ! Viewer.surveyLoaded ) return;

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

	fileSelector.loadFile( file, section );

}

// export public interface

export const UI = {
	init:         init,
	loadCave:     loadCave,
	loadCaveList: loadCaveList
};


// EOF