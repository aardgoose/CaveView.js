import { TextureLookup } from '../core/TextureLookup';

class HeightLookup extends TextureLookup {


	constructor ( renderer, renderTarget, boundingBox ) {

		super( renderer, renderTarget, boundingBox );

	}

	lookup ( point ) {

		return super.lookup( point ) * this.range.z + this.base.z;

	}

}

export { HeightLookup };