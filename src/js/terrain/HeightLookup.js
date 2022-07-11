import { TextureLookup } from '../core/TextureLookup';

class HeightLookup extends TextureLookup {

	zOffset = 0;

	constructor ( renderer, renderTarget, boundingBox, offsets ) {

		super( renderer, renderTarget, boundingBox );

		this.zOffset = offsets.z;

	}

	lookup ( point ) {
		console.log( this.base.z, this.zOffset );
		return super.lookup( point ) * this.range.z;

	}

}

export { HeightLookup };