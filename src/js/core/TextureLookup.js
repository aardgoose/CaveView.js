import { Matrix3, Vector3 } from '../Three';
import { unpackRGBA } from './unpackRGBA';

const __v = new Vector3();

class TextureLookup {

	base = null;
	buffer = null;
	range = null;
	transform = new Matrix3();
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

		this.transform.scale( width / range.x, height/ range.y, 1 );
		this.transform.multiply( new Matrix3().translate( - base.x, - base.y ) );

		this.base = base;
		this.range = range;
		this.width = width;

	}

	subLookup ( x, y ) {

		const offset = ( x + y * this.width ) * 4;

		// convert to survey units and return

		return unpackRGBA( this.buffer.subarray( offset, offset + 4 ) );

	}

	lookup ( point ) {

		const v = __v.copy( point ).setZ( 1 ).applyMatrix3( this.transform );

		// bilinear interpolation

		const xMin = Math.floor( v.x );
		const yMin = Math.floor( v.y );
		const xMax = Math.ceil( v.x );
		const yMax = Math.ceil( v.y );

		const x = v.x - xMin;
		const y = v.y - yMin;

		const l1 = this.subLookup( xMin, yMin );
		const l2 = this.subLookup( xMax, yMin );
		const l3 = this.subLookup( xMin, yMax );
		const l4 = this.subLookup( xMax, yMax );

		const l0 =
			l1 * ( 1 - x) * ( 1 - y) +
			l2 * x * ( 1 - y ) +
			l3 * ( 1 - x ) * y +
			l4 * x * y;

		return l0;

	}

}

export { TextureLookup };