
import { Cfg } from '../core/lib';
import { CylinderBufferGeometry } from '../Three';

function onUploadDropBuffer() {

	// call back from BufferAttribute to drop JS buffers after data has been transfered to GPU
	this.array = null;

}

var commonRing;

const HudObject = {

	stdMargin: 5,

	atlasSpec: {
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

		if ( geometry.index !== null ) geometry.index.onUpload( onUploadDropBuffer );

	},

	getCommonRing: function () {

		if ( commonRing === undefined ) {

			commonRing = new CylinderBufferGeometry( HudObject.stdWidth * 0.90, HudObject.stdWidth, 3, 32, 1, true );
			commonRing.rotateX( Math.PI / 2 );

			HudObject.dropBuffers( commonRing );

		}

		return commonRing;

	},

	init: function () {

		HudObject.stdWidth = Cfg.themeValue( 'hud.widgetSize' );
		HudObject.atlasSpec.color = Cfg.themeColorCSS( 'hud.text' );

	}

};

export { HudObject };

// EOF