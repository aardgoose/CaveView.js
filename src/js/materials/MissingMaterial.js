import { MeshLambertMaterial} from '../Three';
import { CommonTerrainMaterial } from './CommonTerrainMaterial';

function MissingMaterial ( ctx ) {

	MeshLambertMaterial.call( this, { color: 0xff8888} );

	this.transparent = true;

	Object.defineProperty( this, 'opacity', {
		get: function () { return ctx.materials.terrainOpacity; }
	} );

	return this;

}

MissingMaterial.prototype = Object.create( MeshLambertMaterial.prototype );

Object.assign( MissingMaterial.prototype, CommonTerrainMaterial.prototype );

export { MissingMaterial };