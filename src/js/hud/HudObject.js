
import { Cfg } from '../core/lib';

function onUploadDropBuffer() {

	// call back from BufferAttribute to drop JS buffers after data has been transfered to GPU
	this.array = null;

}

const HudObject = {

	stdWidth: Cfg.themeValue( 'hud.widgetSize' ),
	stdMargin: 5,

	atlasSpec: {
		color: Cfg.themeColorCSS( 'hud.text' ),
		font: 'bold helvetica,sans-serif'
	},

	createHitRegion: function ( width, height, onEnter ) {

		const div = document.createElement( 'div' );

		div.style.width = width + 'px';
		div.style.height = height + 'px';
		div.style.position = 'absolute';

		div.addEventListener( 'mouseenter', onEnter );

		return div;

	},

	dropBuffers: function ( geometry ) {

		geometry.getAttribute( 'position' ).onUpload( onUploadDropBuffer );
		geometry.getAttribute( 'normal' ).onUpload( onUploadDropBuffer );
		geometry.getAttribute( 'uv' ).onUpload( onUploadDropBuffer );
	}

};

export { HudObject };

// EOF