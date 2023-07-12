import { NodeMaterial, ShaderNode, pow, tslFn, clamp, max, texture, uniform, uv, varying, vec4 } from '../Nodes.js';
import { Matrix3 } from '../Three';

class AnaglyphMaterial extends NodeMaterial {

	name = 'AnaglyphMaterial';

	constructor ( params ) {

		super();

		// Matrices generated with angler.js https://github.com/tschw/angler.js/
		// (in column-major element order, as accepted by WebGL)

		const colorMatrixLeftSrc = new Matrix3().fromArray( [

			1.0671679973602295, 	-0.0016435992438346148,		 0.0001777536963345483, // r out
			-0.028107794001698494,	-0.00019593400065787137,	-0.0002875397040043026, // g out
			-0.04279090091586113,	 0.000015809757314855233,	-0.00024287120322696865 // b out

		] );

		//	red						green 						blue  						in

		const colorMatrixRightSrc = new Matrix3().fromArray( [

			-0.0355340838432312,	-0.06440307199954987,		 0.018319187685847282,	// r out
			-0.10269022732973099,	 0.8079727292060852,		-0.04835830628871918,	// g out
			0.0001224992738571018,	-0.009558862075209618,		 0.567823588848114		// b out

		] );

		const fLin = tslFn( ( c ) => {

			return c.lessThanEqual( 0.04045 ).cond( c.mul( 0.0773993808 ),  pow( c.mul( 0.9478672986 ).add( 0.0521327014 ), 2.4 ) );

		} );

		const vLin = tslFn( ( c ) => {

			return vec4( fLin( c.r ), fLin( c.g ), fLin( c.b ), c.a );

		} );

		const dev = tslFn( ( c ) => {

			return c.lessThanEqual( 0.0031308 ).cond( c.mul( 12.92 ), pow( c, 0.41666 ).mul( 1.055 ).sub( 0.055 ) );

		} );

		this.normals = false;
		this.lights = false;
		this.opacity = 1;
		this.depthTest = false;
		this.transparent = false;
		this.isTest = true;

		const uvs = varying( uv() );

		const colorMatrixLeft = uniform( colorMatrixLeftSrc );
		const colorMatrixRight = uniform( colorMatrixRightSrc );

		const fragmentShader = new ShaderNode( ( stack ) => {

			const colorL = vec4().temp();
			const colorR = vec4().temp();


			stack.assign( colorL, texture( params.left, uvs ) );
			stack.assign( colorR, texture( params.right, uvs ) );

			stack.assign( colorL, vLin( colorL ) );
			stack.assign( colorR, vLin( colorR ) );

			const color = vec4().temp();

			stack.assign( color, clamp(
				colorMatrixLeft.mul( colorL.rgb ).add( colorMatrixRight.mul( colorR.rgb ) ),
				0, 1
			) );

			return vec4(
				dev( color.r ), dev( color.g ), dev( color.b ),
				max( colorL.a, colorR.a )
			);

		} );


		this.outNode = fragmentShader;

	}

	constructOutput( /* builder */  ) {

		return this.outNode;

	}

	constructDiffuseColor( /* builder */  ) {}

	customProgramCacheKey () {

		return this.name;

	}

}

export { AnaglyphMaterial };