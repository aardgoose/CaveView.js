import { GlyphString } from '../core/GlyphString';
import { FEATURE_SURVEY } from '../core/constants';
import { GlyphMaterial } from '../materials/GlyphMaterial';

class StationNameLabel extends GlyphString {

	constructor ( ctx, station ) {

		const material = ctx.materials.getMaterial( GlyphMaterial, 'stations.default.text' );

		super( station.getPath(), material, ctx );

		this.station = station;
		this.layers.enable( FEATURE_SURVEY );
		this.position.copy( station );

	}

	close () {

		this.removeFromParent();

	}

}

export { StationNameLabel };