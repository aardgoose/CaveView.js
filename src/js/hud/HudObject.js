
import { Cfg } from '../core/lib';

const HudObject = {

	stdWidth: Cfg.themeValue( 'hud.widgetSize' ),
	stdMargin: 5,

	atlasSpec: {
		color: Cfg.themeColorCSS( 'hud.text' ),
		font: 'bold helvetica,sans-serif'
	},

	createHitRegion: function ( onEnter ) {

		const div = document.createElement( 'div' );

		div.style.width = HudObject.stdWidth * 2 + 'px';
		div.style.height = HudObject.stdWidth * 2 + 'px';
		div.style.position = 'absolute';

		div.addEventListener( 'mouseenter', onEnter );

		return div;

	}

};

export { HudObject };

// EOF