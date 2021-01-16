import { Page } from './Page';
import { replaceExtension } from '../core/lib';

function ExportPage ( frame, viewer, fileSelector ) {

	Page.call( this, 'icon_settings', 'exports' );

	frame.addPage( this );

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
	// this.addCheckbox( 'gltf_export.binary_format', options, 'binary' );

	this.addButton( 'gltf_export.export', function () {

		viewer.getGLTFExport( selection, options, handleExport );

	} );

	this.addHeader( 'png_export.header' );

	this.addDownloadButton(
		'png_export.export',
		() => {
			const url = viewer.getSnapshot();
			return url;
		},
		'snapshot.png'
	);

	const self = this;

	return this;


	function handleExport ( gltfData, binary ) {

		var filename = replaceExtension( fileSelector.localFilename, ( binary ? 'glb' : 'gltf' ) );

		self.download( URL.createObjectURL( gltfData ), filename );

	}

}

ExportPage.prototype = Object.create( Page.prototype );

export { ExportPage };