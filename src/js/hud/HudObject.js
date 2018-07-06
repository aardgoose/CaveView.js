
import { Cfg } from '../core/lib';

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

	}

};

export { HudObject };

// EOF