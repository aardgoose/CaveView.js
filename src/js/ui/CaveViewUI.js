import { Frame } from './Frame';
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

	const ctx = viewer.ctx;
	const container = viewer.container;
	const frame = new Frame( ctx );
	const cfg = ctx.cfg;

	const fileSelector = new FileSelector( container, frame );
	fileSelector.addEventListener( 'selected', selectFile );

	// target with css for fullscreen on small screen devices
	container.classList.add( 'cv-container' );

	// event handlers
	viewer.addEventListener( 'change', frame.handleChange.bind( frame ) );
	viewer.addEventListener( 'newCave', initUI );

	// make sure we get new language strings if slow loading
	cfg.addEventListener( 'change', initUI );

	new KeyboardControls( viewer, fileSelector, cfg.value( 'avenControls', true ) );

	function selectFile( event ) {

		frame.clear();
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
		frame.clear();

		new SettingsPage( frame, viewer, fileSelector );

		if ( viewer.hasSurfaceLegs || viewer.hasTerrain ) new SurfacePage( frame, viewer );

		new SelectionPage( frame, viewer, container, fileSelector );

		if ( cfg.value( 'showEditPage', false ) && ! fileSelector.isMultiple ) new EditPage( frame, viewer, fileSelector );

		new InfoPage( frame, viewer, fileSelector );
		new HelpPage( frame, viewer.svxControlMode );

		LocationButton( viewer, container );

		frame.setParent( container );

		frame.addFullscreenButton( 'fullscreen', viewer, 'fullscreen' );

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

		frame.clear();
		viewer.clearView();

	};

}

export { CaveViewUI };

// EOF