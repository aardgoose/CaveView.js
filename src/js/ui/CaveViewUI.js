import { EditPage } from './EditPage';
import { ExportPage } from './ExportPage';
import { FileSelector } from './FileSelector';
import { Frame } from './Frame';
import { HelpPage } from './HelpPage';
import { InfoPage } from './InfoPage';
import { KeyboardControls } from './KeyboardControls';
import { ModelSource } from '../core/ModelSource';
import { SelectionPage } from './SelectionPage';
import { SettingsPage } from './SettingsPage';
import { SurfacePage } from './SurfacePage';

function CaveViewUI ( viewer ) {

	const ctx = viewer.ctx;
	const container = viewer.container;
	const frame = new Frame( ctx );
	const cfg = ctx.cfg;

	ctx.ui = this;

	const fileSelector = new FileSelector( container, ctx );
	fileSelector.addEventListener( 'selected', selectFile );

	// event handlers
	viewer.addEventListener( 'change', frame.handleChange.bind( frame ) );
	viewer.addEventListener( 'newCave', initUI );
	viewer.addEventListener( 'clear', initUI );

	// make sure we get new language strings if slow loading
	cfg.addEventListener( 'change', initUI );

	const keyboardControls = new KeyboardControls( viewer, fileSelector, cfg.value( 'avenControls', true ) );

	viewer.addEventListener( 'ready', initUI );

	function selectFile( event ) {

		frame.clear();
		viewer.clearView();

		viewer.loadSource( event.source, event.section );

	}

	function initUI () {

		if ( ! viewer.ready ) return;

		// create UI side panel and reveal tabs
		frame.clear();

		new SettingsPage( frame, viewer, fileSelector );

		if ( viewer.surveyLoaded ) {

			const surveyTree = viewer.getSurveyTree();

			if ( viewer.hasSurfaceLegs || viewer.hasTerrain ) new SurfacePage( frame, viewer );

			if ( surveyTree.maxId > 0 || surveyTree.id != 0 ) new SelectionPage( frame, viewer, container, fileSelector );

			if ( cfg.value( 'showEditPage', false ) && ! fileSelector.isMultiple ) new EditPage( frame, viewer, fileSelector );

			if ( cfg.value( 'showExportPage', false) ) new ExportPage( frame, viewer, fileSelector );

			new InfoPage( frame, viewer, fileSelector );

		}

		new HelpPage( frame, viewer.svxControlMode );

		frame.setParent( container );

		frame.addFullscreenButton( 'fullscreen', viewer, 'fullscreen' );

	}

	this.loadCaveList = function ( list ) {

		fileSelector.addNetList( list );
		fileSelector.nextSource();

	};

	this.loadCave = function ( file, section ) {

		if ( file instanceof File ) {

			fileSelector.selectSource( new ModelSource( [ file ], true ), section );

		} else {

			fileSelector.selectSource( new ModelSource( [ { name: file } ], false ), section );

		}

	};

	this.loadCaves = function ( files ) {

		fileSelector.selectSource( new ModelSource.makeModelSourceFiles( files ) );

	};

	this.loadLocalFiles = function ( files ) {

		fileSelector.loadLocalFiles( files );

	};

	this.clearView = function () {

		frame.clear();
		viewer.clearView();

	};

	this.dispose = function () {

		frame.clear();
		viewer.clearView();
		fileSelector.dispose();
		keyboardControls.dispose();
		viewer.dispose();

	};

}

export { CaveViewUI };