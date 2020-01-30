
import { CylinderBufferGeometry } from '../Three';

function onUploadDropBuffer() {

	// call back from BufferAttribute to drop JS buffers after data has been transfered to GPU
	this.array = null;

}

function HudObject ( ctx ) {

	const cfg = ctx.cfg;
	this.stdWidth = cfg.themeValue( 'hud.widgetSize' );
	this.atlasSpec.color = cfg.themeColorCSS( 'hud.text' );
	this.atlasSpec.font = cfg.themeValue( 'hud.font' );
	this.commonRing = null;
	this.ctx = ctx;
}

Object.assign( HudObject.prototype, {

	stdMargin: 5,

	atlasSpec: {},

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

		var commonRing = this.commonRing;

		if ( commonRing === null ) {

			commonRing = new CylinderBufferGeometry( this.stdWidth * 0.90, this.stdWidth, 3, 32, 1, true );
			commonRing.rotateX( Math.PI / 2 );

			this.dropBuffers( commonRing );
			this.commonRing = commonRing;
		}

		return commonRing;

	},

} );

export { HudObject };

// EOF