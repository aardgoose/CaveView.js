import { VERSION, LEG_CAVE } from '../core/constants';
import { Page } from './Page';
import { replaceExtension } from '../core/lib';

function InfoPage ( frame, viewer, fileSelector ) {

	Page.call( this, 'icon_info', 'info' );

	frame.addPage( this );

	this.addHeader( 'header' );

	this.addHeader( 'stats.header' );

	this.addText( 'file: ' + fileSelector.file );

	const stats = viewer.getLegStats( LEG_CAVE );

	this.addLine( this.i18n( 'stats.legs' ) + ': ' + stats.legCount );
	this.addLine( this.i18n( 'stats.totalLength' ) + ': ' + stats.legLength.toFixed( 2 ) + '\u202fm' );
	this.addLine( this.i18n( 'stats.minLength' ) + ': ' + stats.minLegLength.toFixed( 2 ) + '\u202fm' );
	this.addLine( this.i18n( 'stats.maxLength' ) + ': ' + stats.maxLegLength.toFixed( 2 ) + '\u202fm' );

	if ( this.canDownload() ) {

		this.addHeader( 'gltf_export.header' );

		const selection = { legs: false, walls: false, scraps: false  };
		const options = { rotate: false, binary: false };

		if ( viewer.hasWalls ) {

			selection.walls = true;
			this.addCheckbox( 'gltf_export.walls', selection, 'walls' );

		}

		if ( viewer.hasScraps ) {

			selection.scraps = true;
			this.addCheckbox( 'gltf_export.scraps', selection, 'scraps' );

		}

		this.addCheckbox( 'gltf_export.legs', selection, 'legs' );

		this.addCheckbox( 'gltf_export.rotate_axes', options, 'rotate' );
		//this.addCheckbox( 'gltf_export.binary_format', options, 'binary' );

		this.addButton( 'gltf_export.export', function () {

			viewer.getGLTFExport( selection, options, handleExport );

		} );

	}

	this.addHeader( 'CaveView v' + VERSION + '.' );

	this.addLogo();
	this.addText( 'A WebGL 3d cave viewer for Survex (.3d), Therion (.lox) and Compass .plt models.' );

	this.addText( 'For more information see: ' );
	this.addLink( 'https://aardgoose.github.io/CaveView.js/', 'CaveView on GitHub' );
	this.addText( '© Angus Sawyer, 2020' );

	const self = this;

	function handleExport ( gltfData, binary ) {

		var filename = replaceExtension( fileSelector.localFilename, ( binary ? 'glb' : 'gltf' ) );

		self.download( URL.createObjectURL( gltfData ), filename );

	}

}

InfoPage.prototype = Object.create( Page.prototype );

export { InfoPage };