import { CylinderGeometry } from '../Three';
import { MeshBasicNodeMaterial, MeshPhongNodeMaterial } from '../Nodes';
import { GlyphMaterial } from '../materials/GlyphMaterial';

class HudObject {

	stdMargin = 5;

	constructor ( ctx ) {

		const cfg = ctx.cfg;
		this.stdWidth = cfg.themeValue( 'hud.widgetSize' );
		this.commonRing = null;
		this.ctx = ctx;
		this.textMaterial = ctx.materials.getMaterial( GlyphMaterial, 'hud.text' )

	}

	getBezelMaterial() {

		const ctx = this.ctx;
		const cfg  = ctx.cfg;

		if ( cfg.themeValue( 'hud.bezelType' ) === 'flat' ) {

			return ctx.materials.getMaterial( MeshBasicNodeMaterial, { color: cfg.themeValue( 'hud.bezel' ) } );

		} else {

			return ctx.materials.getMaterial( MeshPhongNodeMaterial, { color: cfg.themeValue( 'hud.bezel' ), shininess: 20, specular: 0x666666 } );

		}

	}

	getCommonRing () {

		let commonRing = this.commonRing;

		if ( commonRing === null ) {

			commonRing = new CylinderGeometry( this.stdWidth * 0.90, this.stdWidth, 3, 32, 1, true );
			commonRing.rotateX( Math.PI / 2 );

			this.commonRing = commonRing;
		}

		return commonRing;

	}

}

export { HudObject };