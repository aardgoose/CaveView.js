import { Matrix3, Vector3 } from '../Three';
import { unpackRGBA } from './unpackRGBA';

const __v = new Vector3();

class TextureLookup {

	base = null;
	buffer = null;
	range = null;
	tranform = new Matrix3();
	width = null;

	constructor ( renderer, renderTarget, boundingBox ) {

		const width = renderTarget.width;
		const height = renderTarget.height;

		this.buffer = new Uint8ClampedArray( width * height * 4 );

		// copy texture data into ArrayBuffer

		renderer.readRenderTargetPixels( renderTarget, 0, 0, width, height, this.buffer );


		// calculate tranform matrix from Model coordinates to texure coordinates.

		const base = boundingBox.min;
		const range = boundingBox.getSize( new Vector3() );

		this.tranform.scale( width / range.x, height/ range.y, 1 );
		this.tranform.multiply( new Matrix3().translate( - base.x, - base.y ) );

		this.base = base;
		this.range = range;
		this.width = width;

	}

	lookup ( point ) {

		const v = __v.copy( point).setZ( 1 ).applyMatrix3( this.tranform ).round();

		const offset = ( v.x + v.y * this.width ) * 4;

		// convert to survey units and return

		return unpackRGBA( this.buffer.subarray( offset, offset + 4 ) );

	}

}

export { TextureLookup };