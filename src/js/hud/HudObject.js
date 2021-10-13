import { CylinderBufferGeometry } from '../Three';

function HudObject ( ctx ) {

	const cfg = ctx.cfg;
	this.stdWidth = cfg.themeValue( 'hud.widgetSize' );

	this.atlasSpec = {
		color: cfg.themeColorCSS( 'hud.text' ),
		font: cfg.themeValue( 'hud.font' )
	};

	this.commonRing = null;
	this.ctx = ctx;

}

Object.assign( HudObject.prototype, {

	stdMargin: 5,

	getCommonRing: function () {

		let commonRing = this.commonRing;

		if ( commonRing === null ) {

			commonRing = new CylinderBufferGeometry( this.stdWidth * 0.90, this.stdWidth, 3, 32, 1, true );
			commonRing.rotateX( Math.PI / 2 );

			this.commonRing = commonRing;
		}

		return commonRing;

	},

} );

export { HudObject };