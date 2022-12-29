import { PointsMaterial, TextureLoader } from '../Three';
import { Point } from './Point';

const img = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white' width='36px' height='36px'%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M20.94 11c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z'/%3E%3C/svg%3E";  // eslint-disable-line

class PointIndicator extends Point {

	constructor ( ctx, color ) {

		const materials = ctx.materials;

		if ( materials.pointerTexture === undefined ) {

			materials.pointerTexture = new TextureLoader().load( img );

		}

		const material = new PointsMaterial( { size: 32, map: materials.pointerTexture, transparent : true, sizeAttenuation: false, alphaTest: 0.8, color: color } );

		super( material, ctx );

	}

}

export { PointIndicator };