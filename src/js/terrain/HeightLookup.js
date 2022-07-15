import { TextureLookup } from '../core/TextureLookup';

class HeightLookup extends TextureLookup {

	zOffset = 0;

	constructor ( renderer, renderTarget, boundingBox ) {

		super( renderer, renderTarget, boundingBox );

		this.zOffset = boundingBox.min.z;

	}

	lookup ( point ) {

		// return height in model space (needs offsets applying to get survey CRS or EPSG:3857)
		return super.lookup( point ) * this.range.z + this.zOffset;

	}

}

export { HeightLookup };