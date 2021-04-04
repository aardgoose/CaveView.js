import { MeshLambertMaterial} from '../Three';
import { CommonTerrainMaterial } from './CommonTerrainMaterial';

class MissingMaterial extends MeshLambertMaterial {

	constructor ( ctx ) {

		super( { color: 0xff8888} );

		this.transparent = true;

		Object.defineProperty( this, 'opacity', {
			get: function () { return ctx.materials.terrainOpacity; }
		} );

	}

}

Object.assign( MissingMaterial.prototype, CommonTerrainMaterial.prototype );

export { MissingMaterial };