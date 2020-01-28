import { Cfg } from '../core/lib';
import { Page } from './Page';

import { HelpPage } from './HelpPage';
import { InfoPage } from './InfoPage';
import { SelectionPage } from './SelectionPage';
import { SettingsPage } from './SettingsPage';
import { SurfacePage } from './SurfacePage';
import { EditPage } from './EditPage';
import { LocationButton } from './LocationButton';
import { KeyboardControls } from './KeyboardControls';
import { FileSelector } from './FileSelector';

function CaveViewUI ( viewer ) {

	const container = viewer.container;

	const fileSelector = new FileSelector( container );
	fileSelector.addEventListener( 'selected', selectFile );

	// target with css for fullscreen on small screen devices
	container.classList.add( 'cv-container' );

	// event handlers
	viewer.addEventListener( 'change', Page.handleChange );
	viewer.addEventListener( 'newCave', initUI );

	// make sure we get new language strings if slow loading
	Cfg.addEventListener( 'change', initUI );

	new KeyboardControls( viewer, fileSelector, Cfg.value( 'avenControls', true ) );

	function selectFile( event ) {

		Page.clear();
		viewer.clearView();

		if ( Array.isArray( event.file ) ) {

			viewer.loadCaves( event.file );

		} else {

			viewer.loadCave( event.file, event.section );

		}

	}

	function initUI () {

		if ( ! viewer.surveyLoaded ) return;

		// create UI side panel and reveal tabs
		Page.clear();

		new SettingsPage( viewer, fileSelector );

		if ( viewer.hasSurfaceLegs || viewer.hasTerrain ) new SurfacePage( viewer );

		new SelectionPage( viewer, container, fileSelector );

		if ( Cfg.value( 'showEditPage', false ) && ! fileSelector.isMultiple ) new EditPage( viewer, fileSelector );

		new InfoPage( viewer, fileSelector );
		new HelpPage( viewer.svxControlMode );

		LocationButton( viewer, container );

		Page.setParent( container );

		Page.addFullscreenButton( 'fullscreen', viewer, 'fullscreen' );

	}

	this.loadCaveList = function ( list ) {

		fileSelector.addList( list );
		fileSelector.nextFile();

	};

	this.loadCave = function ( file, section ) {

		fileSelector.selectFile( file, section );

	};

	this.loadCaves = function ( files ) {

		viewer.clearView();
		viewer.loadCaves( files );

	};

	this.clearView = function () {

		Page.clear();
		viewer.clearView();

	};

}

export { CaveViewUI };

// EOF