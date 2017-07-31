(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

var environment = new Map();

function getEnvironmentValue ( item, defaultValue ) {

	if ( environment.has( item ) ) {

		return environment.get( item );

	} else {

		return defaultValue;

	}

}

function replaceExtension( fileName, newExtention ) {

	return fileName.split( '.' ).shift() + '.' + newExtention;

}

// polyfill padStart for IE11 - now supported for Chrome, FireFox and Edge

if ( ! String.prototype.padStart ) {

	String.prototype.padStart = function padStart( targetLength, padString ) {

		targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
		padString = String( padString || ' ' );

		if (this.length > targetLength) {

			return String( this );

		} else {

			targetLength = targetLength - this.length;

			if ( targetLength > padString.length ) {

				padString += padString.repeat( targetLength / padString.length ); //append to original to ensure we are longer than needed

			}

			return padString.slice( 0, targetLength ) + String( this );

		}

	};

}

if ( ! String.prototype.repeat ) {

	String.prototype.repeat = function( count ) {

		if ( this == null ) throw new TypeError( 'can\'t convert ' + this + ' to object' );

		var str = '' + this;

		count = +count;

		if ( count != count ) count = 0;

		if ( count < 0 ) throw new RangeError( 'repeat count must be non-negative' );

		if ( count == Infinity ) throw new RangeError( 'repeat count must be less than infinity' );

		count = Math.floor( count );

		if ( str.length == 0 || count == 0 ) return '';

		// Ensuring count is a 31-bit integer allows us to heavily optimize the
		// main part. But anyway, most current (August 2014) browsers can't handle
		// strings 1 << 28 chars or longer, so:

		if ( str.length * count >= 1 << 28 ) throw new RangeError('repeat count must not overflow maximum string size');

		var rpt = '';

		for (;;) {

			if ( ( count & 1) == 1 ) rpt += str;

			count >>>= 1;

			if ( count == 0 ) break;

			str += str;

		}

		// Could we try:
		// return Array(count + 1).join(this);

		return rpt;

	};

}




// EOF

/**
 * @author alteredq / http://alteredqualia.com/
 * @author mrdoob / http://mrdoob.com/
 */

var _Math = {

	DEG2RAD: Math.PI / 180,
	RAD2DEG: 180 / Math.PI,

	generateUUID: function () {

		// http://www.broofa.com/Tools/Math.uuid.htm

		var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split( '' );
		var uuid = new Array( 36 );
		var rnd = 0, r;

		return function generateUUID() {

			for ( var i = 0; i < 36; i ++ ) {

				if ( i === 8 || i === 13 || i === 18 || i === 23 ) {

					uuid[ i ] = '-';

				} else if ( i === 14 ) {

					uuid[ i ] = '4';

				} else {

					if ( rnd <= 0x02 ) rnd = 0x2000000 + ( Math.random() * 0x1000000 ) | 0;
					r = rnd & 0xf;
					rnd = rnd >> 4;
					uuid[ i ] = chars[ ( i === 19 ) ? ( r & 0x3 ) | 0x8 : r ];

				}

			}

			return uuid.join( '' );

		};

	}(),

	clamp: function ( value, min, max ) {

		return Math.max( min, Math.min( max, value ) );

	},

	// compute euclidian modulo of m % n
	// https://en.wikipedia.org/wiki/Modulo_operation

	euclideanModulo: function ( n, m ) {

		return ( ( n % m ) + m ) % m;

	},

	// Linear mapping from range <a1, a2> to range <b1, b2>

	mapLinear: function ( x, a1, a2, b1, b2 ) {

		return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );

	},

	// https://en.wikipedia.org/wiki/Linear_interpolation

	lerp: function ( x, y, t ) {

		return ( 1 - t ) * x + t * y;

	},

	// http://en.wikipedia.org/wiki/Smoothstep

	smoothstep: function ( x, min, max ) {

		if ( x <= min ) return 0;
		if ( x >= max ) return 1;

		x = ( x - min ) / ( max - min );

		return x * x * ( 3 - 2 * x );

	},

	smootherstep: function ( x, min, max ) {

		if ( x <= min ) return 0;
		if ( x >= max ) return 1;

		x = ( x - min ) / ( max - min );

		return x * x * x * ( x * ( x * 6 - 15 ) + 10 );

	},

	// Random integer from <low, high> interval

	randInt: function ( low, high ) {

		return low + Math.floor( Math.random() * ( high - low + 1 ) );

	},

	// Random float from <low, high> interval

	randFloat: function ( low, high ) {

		return low + Math.random() * ( high - low );

	},

	// Random float from <-range/2, range/2> interval

	randFloatSpread: function ( range ) {

		return range * ( 0.5 - Math.random() );

	},

	degToRad: function ( degrees ) {

		return degrees * _Math.DEG2RAD;

	},

	radToDeg: function ( radians ) {

		return radians * _Math.RAD2DEG;

	},

	isPowerOfTwo: function ( value ) {

		return ( value & ( value - 1 ) ) === 0 && value !== 0;

	},

	nearestPowerOfTwo: function ( value ) {

		return Math.pow( 2, Math.round( Math.log( value ) / Math.LN2 ) );

	},

	nextPowerOfTwo: function ( value ) {

		value --;
		value |= value >> 1;
		value |= value >> 2;
		value |= value >> 4;
		value |= value >> 8;
		value |= value >> 16;
		value ++;

		return value;

	}

};

/**
 * @author mrdoob / http://mrdoob.com/
 * @author supereggbert / http://www.paulbrunt.co.uk/
 * @author philogb / http://blog.thejit.org/
 * @author jordi_ros / http://plattsoft.com
 * @author D1plo1d / http://github.com/D1plo1d
 * @author alteredq / http://alteredqualia.com/
 * @author mikael emtinger / http://gomo.se/
 * @author timknip / http://www.floorplanner.com/
 * @author bhouston / http://clara.io
 * @author WestLangley / http://github.com/WestLangley
 */

function Matrix4() {

	this.elements = [

		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1

	];

	if ( arguments.length > 0 ) {

		console.error( 'THREE.Matrix4: the constructor no longer reads arguments. use .set() instead.' );

	}

}

Object.assign( Matrix4.prototype, {

	isMatrix4: true,

	set: function ( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ) {

		var te = this.elements;

		te[ 0 ] = n11; te[ 4 ] = n12; te[ 8 ] = n13; te[ 12 ] = n14;
		te[ 1 ] = n21; te[ 5 ] = n22; te[ 9 ] = n23; te[ 13 ] = n24;
		te[ 2 ] = n31; te[ 6 ] = n32; te[ 10 ] = n33; te[ 14 ] = n34;
		te[ 3 ] = n41; te[ 7 ] = n42; te[ 11 ] = n43; te[ 15 ] = n44;

		return this;

	},

	identity: function () {

		this.set(

			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1

		);

		return this;

	},

	clone: function () {

		return new Matrix4().fromArray( this.elements );

	},

	copy: function ( m ) {

		var te = this.elements;
		var me = m.elements;

		te[ 0 ] = me[ 0 ]; te[ 1 ] = me[ 1 ]; te[ 2 ] = me[ 2 ]; te[ 3 ] = me[ 3 ];
		te[ 4 ] = me[ 4 ]; te[ 5 ] = me[ 5 ]; te[ 6 ] = me[ 6 ]; te[ 7 ] = me[ 7 ];
		te[ 8 ] = me[ 8 ]; te[ 9 ] = me[ 9 ]; te[ 10 ] = me[ 10 ]; te[ 11 ] = me[ 11 ];
		te[ 12 ] = me[ 12 ]; te[ 13 ] = me[ 13 ]; te[ 14 ] = me[ 14 ]; te[ 15 ] = me[ 15 ];

		return this;

	},

	copyPosition: function ( m ) {

		var te = this.elements, me = m.elements;

		te[ 12 ] = me[ 12 ];
		te[ 13 ] = me[ 13 ];
		te[ 14 ] = me[ 14 ];

		return this;

	},

	extractBasis: function ( xAxis, yAxis, zAxis ) {

		xAxis.setFromMatrixColumn( this, 0 );
		yAxis.setFromMatrixColumn( this, 1 );
		zAxis.setFromMatrixColumn( this, 2 );

		return this;

	},

	makeBasis: function ( xAxis, yAxis, zAxis ) {

		this.set(
			xAxis.x, yAxis.x, zAxis.x, 0,
			xAxis.y, yAxis.y, zAxis.y, 0,
			xAxis.z, yAxis.z, zAxis.z, 0,
			0,       0,       0,       1
		);

		return this;

	},

	extractRotation: function () {

		var v1 = new Vector3();

		return function extractRotation( m ) {

			var te = this.elements;
			var me = m.elements;

			var scaleX = 1 / v1.setFromMatrixColumn( m, 0 ).length();
			var scaleY = 1 / v1.setFromMatrixColumn( m, 1 ).length();
			var scaleZ = 1 / v1.setFromMatrixColumn( m, 2 ).length();

			te[ 0 ] = me[ 0 ] * scaleX;
			te[ 1 ] = me[ 1 ] * scaleX;
			te[ 2 ] = me[ 2 ] * scaleX;

			te[ 4 ] = me[ 4 ] * scaleY;
			te[ 5 ] = me[ 5 ] * scaleY;
			te[ 6 ] = me[ 6 ] * scaleY;

			te[ 8 ] = me[ 8 ] * scaleZ;
			te[ 9 ] = me[ 9 ] * scaleZ;
			te[ 10 ] = me[ 10 ] * scaleZ;

			return this;

		};

	}(),

	makeRotationFromEuler: function ( euler ) {

		if ( ! ( euler && euler.isEuler ) ) {

			console.error( 'THREE.Matrix: .makeRotationFromEuler() now expects a Euler rotation rather than a Vector3 and order.' );

		}

		var te = this.elements;

		var x = euler.x, y = euler.y, z = euler.z;
		var a = Math.cos( x ), b = Math.sin( x );
		var c = Math.cos( y ), d = Math.sin( y );
		var e = Math.cos( z ), f = Math.sin( z );

		if ( euler.order === 'XYZ' ) {

			var ae = a * e, af = a * f, be = b * e, bf = b * f;

			te[ 0 ] = c * e;
			te[ 4 ] = - c * f;
			te[ 8 ] = d;

			te[ 1 ] = af + be * d;
			te[ 5 ] = ae - bf * d;
			te[ 9 ] = - b * c;

			te[ 2 ] = bf - ae * d;
			te[ 6 ] = be + af * d;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'YXZ' ) {

			var ce = c * e, cf = c * f, de = d * e, df = d * f;

			te[ 0 ] = ce + df * b;
			te[ 4 ] = de * b - cf;
			te[ 8 ] = a * d;

			te[ 1 ] = a * f;
			te[ 5 ] = a * e;
			te[ 9 ] = - b;

			te[ 2 ] = cf * b - de;
			te[ 6 ] = df + ce * b;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'ZXY' ) {

			var ce = c * e, cf = c * f, de = d * e, df = d * f;

			te[ 0 ] = ce - df * b;
			te[ 4 ] = - a * f;
			te[ 8 ] = de + cf * b;

			te[ 1 ] = cf + de * b;
			te[ 5 ] = a * e;
			te[ 9 ] = df - ce * b;

			te[ 2 ] = - a * d;
			te[ 6 ] = b;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'ZYX' ) {

			var ae = a * e, af = a * f, be = b * e, bf = b * f;

			te[ 0 ] = c * e;
			te[ 4 ] = be * d - af;
			te[ 8 ] = ae * d + bf;

			te[ 1 ] = c * f;
			te[ 5 ] = bf * d + ae;
			te[ 9 ] = af * d - be;

			te[ 2 ] = - d;
			te[ 6 ] = b * c;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'YZX' ) {

			var ac = a * c, ad = a * d, bc = b * c, bd = b * d;

			te[ 0 ] = c * e;
			te[ 4 ] = bd - ac * f;
			te[ 8 ] = bc * f + ad;

			te[ 1 ] = f;
			te[ 5 ] = a * e;
			te[ 9 ] = - b * e;

			te[ 2 ] = - d * e;
			te[ 6 ] = ad * f + bc;
			te[ 10 ] = ac - bd * f;

		} else if ( euler.order === 'XZY' ) {

			var ac = a * c, ad = a * d, bc = b * c, bd = b * d;

			te[ 0 ] = c * e;
			te[ 4 ] = - f;
			te[ 8 ] = d * e;

			te[ 1 ] = ac * f + bd;
			te[ 5 ] = a * e;
			te[ 9 ] = ad * f - bc;

			te[ 2 ] = bc * f - ad;
			te[ 6 ] = b * e;
			te[ 10 ] = bd * f + ac;

		}

		// last column
		te[ 3 ] = 0;
		te[ 7 ] = 0;
		te[ 11 ] = 0;

		// bottom row
		te[ 12 ] = 0;
		te[ 13 ] = 0;
		te[ 14 ] = 0;
		te[ 15 ] = 1;

		return this;

	},

	makeRotationFromQuaternion: function ( q ) {

		var te = this.elements;

		var x = q._x, y = q._y, z = q._z, w = q._w;
		var x2 = x + x, y2 = y + y, z2 = z + z;
		var xx = x * x2, xy = x * y2, xz = x * z2;
		var yy = y * y2, yz = y * z2, zz = z * z2;
		var wx = w * x2, wy = w * y2, wz = w * z2;

		te[ 0 ] = 1 - ( yy + zz );
		te[ 4 ] = xy - wz;
		te[ 8 ] = xz + wy;

		te[ 1 ] = xy + wz;
		te[ 5 ] = 1 - ( xx + zz );
		te[ 9 ] = yz - wx;

		te[ 2 ] = xz - wy;
		te[ 6 ] = yz + wx;
		te[ 10 ] = 1 - ( xx + yy );

		// last column
		te[ 3 ] = 0;
		te[ 7 ] = 0;
		te[ 11 ] = 0;

		// bottom row
		te[ 12 ] = 0;
		te[ 13 ] = 0;
		te[ 14 ] = 0;
		te[ 15 ] = 1;

		return this;

	},

	lookAt: function () {

		var x = new Vector3();
		var y = new Vector3();
		var z = new Vector3();

		return function lookAt( eye, target, up ) {

			var te = this.elements;

			z.subVectors( eye, target );

			if ( z.lengthSq() === 0 ) {

				// eye and target are in the same position

				z.z = 1;

			}

			z.normalize();
			x.crossVectors( up, z );

			if ( x.lengthSq() === 0 ) {

				// up and z are parallel

				if ( Math.abs( up.z ) === 1 ) {

					z.x += 0.0001;

				} else {

					z.z += 0.0001;

				}

				z.normalize();
				x.crossVectors( up, z );

			}

			x.normalize();
			y.crossVectors( z, x );

			te[ 0 ] = x.x; te[ 4 ] = y.x; te[ 8 ] = z.x;
			te[ 1 ] = x.y; te[ 5 ] = y.y; te[ 9 ] = z.y;
			te[ 2 ] = x.z; te[ 6 ] = y.z; te[ 10 ] = z.z;

			return this;

		};

	}(),

	multiply: function ( m, n ) {

		if ( n !== undefined ) {

			console.warn( 'THREE.Matrix4: .multiply() now only accepts one argument. Use .multiplyMatrices( a, b ) instead.' );
			return this.multiplyMatrices( m, n );

		}

		return this.multiplyMatrices( this, m );

	},

	premultiply: function ( m ) {

		return this.multiplyMatrices( m, this );

	},

	multiplyMatrices: function ( a, b ) {

		var ae = a.elements;
		var be = b.elements;
		var te = this.elements;

		var a11 = ae[ 0 ], a12 = ae[ 4 ], a13 = ae[ 8 ], a14 = ae[ 12 ];
		var a21 = ae[ 1 ], a22 = ae[ 5 ], a23 = ae[ 9 ], a24 = ae[ 13 ];
		var a31 = ae[ 2 ], a32 = ae[ 6 ], a33 = ae[ 10 ], a34 = ae[ 14 ];
		var a41 = ae[ 3 ], a42 = ae[ 7 ], a43 = ae[ 11 ], a44 = ae[ 15 ];

		var b11 = be[ 0 ], b12 = be[ 4 ], b13 = be[ 8 ], b14 = be[ 12 ];
		var b21 = be[ 1 ], b22 = be[ 5 ], b23 = be[ 9 ], b24 = be[ 13 ];
		var b31 = be[ 2 ], b32 = be[ 6 ], b33 = be[ 10 ], b34 = be[ 14 ];
		var b41 = be[ 3 ], b42 = be[ 7 ], b43 = be[ 11 ], b44 = be[ 15 ];

		te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
		te[ 4 ] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
		te[ 8 ] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
		te[ 12 ] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

		te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
		te[ 5 ] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
		te[ 9 ] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
		te[ 13 ] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

		te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
		te[ 6 ] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
		te[ 10 ] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
		te[ 14 ] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

		te[ 3 ] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
		te[ 7 ] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
		te[ 11 ] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
		te[ 15 ] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

		return this;

	},

	multiplyScalar: function ( s ) {

		var te = this.elements;

		te[ 0 ] *= s; te[ 4 ] *= s; te[ 8 ] *= s; te[ 12 ] *= s;
		te[ 1 ] *= s; te[ 5 ] *= s; te[ 9 ] *= s; te[ 13 ] *= s;
		te[ 2 ] *= s; te[ 6 ] *= s; te[ 10 ] *= s; te[ 14 ] *= s;
		te[ 3 ] *= s; te[ 7 ] *= s; te[ 11 ] *= s; te[ 15 ] *= s;

		return this;

	},

	applyToBufferAttribute: function () {

		var v1 = new Vector3();

		return function applyToBufferAttribute( attribute ) {

			for ( var i = 0, l = attribute.count; i < l; i ++ ) {

				v1.x = attribute.getX( i );
				v1.y = attribute.getY( i );
				v1.z = attribute.getZ( i );

				v1.applyMatrix4( this );

				attribute.setXYZ( i, v1.x, v1.y, v1.z );

			}

			return attribute;

		};

	}(),

	determinant: function () {

		var te = this.elements;

		var n11 = te[ 0 ], n12 = te[ 4 ], n13 = te[ 8 ], n14 = te[ 12 ];
		var n21 = te[ 1 ], n22 = te[ 5 ], n23 = te[ 9 ], n24 = te[ 13 ];
		var n31 = te[ 2 ], n32 = te[ 6 ], n33 = te[ 10 ], n34 = te[ 14 ];
		var n41 = te[ 3 ], n42 = te[ 7 ], n43 = te[ 11 ], n44 = te[ 15 ];

		//TODO: make this more efficient
		//( based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm )

		return (
			n41 * (
				+ n14 * n23 * n32
				 - n13 * n24 * n32
				 - n14 * n22 * n33
				 + n12 * n24 * n33
				 + n13 * n22 * n34
				 - n12 * n23 * n34
			) +
			n42 * (
				+ n11 * n23 * n34
				 - n11 * n24 * n33
				 + n14 * n21 * n33
				 - n13 * n21 * n34
				 + n13 * n24 * n31
				 - n14 * n23 * n31
			) +
			n43 * (
				+ n11 * n24 * n32
				 - n11 * n22 * n34
				 - n14 * n21 * n32
				 + n12 * n21 * n34
				 + n14 * n22 * n31
				 - n12 * n24 * n31
			) +
			n44 * (
				- n13 * n22 * n31
				 - n11 * n23 * n32
				 + n11 * n22 * n33
				 + n13 * n21 * n32
				 - n12 * n21 * n33
				 + n12 * n23 * n31
			)

		);

	},

	transpose: function () {

		var te = this.elements;
		var tmp;

		tmp = te[ 1 ]; te[ 1 ] = te[ 4 ]; te[ 4 ] = tmp;
		tmp = te[ 2 ]; te[ 2 ] = te[ 8 ]; te[ 8 ] = tmp;
		tmp = te[ 6 ]; te[ 6 ] = te[ 9 ]; te[ 9 ] = tmp;

		tmp = te[ 3 ]; te[ 3 ] = te[ 12 ]; te[ 12 ] = tmp;
		tmp = te[ 7 ]; te[ 7 ] = te[ 13 ]; te[ 13 ] = tmp;
		tmp = te[ 11 ]; te[ 11 ] = te[ 14 ]; te[ 14 ] = tmp;

		return this;

	},

	setPosition: function ( v ) {

		var te = this.elements;

		te[ 12 ] = v.x;
		te[ 13 ] = v.y;
		te[ 14 ] = v.z;

		return this;

	},

	getInverse: function ( m, throwOnDegenerate ) {

		// based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
		var te = this.elements,
			me = m.elements,

			n11 = me[ 0 ], n21 = me[ 1 ], n31 = me[ 2 ], n41 = me[ 3 ],
			n12 = me[ 4 ], n22 = me[ 5 ], n32 = me[ 6 ], n42 = me[ 7 ],
			n13 = me[ 8 ], n23 = me[ 9 ], n33 = me[ 10 ], n43 = me[ 11 ],
			n14 = me[ 12 ], n24 = me[ 13 ], n34 = me[ 14 ], n44 = me[ 15 ],

			t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
			t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
			t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
			t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

		var det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

		if ( det === 0 ) {

			var msg = "THREE.Matrix4.getInverse(): can't invert matrix, determinant is 0";

			if ( throwOnDegenerate === true ) {

				throw new Error( msg );

			} else {

				console.warn( msg );

			}

			return this.identity();

		}

		var detInv = 1 / det;

		te[ 0 ] = t11 * detInv;
		te[ 1 ] = ( n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44 ) * detInv;
		te[ 2 ] = ( n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44 ) * detInv;
		te[ 3 ] = ( n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43 ) * detInv;

		te[ 4 ] = t12 * detInv;
		te[ 5 ] = ( n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44 ) * detInv;
		te[ 6 ] = ( n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44 ) * detInv;
		te[ 7 ] = ( n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43 ) * detInv;

		te[ 8 ] = t13 * detInv;
		te[ 9 ] = ( n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44 ) * detInv;
		te[ 10 ] = ( n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44 ) * detInv;
		te[ 11 ] = ( n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43 ) * detInv;

		te[ 12 ] = t14 * detInv;
		te[ 13 ] = ( n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34 ) * detInv;
		te[ 14 ] = ( n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34 ) * detInv;
		te[ 15 ] = ( n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33 ) * detInv;

		return this;

	},

	scale: function ( v ) {

		var te = this.elements;
		var x = v.x, y = v.y, z = v.z;

		te[ 0 ] *= x; te[ 4 ] *= y; te[ 8 ] *= z;
		te[ 1 ] *= x; te[ 5 ] *= y; te[ 9 ] *= z;
		te[ 2 ] *= x; te[ 6 ] *= y; te[ 10 ] *= z;
		te[ 3 ] *= x; te[ 7 ] *= y; te[ 11 ] *= z;

		return this;

	},

	getMaxScaleOnAxis: function () {

		var te = this.elements;

		var scaleXSq = te[ 0 ] * te[ 0 ] + te[ 1 ] * te[ 1 ] + te[ 2 ] * te[ 2 ];
		var scaleYSq = te[ 4 ] * te[ 4 ] + te[ 5 ] * te[ 5 ] + te[ 6 ] * te[ 6 ];
		var scaleZSq = te[ 8 ] * te[ 8 ] + te[ 9 ] * te[ 9 ] + te[ 10 ] * te[ 10 ];

		return Math.sqrt( Math.max( scaleXSq, scaleYSq, scaleZSq ) );

	},

	makeTranslation: function ( x, y, z ) {

		this.set(

			1, 0, 0, x,
			0, 1, 0, y,
			0, 0, 1, z,
			0, 0, 0, 1

		);

		return this;

	},

	makeRotationX: function ( theta ) {

		var c = Math.cos( theta ), s = Math.sin( theta );

		this.set(

			1, 0,  0, 0,
			0, c, - s, 0,
			0, s,  c, 0,
			0, 0,  0, 1

		);

		return this;

	},

	makeRotationY: function ( theta ) {

		var c = Math.cos( theta ), s = Math.sin( theta );

		this.set(

			 c, 0, s, 0,
			 0, 1, 0, 0,
			- s, 0, c, 0,
			 0, 0, 0, 1

		);

		return this;

	},

	makeRotationZ: function ( theta ) {

		var c = Math.cos( theta ), s = Math.sin( theta );

		this.set(

			c, - s, 0, 0,
			s,  c, 0, 0,
			0,  0, 1, 0,
			0,  0, 0, 1

		);

		return this;

	},

	makeRotationAxis: function ( axis, angle ) {

		// Based on http://www.gamedev.net/reference/articles/article1199.asp

		var c = Math.cos( angle );
		var s = Math.sin( angle );
		var t = 1 - c;
		var x = axis.x, y = axis.y, z = axis.z;
		var tx = t * x, ty = t * y;

		this.set(

			tx * x + c, tx * y - s * z, tx * z + s * y, 0,
			tx * y + s * z, ty * y + c, ty * z - s * x, 0,
			tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
			0, 0, 0, 1

		);

		 return this;

	},

	makeScale: function ( x, y, z ) {

		this.set(

			x, 0, 0, 0,
			0, y, 0, 0,
			0, 0, z, 0,
			0, 0, 0, 1

		);

		return this;

	},

	makeShear: function ( x, y, z ) {

		this.set(

			1, y, z, 0,
			x, 1, z, 0,
			x, y, 1, 0,
			0, 0, 0, 1

		);

		return this;

	},

	compose: function ( position, quaternion, scale ) {

		this.makeRotationFromQuaternion( quaternion );
		this.scale( scale );
		this.setPosition( position );

		return this;

	},

	decompose: function () {

		var vector = new Vector3();
		var matrix = new Matrix4();

		return function decompose( position, quaternion, scale ) {

			var te = this.elements;

			var sx = vector.set( te[ 0 ], te[ 1 ], te[ 2 ] ).length();
			var sy = vector.set( te[ 4 ], te[ 5 ], te[ 6 ] ).length();
			var sz = vector.set( te[ 8 ], te[ 9 ], te[ 10 ] ).length();

			// if determine is negative, we need to invert one scale
			var det = this.determinant();
			if ( det < 0 ) sx = - sx;

			position.x = te[ 12 ];
			position.y = te[ 13 ];
			position.z = te[ 14 ];

			// scale the rotation part
			matrix.copy( this );

			var invSX = 1 / sx;
			var invSY = 1 / sy;
			var invSZ = 1 / sz;

			matrix.elements[ 0 ] *= invSX;
			matrix.elements[ 1 ] *= invSX;
			matrix.elements[ 2 ] *= invSX;

			matrix.elements[ 4 ] *= invSY;
			matrix.elements[ 5 ] *= invSY;
			matrix.elements[ 6 ] *= invSY;

			matrix.elements[ 8 ] *= invSZ;
			matrix.elements[ 9 ] *= invSZ;
			matrix.elements[ 10 ] *= invSZ;

			quaternion.setFromRotationMatrix( matrix );

			scale.x = sx;
			scale.y = sy;
			scale.z = sz;

			return this;

		};

	}(),

	makePerspective: function ( left, right, top, bottom, near, far ) {

		if ( far === undefined ) {

			console.warn( 'THREE.Matrix4: .makePerspective() has been redefined and has a new signature. Please check the docs.' );

		}

		var te = this.elements;
		var x = 2 * near / ( right - left );
		var y = 2 * near / ( top - bottom );

		var a = ( right + left ) / ( right - left );
		var b = ( top + bottom ) / ( top - bottom );
		var c = - ( far + near ) / ( far - near );
		var d = - 2 * far * near / ( far - near );

		te[ 0 ] = x;	te[ 4 ] = 0;	te[ 8 ] = a;	te[ 12 ] = 0;
		te[ 1 ] = 0;	te[ 5 ] = y;	te[ 9 ] = b;	te[ 13 ] = 0;
		te[ 2 ] = 0;	te[ 6 ] = 0;	te[ 10 ] = c;	te[ 14 ] = d;
		te[ 3 ] = 0;	te[ 7 ] = 0;	te[ 11 ] = - 1;	te[ 15 ] = 0;

		return this;

	},

	makeOrthographic: function ( left, right, top, bottom, near, far ) {

		var te = this.elements;
		var w = 1.0 / ( right - left );
		var h = 1.0 / ( top - bottom );
		var p = 1.0 / ( far - near );

		var x = ( right + left ) * w;
		var y = ( top + bottom ) * h;
		var z = ( far + near ) * p;

		te[ 0 ] = 2 * w;	te[ 4 ] = 0;	te[ 8 ] = 0;	te[ 12 ] = - x;
		te[ 1 ] = 0;	te[ 5 ] = 2 * h;	te[ 9 ] = 0;	te[ 13 ] = - y;
		te[ 2 ] = 0;	te[ 6 ] = 0;	te[ 10 ] = - 2 * p;	te[ 14 ] = - z;
		te[ 3 ] = 0;	te[ 7 ] = 0;	te[ 11 ] = 0;	te[ 15 ] = 1;

		return this;

	},

	equals: function ( matrix ) {

		var te = this.elements;
		var me = matrix.elements;

		for ( var i = 0; i < 16; i ++ ) {

			if ( te[ i ] !== me[ i ] ) return false;

		}

		return true;

	},

	fromArray: function ( array, offset ) {

		if ( offset === undefined ) offset = 0;

		for ( var i = 0; i < 16; i ++ ) {

			this.elements[ i ] = array[ i + offset ];

		}

		return this;

	},

	toArray: function ( array, offset ) {

		if ( array === undefined ) array = [];
		if ( offset === undefined ) offset = 0;

		var te = this.elements;

		array[ offset ] = te[ 0 ];
		array[ offset + 1 ] = te[ 1 ];
		array[ offset + 2 ] = te[ 2 ];
		array[ offset + 3 ] = te[ 3 ];

		array[ offset + 4 ] = te[ 4 ];
		array[ offset + 5 ] = te[ 5 ];
		array[ offset + 6 ] = te[ 6 ];
		array[ offset + 7 ] = te[ 7 ];

		array[ offset + 8 ] = te[ 8 ];
		array[ offset + 9 ] = te[ 9 ];
		array[ offset + 10 ] = te[ 10 ];
		array[ offset + 11 ] = te[ 11 ];

		array[ offset + 12 ] = te[ 12 ];
		array[ offset + 13 ] = te[ 13 ];
		array[ offset + 14 ] = te[ 14 ];
		array[ offset + 15 ] = te[ 15 ];

		return array;

	}

} );

/**
 * @author mikael emtinger / http://gomo.se/
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author bhouston / http://clara.io
 */

function Quaternion( x, y, z, w ) {

	this._x = x || 0;
	this._y = y || 0;
	this._z = z || 0;
	this._w = ( w !== undefined ) ? w : 1;

}

Object.assign( Quaternion, {

	slerp: function ( qa, qb, qm, t ) {

		return qm.copy( qa ).slerp( qb, t );

	},

	slerpFlat: function ( dst, dstOffset, src0, srcOffset0, src1, srcOffset1, t ) {

		// fuzz-free, array-based Quaternion SLERP operation

		var x0 = src0[ srcOffset0 + 0 ],
			y0 = src0[ srcOffset0 + 1 ],
			z0 = src0[ srcOffset0 + 2 ],
			w0 = src0[ srcOffset0 + 3 ],

			x1 = src1[ srcOffset1 + 0 ],
			y1 = src1[ srcOffset1 + 1 ],
			z1 = src1[ srcOffset1 + 2 ],
			w1 = src1[ srcOffset1 + 3 ];

		if ( w0 !== w1 || x0 !== x1 || y0 !== y1 || z0 !== z1 ) {

			var s = 1 - t,

				cos = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1,

				dir = ( cos >= 0 ? 1 : - 1 ),
				sqrSin = 1 - cos * cos;

			// Skip the Slerp for tiny steps to avoid numeric problems:
			if ( sqrSin > Number.EPSILON ) {

				var sin = Math.sqrt( sqrSin ),
					len = Math.atan2( sin, cos * dir );

				s = Math.sin( s * len ) / sin;
				t = Math.sin( t * len ) / sin;

			}

			var tDir = t * dir;

			x0 = x0 * s + x1 * tDir;
			y0 = y0 * s + y1 * tDir;
			z0 = z0 * s + z1 * tDir;
			w0 = w0 * s + w1 * tDir;

			// Normalize in case we just did a lerp:
			if ( s === 1 - t ) {

				var f = 1 / Math.sqrt( x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0 );

				x0 *= f;
				y0 *= f;
				z0 *= f;
				w0 *= f;

			}

		}

		dst[ dstOffset ] = x0;
		dst[ dstOffset + 1 ] = y0;
		dst[ dstOffset + 2 ] = z0;
		dst[ dstOffset + 3 ] = w0;

	}

} );

Object.defineProperties( Quaternion.prototype, {

	x: {

		get: function () {

			return this._x;

		},

		set: function ( value ) {

			this._x = value;
			this.onChangeCallback();

		}

	},

	y: {

		get: function () {

			return this._y;

		},

		set: function ( value ) {

			this._y = value;
			this.onChangeCallback();

		}

	},

	z: {

		get: function () {

			return this._z;

		},

		set: function ( value ) {

			this._z = value;
			this.onChangeCallback();

		}

	},

	w: {

		get: function () {

			return this._w;

		},

		set: function ( value ) {

			this._w = value;
			this.onChangeCallback();

		}

	}

} );

Object.assign( Quaternion.prototype, {

	set: function ( x, y, z, w ) {

		this._x = x;
		this._y = y;
		this._z = z;
		this._w = w;

		this.onChangeCallback();

		return this;

	},

	clone: function () {

		return new this.constructor( this._x, this._y, this._z, this._w );

	},

	copy: function ( quaternion ) {

		this._x = quaternion.x;
		this._y = quaternion.y;
		this._z = quaternion.z;
		this._w = quaternion.w;

		this.onChangeCallback();

		return this;

	},

	setFromEuler: function ( euler, update ) {

		if ( ! ( euler && euler.isEuler ) ) {

			throw new Error( 'THREE.Quaternion: .setFromEuler() now expects an Euler rotation rather than a Vector3 and order.' );

		}

		var x = euler._x, y = euler._y, z = euler._z, order = euler.order;

		// http://www.mathworks.com/matlabcentral/fileexchange/
		// 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
		//	content/SpinCalc.m

		var cos = Math.cos;
		var sin = Math.sin;

		var c1 = cos( x / 2 );
		var c2 = cos( y / 2 );
		var c3 = cos( z / 2 );

		var s1 = sin( x / 2 );
		var s2 = sin( y / 2 );
		var s3 = sin( z / 2 );

		if ( order === 'XYZ' ) {

			this._x = s1 * c2 * c3 + c1 * s2 * s3;
			this._y = c1 * s2 * c3 - s1 * c2 * s3;
			this._z = c1 * c2 * s3 + s1 * s2 * c3;
			this._w = c1 * c2 * c3 - s1 * s2 * s3;

		} else if ( order === 'YXZ' ) {

			this._x = s1 * c2 * c3 + c1 * s2 * s3;
			this._y = c1 * s2 * c3 - s1 * c2 * s3;
			this._z = c1 * c2 * s3 - s1 * s2 * c3;
			this._w = c1 * c2 * c3 + s1 * s2 * s3;

		} else if ( order === 'ZXY' ) {

			this._x = s1 * c2 * c3 - c1 * s2 * s3;
			this._y = c1 * s2 * c3 + s1 * c2 * s3;
			this._z = c1 * c2 * s3 + s1 * s2 * c3;
			this._w = c1 * c2 * c3 - s1 * s2 * s3;

		} else if ( order === 'ZYX' ) {

			this._x = s1 * c2 * c3 - c1 * s2 * s3;
			this._y = c1 * s2 * c3 + s1 * c2 * s3;
			this._z = c1 * c2 * s3 - s1 * s2 * c3;
			this._w = c1 * c2 * c3 + s1 * s2 * s3;

		} else if ( order === 'YZX' ) {

			this._x = s1 * c2 * c3 + c1 * s2 * s3;
			this._y = c1 * s2 * c3 + s1 * c2 * s3;
			this._z = c1 * c2 * s3 - s1 * s2 * c3;
			this._w = c1 * c2 * c3 - s1 * s2 * s3;

		} else if ( order === 'XZY' ) {

			this._x = s1 * c2 * c3 - c1 * s2 * s3;
			this._y = c1 * s2 * c3 - s1 * c2 * s3;
			this._z = c1 * c2 * s3 + s1 * s2 * c3;
			this._w = c1 * c2 * c3 + s1 * s2 * s3;

		}

		if ( update !== false ) this.onChangeCallback();

		return this;

	},

	setFromAxisAngle: function ( axis, angle ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

		// assumes axis is normalized

		var halfAngle = angle / 2, s = Math.sin( halfAngle );

		this._x = axis.x * s;
		this._y = axis.y * s;
		this._z = axis.z * s;
		this._w = Math.cos( halfAngle );

		this.onChangeCallback();

		return this;

	},

	setFromRotationMatrix: function ( m ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		var te = m.elements,

			m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
			m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
			m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ],

			trace = m11 + m22 + m33,
			s;

		if ( trace > 0 ) {

			s = 0.5 / Math.sqrt( trace + 1.0 );

			this._w = 0.25 / s;
			this._x = ( m32 - m23 ) * s;
			this._y = ( m13 - m31 ) * s;
			this._z = ( m21 - m12 ) * s;

		} else if ( m11 > m22 && m11 > m33 ) {

			s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

			this._w = ( m32 - m23 ) / s;
			this._x = 0.25 * s;
			this._y = ( m12 + m21 ) / s;
			this._z = ( m13 + m31 ) / s;

		} else if ( m22 > m33 ) {

			s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

			this._w = ( m13 - m31 ) / s;
			this._x = ( m12 + m21 ) / s;
			this._y = 0.25 * s;
			this._z = ( m23 + m32 ) / s;

		} else {

			s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

			this._w = ( m21 - m12 ) / s;
			this._x = ( m13 + m31 ) / s;
			this._y = ( m23 + m32 ) / s;
			this._z = 0.25 * s;

		}

		this.onChangeCallback();

		return this;

	},

	setFromUnitVectors: function () {

		// assumes direction vectors vFrom and vTo are normalized

		var v1 = new Vector3();
		var r;

		var EPS = 0.000001;

		return function setFromUnitVectors( vFrom, vTo ) {

			if ( v1 === undefined ) v1 = new Vector3();

			r = vFrom.dot( vTo ) + 1;

			if ( r < EPS ) {

				r = 0;

				if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {

					v1.set( - vFrom.y, vFrom.x, 0 );

				} else {

					v1.set( 0, - vFrom.z, vFrom.y );

				}

			} else {

				v1.crossVectors( vFrom, vTo );

			}

			this._x = v1.x;
			this._y = v1.y;
			this._z = v1.z;
			this._w = r;

			return this.normalize();

		};

	}(),

	inverse: function () {

		return this.conjugate().normalize();

	},

	conjugate: function () {

		this._x *= - 1;
		this._y *= - 1;
		this._z *= - 1;

		this.onChangeCallback();

		return this;

	},

	dot: function ( v ) {

		return this._x * v._x + this._y * v._y + this._z * v._z + this._w * v._w;

	},

	lengthSq: function () {

		return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;

	},

	length: function () {

		return Math.sqrt( this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w );

	},

	normalize: function () {

		var l = this.length();

		if ( l === 0 ) {

			this._x = 0;
			this._y = 0;
			this._z = 0;
			this._w = 1;

		} else {

			l = 1 / l;

			this._x = this._x * l;
			this._y = this._y * l;
			this._z = this._z * l;
			this._w = this._w * l;

		}

		this.onChangeCallback();

		return this;

	},

	multiply: function ( q, p ) {

		if ( p !== undefined ) {

			console.warn( 'THREE.Quaternion: .multiply() now only accepts one argument. Use .multiplyQuaternions( a, b ) instead.' );
			return this.multiplyQuaternions( q, p );

		}

		return this.multiplyQuaternions( this, q );

	},

	premultiply: function ( q ) {

		return this.multiplyQuaternions( q, this );

	},

	multiplyQuaternions: function ( a, b ) {

		// from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

		var qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
		var qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;

		this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
		this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
		this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
		this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

		this.onChangeCallback();

		return this;

	},

	slerp: function ( qb, t ) {

		if ( t === 0 ) return this;
		if ( t === 1 ) return this.copy( qb );

		var x = this._x, y = this._y, z = this._z, w = this._w;

		// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

		var cosHalfTheta = w * qb._w + x * qb._x + y * qb._y + z * qb._z;

		if ( cosHalfTheta < 0 ) {

			this._w = - qb._w;
			this._x = - qb._x;
			this._y = - qb._y;
			this._z = - qb._z;

			cosHalfTheta = - cosHalfTheta;

		} else {

			this.copy( qb );

		}

		if ( cosHalfTheta >= 1.0 ) {

			this._w = w;
			this._x = x;
			this._y = y;
			this._z = z;

			return this;

		}

		var sinHalfTheta = Math.sqrt( 1.0 - cosHalfTheta * cosHalfTheta );

		if ( Math.abs( sinHalfTheta ) < 0.001 ) {

			this._w = 0.5 * ( w + this._w );
			this._x = 0.5 * ( x + this._x );
			this._y = 0.5 * ( y + this._y );
			this._z = 0.5 * ( z + this._z );

			return this;

		}

		var halfTheta = Math.atan2( sinHalfTheta, cosHalfTheta );
		var ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
			ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

		this._w = ( w * ratioA + this._w * ratioB );
		this._x = ( x * ratioA + this._x * ratioB );
		this._y = ( y * ratioA + this._y * ratioB );
		this._z = ( z * ratioA + this._z * ratioB );

		this.onChangeCallback();

		return this;

	},

	equals: function ( quaternion ) {

		return ( quaternion._x === this._x ) && ( quaternion._y === this._y ) && ( quaternion._z === this._z ) && ( quaternion._w === this._w );

	},

	fromArray: function ( array, offset ) {

		if ( offset === undefined ) offset = 0;

		this._x = array[ offset ];
		this._y = array[ offset + 1 ];
		this._z = array[ offset + 2 ];
		this._w = array[ offset + 3 ];

		this.onChangeCallback();

		return this;

	},

	toArray: function ( array, offset ) {

		if ( array === undefined ) array = [];
		if ( offset === undefined ) offset = 0;

		array[ offset ] = this._x;
		array[ offset + 1 ] = this._y;
		array[ offset + 2 ] = this._z;
		array[ offset + 3 ] = this._w;

		return array;

	},

	onChange: function ( callback ) {

		this.onChangeCallback = callback;

		return this;

	},

	onChangeCallback: function () {}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author kile / http://kile.stravaganza.org/
 * @author philogb / http://blog.thejit.org/
 * @author mikael emtinger / http://gomo.se/
 * @author egraether / http://egraether.com/
 * @author WestLangley / http://github.com/WestLangley
 */

function Vector3( x, y, z ) {

	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;

}

Object.assign( Vector3.prototype, {

	isVector3: true,

	set: function ( x, y, z ) {

		this.x = x;
		this.y = y;
		this.z = z;

		return this;

	},

	setScalar: function ( scalar ) {

		this.x = scalar;
		this.y = scalar;
		this.z = scalar;

		return this;

	},

	setX: function ( x ) {

		this.x = x;

		return this;

	},

	setY: function ( y ) {

		this.y = y;

		return this;

	},

	setZ: function ( z ) {

		this.z = z;

		return this;

	},

	setComponent: function ( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			case 2: this.z = value; break;
			default: throw new Error( 'index is out of range: ' + index );

		}

		return this;

	},

	getComponent: function ( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			case 2: return this.z;
			default: throw new Error( 'index is out of range: ' + index );

		}

	},

	clone: function () {

		return new this.constructor( this.x, this.y, this.z );

	},

	copy: function ( v ) {

		this.x = v.x;
		this.y = v.y;
		this.z = v.z;

		return this;

	},

	add: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector3: .add() now only accepts one argument. Use .addVectors( a, b ) instead.' );
			return this.addVectors( v, w );

		}

		this.x += v.x;
		this.y += v.y;
		this.z += v.z;

		return this;

	},

	addScalar: function ( s ) {

		this.x += s;
		this.y += s;
		this.z += s;

		return this;

	},

	addVectors: function ( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;
		this.z = a.z + b.z;

		return this;

	},

	addScaledVector: function ( v, s ) {

		this.x += v.x * s;
		this.y += v.y * s;
		this.z += v.z * s;

		return this;

	},

	sub: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector3: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.' );
			return this.subVectors( v, w );

		}

		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;

		return this;

	},

	subScalar: function ( s ) {

		this.x -= s;
		this.y -= s;
		this.z -= s;

		return this;

	},

	subVectors: function ( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;
		this.z = a.z - b.z;

		return this;

	},

	multiply: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector3: .multiply() now only accepts one argument. Use .multiplyVectors( a, b ) instead.' );
			return this.multiplyVectors( v, w );

		}

		this.x *= v.x;
		this.y *= v.y;
		this.z *= v.z;

		return this;

	},

	multiplyScalar: function ( scalar ) {

		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;

		return this;

	},

	multiplyVectors: function ( a, b ) {

		this.x = a.x * b.x;
		this.y = a.y * b.y;
		this.z = a.z * b.z;

		return this;

	},

	applyEuler: function () {

		var quaternion = new Quaternion();

		return function applyEuler( euler ) {

			if ( ! ( euler && euler.isEuler ) ) {

				console.error( 'THREE.Vector3: .applyEuler() now expects an Euler rotation rather than a Vector3 and order.' );

			}

			return this.applyQuaternion( quaternion.setFromEuler( euler ) );

		};

	}(),

	applyAxisAngle: function () {

		var quaternion = new Quaternion();

		return function applyAxisAngle( axis, angle ) {

			return this.applyQuaternion( quaternion.setFromAxisAngle( axis, angle ) );

		};

	}(),

	applyMatrix3: function ( m ) {

		var x = this.x, y = this.y, z = this.z;
		var e = m.elements;

		this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z;
		this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z;
		this.z = e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z;

		return this;

	},

	applyMatrix4: function ( m ) {

		var x = this.x, y = this.y, z = this.z;
		var e = m.elements;

		var w = 1 / ( e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] );

		this.x = ( e[ 0 ] * x + e[ 4 ] * y + e[ 8 ]  * z + e[ 12 ] ) * w;
		this.y = ( e[ 1 ] * x + e[ 5 ] * y + e[ 9 ]  * z + e[ 13 ] ) * w;
		this.z = ( e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] ) * w;

		return this;

	},

	applyQuaternion: function ( q ) {

		var x = this.x, y = this.y, z = this.z;
		var qx = q.x, qy = q.y, qz = q.z, qw = q.w;

		// calculate quat * vector

		var ix =  qw * x + qy * z - qz * y;
		var iy =  qw * y + qz * x - qx * z;
		var iz =  qw * z + qx * y - qy * x;
		var iw = - qx * x - qy * y - qz * z;

		// calculate result * inverse quat

		this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
		this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
		this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

		return this;

	},

	project: function () {

		var matrix = new Matrix4();

		return function project( camera ) {

			matrix.multiplyMatrices( camera.projectionMatrix, matrix.getInverse( camera.matrixWorld ) );
			return this.applyMatrix4( matrix );

		};

	}(),

	unproject: function () {

		var matrix = new Matrix4();

		return function unproject( camera ) {

			matrix.multiplyMatrices( camera.matrixWorld, matrix.getInverse( camera.projectionMatrix ) );
			return this.applyMatrix4( matrix );

		};

	}(),

	transformDirection: function ( m ) {

		// input: THREE.Matrix4 affine matrix
		// vector interpreted as a direction

		var x = this.x, y = this.y, z = this.z;
		var e = m.elements;

		this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ]  * z;
		this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ]  * z;
		this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z;

		return this.normalize();

	},

	divide: function ( v ) {

		this.x /= v.x;
		this.y /= v.y;
		this.z /= v.z;

		return this;

	},

	divideScalar: function ( scalar ) {

		return this.multiplyScalar( 1 / scalar );

	},

	min: function ( v ) {

		this.x = Math.min( this.x, v.x );
		this.y = Math.min( this.y, v.y );
		this.z = Math.min( this.z, v.z );

		return this;

	},

	max: function ( v ) {

		this.x = Math.max( this.x, v.x );
		this.y = Math.max( this.y, v.y );
		this.z = Math.max( this.z, v.z );

		return this;

	},

	clamp: function ( min, max ) {

		// assumes min < max, componentwise

		this.x = Math.max( min.x, Math.min( max.x, this.x ) );
		this.y = Math.max( min.y, Math.min( max.y, this.y ) );
		this.z = Math.max( min.z, Math.min( max.z, this.z ) );

		return this;

	},

	clampScalar: function () {

		var min = new Vector3();
		var max = new Vector3();

		return function clampScalar( minVal, maxVal ) {

			min.set( minVal, minVal, minVal );
			max.set( maxVal, maxVal, maxVal );

			return this.clamp( min, max );

		};

	}(),

	clampLength: function ( min, max ) {

		var length = this.length();

		return this.divideScalar( length || 1 ).multiplyScalar( Math.max( min, Math.min( max, length ) ) );

	},

	floor: function () {

		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );
		this.z = Math.floor( this.z );

		return this;

	},

	ceil: function () {

		this.x = Math.ceil( this.x );
		this.y = Math.ceil( this.y );
		this.z = Math.ceil( this.z );

		return this;

	},

	round: function () {

		this.x = Math.round( this.x );
		this.y = Math.round( this.y );
		this.z = Math.round( this.z );

		return this;

	},

	roundToZero: function () {

		this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
		this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );
		this.z = ( this.z < 0 ) ? Math.ceil( this.z ) : Math.floor( this.z );

		return this;

	},

	negate: function () {

		this.x = - this.x;
		this.y = - this.y;
		this.z = - this.z;

		return this;

	},

	dot: function ( v ) {

		return this.x * v.x + this.y * v.y + this.z * v.z;

	},

	// TODO lengthSquared?

	lengthSq: function () {

		return this.x * this.x + this.y * this.y + this.z * this.z;

	},

	length: function () {

		return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );

	},

	lengthManhattan: function () {

		return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z );

	},

	normalize: function () {

		return this.divideScalar( this.length() || 1 );

	},

	setLength: function ( length ) {

		return this.normalize().multiplyScalar( length );

	},

	lerp: function ( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;
		this.z += ( v.z - this.z ) * alpha;

		return this;

	},

	lerpVectors: function ( v1, v2, alpha ) {

		return this.subVectors( v2, v1 ).multiplyScalar( alpha ).add( v1 );

	},

	cross: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector3: .cross() now only accepts one argument. Use .crossVectors( a, b ) instead.' );
			return this.crossVectors( v, w );

		}

		var x = this.x, y = this.y, z = this.z;

		this.x = y * v.z - z * v.y;
		this.y = z * v.x - x * v.z;
		this.z = x * v.y - y * v.x;

		return this;

	},

	crossVectors: function ( a, b ) {

		var ax = a.x, ay = a.y, az = a.z;
		var bx = b.x, by = b.y, bz = b.z;

		this.x = ay * bz - az * by;
		this.y = az * bx - ax * bz;
		this.z = ax * by - ay * bx;

		return this;

	},

	projectOnVector: function ( vector ) {

		var scalar = vector.dot( this ) / vector.lengthSq();

		return this.copy( vector ).multiplyScalar( scalar );

	},

	projectOnPlane: function () {

		var v1 = new Vector3();

		return function projectOnPlane( planeNormal ) {

			v1.copy( this ).projectOnVector( planeNormal );

			return this.sub( v1 );

		};

	}(),

	reflect: function () {

		// reflect incident vector off plane orthogonal to normal
		// normal is assumed to have unit length

		var v1 = new Vector3();

		return function reflect( normal ) {

			return this.sub( v1.copy( normal ).multiplyScalar( 2 * this.dot( normal ) ) );

		};

	}(),

	angleTo: function ( v ) {

		var theta = this.dot( v ) / ( Math.sqrt( this.lengthSq() * v.lengthSq() ) );

		// clamp, to handle numerical problems

		return Math.acos( _Math.clamp( theta, - 1, 1 ) );

	},

	distanceTo: function ( v ) {

		return Math.sqrt( this.distanceToSquared( v ) );

	},

	distanceToSquared: function ( v ) {

		var dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;

		return dx * dx + dy * dy + dz * dz;

	},

	distanceToManhattan: function ( v ) {

		return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y ) + Math.abs( this.z - v.z );

	},

	setFromSpherical: function ( s ) {

		var sinPhiRadius = Math.sin( s.phi ) * s.radius;

		this.x = sinPhiRadius * Math.sin( s.theta );
		this.y = Math.cos( s.phi ) * s.radius;
		this.z = sinPhiRadius * Math.cos( s.theta );

		return this;

	},

	setFromCylindrical: function ( c ) {

		this.x = c.radius * Math.sin( c.theta );
		this.y = c.y;
		this.z = c.radius * Math.cos( c.theta );

		return this;

	},

	setFromMatrixPosition: function ( m ) {

		var e = m.elements;

		this.x = e[ 12 ];
		this.y = e[ 13 ];
		this.z = e[ 14 ];

		return this;

	},

	setFromMatrixScale: function ( m ) {

		var sx = this.setFromMatrixColumn( m, 0 ).length();
		var sy = this.setFromMatrixColumn( m, 1 ).length();
		var sz = this.setFromMatrixColumn( m, 2 ).length();

		this.x = sx;
		this.y = sy;
		this.z = sz;

		return this;

	},

	setFromMatrixColumn: function ( m, index ) {

		return this.fromArray( m.elements, index * 4 );

	},

	equals: function ( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) );

	},

	fromArray: function ( array, offset ) {

		if ( offset === undefined ) offset = 0;

		this.x = array[ offset ];
		this.y = array[ offset + 1 ];
		this.z = array[ offset + 2 ];

		return this;

	},

	toArray: function ( array, offset ) {

		if ( array === undefined ) array = [];
		if ( offset === undefined ) offset = 0;

		array[ offset ] = this.x;
		array[ offset + 1 ] = this.y;
		array[ offset + 2 ] = this.z;

		return array;

	},

	fromBufferAttribute: function ( attribute, index, offset ) {

		if ( offset !== undefined ) {

			console.warn( 'THREE.Vector3: offset has been removed from .fromBufferAttribute().' );

		}

		this.x = attribute.getX( index );
		this.y = attribute.getY( index );
		this.z = attribute.getZ( index );

		return this;

	}

} );

// preset camera views








// mouse selection operation mode



// shading types














// layer tags for scene objects

var LEG_CAVE              = 1;
var LEG_SPLAY             = 2;
var LEG_SURFACE           = 3;












// flags in legs exported by Cave models






var STATION_NORMAL = 0;
var STATION_ENTRANCE = 1;



// EOF

function Tree( name, id, root, parent ) { // root parameter only used internally

	if ( root === undefined ) {

		this.id = 0;
		this.maxId = 0;
		this.root = this;
		this.parent = null;

	} else {

		this.root = root;
		this.parent = parent;
		this.id = ( id === null ) ? ++root.maxId : id;

	}

	this.name = name || '';
	this.children = [];

}

Tree.prototype.constructor = Tree;

Tree.prototype.traverse = function ( func ) {

	var children = this.children;

	func ( this );

	for ( var i = 0; i < children.length; i++ ) {

		children[ i ].traverse( func );

	}

};

Tree.prototype.traverseDepthFirst = function ( func ) {

	var children = this.children;


	for ( var i = 0; i < children.length; i++ ) {

		children[ i ].traverseDepthFirst( func );

	}

	func ( this );

};

Tree.prototype.forEachChild = function ( func, recurse ) {

	var children = this.children;
	var child;

	for ( var i = 0; i < children.length; i++ ) {

		child = children[ i ];

		func( child );

		if ( recurse === true ) child.forEachChild( func, true );

	}

};

Tree.prototype.addById = function ( name, id, parentId, properties ) {

	var parentNode = this.findById( parentId );

	if ( parentNode ) {

		var node = new Tree( name, id, this.root, parentNode );

		if ( properties !== undefined ) Object.assign( node, properties );

		parentNode.children.push( node );

		var root = this.root;
		root.maxId = Math.max( root.maxId, id );

		return node.id;

	}

	return null;

};

Tree.prototype.findById = function ( id ) {

	if ( this.id == id ) return this;

	for ( var i = 0, l = this.children.length; i < l; i++ ) {

		var child = this.children[ i ];

		var found = child.findById( id );

		if ( found ) return found;

	}

	return undefined;

};

Tree.prototype.getByPath = function ( path ) {

	var pathArray = path.split( '.' );
	var node = this.getByPathArray( pathArray );

	return pathArray.length === 0 ? node : undefined;

};

Tree.prototype.getByPathArray = function ( path ) {

	var node  = this;
	var search = true;

	while ( search && path.length > 0 ) {

		search = false;

		for ( var i = 0, l = node.children.length; i < l; i++ ) {

			var child = node.children[ i ];

			if ( child.name === path[ 0 ] ) {

				node = child;
				path.shift();
				search = true;

				break;

			}

		}

	}

	return node;

};

Tree.prototype.addPath = function ( path, properties ) {

	var node;
	var newNode;

	// find part of path that exists already

	node = this.getByPathArray( path );

	if ( path.length === 0 ) return node.id;

	// add remainder of path to node

	while ( path.length > 0 ) {

		newNode = new Tree( path.shift(), null, this.root, node );

		node.children.push( newNode );
		node = newNode;

	}

	if ( properties !== undefined ) Object.assign( node, properties );

	return node.id;

};

Tree.prototype.getPath = function ( endNode ) {

	var node = this;
	var path = [];

	if ( endNode === undefined ) endNode = this.root;

	do {

		path.push( node.name );
		node = node.parent;

	} while ( node !== endNode );

	return path.reverse().join( '.' );

};

Tree.prototype.getSubtreeIds = function ( id, idSet ) {

	var node = this.findById( id );

	node.traverse( _getId );

	function _getId( node ) {

		idSet.add( node.id );

	}

};

Tree.prototype.getIdByPath = function ( path ) {

	var node = this.getByPathArray( path );

	if ( path.length === 0 ) {

		return node.id;

	} else {

		return undefined;

	}

};



// EOF

// Survex 3d file handler

function Svx3dHandler ( fileName, dataStream, metadata ) {

	this.fileName   = fileName;
	this.groups     = [];
	this.surface    = [];
	this.xGroups    = [];
	this.surveyTree = new Tree();
	this.isRegion   = false;
	this.sourceCRS  = null;
	this.targetCRS  = 'EPSG:3857'; // "web mercator"
	this.projection = null;
	this.metadata   = metadata;

	var source    = dataStream;  // file data as arrrayBuffer
	var pos       = 0;	         // file position

	// read file header

	readLF(); // Survex 3D Image File
	var version = readLF(); // 3d version
	var auxInfo = readNSLF();
	readLF(); // Date

	console.log( 'title: ', auxInfo[ 0 ] );

	var sourceCRS = ( auxInfo[ 1 ] === undefined ) ? null : auxInfo[ 1 ]; // coordinate reference system ( proj4 format )

	if ( sourceCRS !== null ) {

		// work around lack of +init string support in proj4js

		var matches = sourceCRS.match( /\+init=(.*)\s/);

		if ( matches && matches.length === 2 ) {

			switch( matches[ 1 ] ) {

			case 'epsg:27700' :

				sourceCRS = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs';

				break;

			default:

				sourceCRS = null;
				console.warn( 'unsupported projection' );

			}

		}

	}

	// FIXME use NAD grid corrections OSTM15 etc ( UK Centric )

	if ( sourceCRS !== null ) {

		console.log( 'Reprojecting from', sourceCRS, 'to', this.targetCRS );

		this.sourceCRS = sourceCRS;
		this.projection = proj4( this.sourceCRS, this.targetCRS ); // eslint-disable-line no-undef

	}

	this.handleVx( source, pos, Number( version.charAt( 1 ) ) );

	return;

	function readLF () { // read until Line feed

		return readNSLF()[ 0 ];

	}

	function readNSLF () { // read until Line feed and split by null bytes

		var bytes = new Uint8Array( source, 0 );

		var lfString = [];
		var b;
		var strings = [];

		do {

			b = bytes[ pos++ ];

			if ( b === 0x0a || b === 0 ) {

				strings.push( String.fromCharCode.apply( null, lfString ).trim() );
				lfString = [];

			} else {

				lfString.push( b );

			}

		} while ( b != 0x0a );

		return strings;

	}

}

Svx3dHandler.prototype.constructor = Svx3dHandler;

Svx3dHandler.prototype.handleVx = function ( source, pos, version ) {

	var groups     = this.groups;
	var xGroups    = this.xGroups;
	var surveyTree = this.surveyTree;

	var self = this;

	var cmd         = [];
	var legs        = [];
	var label       = '';
	var stations    = new Map();
	var lineEnds    = new Set(); // implied line ends to fixnup xsects
	var xSects      = [];
	var sectionId   = 0;

	var data       = new Uint8Array( source, 0 );
	var dataLength = data.length;
	var lastPosition = { x: 0, y:0, z: 0 }; // value to allow approach vector for xsect coord frame
	var i;

	// functions

	var readLabel;

	// selected correct read coordinates function

	var readCoordinates = ( this.projection === null ) ? __readCoordinates : __readCoordinatesProjected;

	// range

	var min = { x: Infinity, y: Infinity, z: Infinity };
	var max = { x: -Infinity, y: -Infinity, z: -Infinity };

	// init cmd handler table withh  error handler for unsupported records or invalid records

	function _errorHandler ( e ) { console.log ('unhandled command: ', e.toString( 16 ) ); return false; }

	for ( i = 0; i < 256; i++ ) {

		cmd[ i ] = _errorHandler;

	}

	if ( version === 8 ) {
		// v8 dispatch table start

		cmd[ 0x00 ] = cmd_STYLE;
		cmd[ 0x01 ] = cmd_STYLE;
		cmd[ 0x02 ] = cmd_STYLE;
		cmd[ 0x03 ] = cmd_STYLE;
		cmd[ 0x04 ] = cmd_STYLE;

		cmd[ 0x0f ] = cmd_MOVE;
		cmd[ 0x10 ] = cmd_DATE_NODATE;
		cmd[ 0x11 ] = cmd_DATEV8_1;
		cmd[ 0x12 ] = cmd_DATEV8_2;
		cmd[ 0x13 ] = cmd_DATEV8_3;

		cmd[ 0x1F ] = cmd_ERROR;

		cmd[ 0x30 ] = cmd_XSECT16;
		cmd[ 0x31 ] = cmd_XSECT16;

		cmd[ 0x32 ] = cmd_XSECT32;
		cmd[ 0x33 ] = cmd_XSECT32;

		for ( i = 0x40; i < 0x80; i++ ) {

			cmd[ i ] = cmd_LINE;

		}

		for ( i = 0x80; i < 0x100; i++ ) {

			cmd[ i ] = cmd_LABEL;

		}

		// dispatch table end

		readLabel = readLabelV8;

		// skip v8 file wide flags after header
		pos++;

	} else {

		// dispatch table for v7 format

		for ( i = 0x01; i < 0x0f; i++ ) {

			cmd[ i ] = cmd_TRIM_PLUS;

		}

		cmd[ 0x0f ] = cmd_MOVE;

		for ( i = 0x10; i < 0x20; i++ ) {

			cmd[ i ] = cmd_TRIM;

		}

		cmd[ 0x00 ] = cmd_STOP;
		cmd[ 0x20 ] = cmd_DATE_V7;
		cmd[ 0x21 ] = cmd_DATE2_V7;
		cmd[ 0x23 ] = cmd_DATE3_V7;
		cmd[ 0x24 ] = cmd_DATE_NODATE;
		cmd[ 0x22 ] = cmd_ERROR;

		cmd[ 0x30 ] = cmd_XSECT16;
		cmd[ 0x31 ] = cmd_XSECT16;

		cmd[ 0x32 ] = cmd_XSECT32;
		cmd[ 0x33 ] = cmd_XSECT32;

		for ( i = 0x40; i < 0x80; i++ ) {

			cmd[ i ] = cmd_LABEL;

		}

		for ( i = 0x80; i < 0xc0; i++ ) {

			cmd[ i ] = cmd_LINE;

		}
		// dispatch table end

		readLabel = readLabelV7;

	}

	if ( version === 6 ) {

		cmd[ 0x20 ] = cmd_DATE_V4;
		cmd[ 0x21 ] = cmd_DATE2_V4;

	}

	// common record iterator
	// loop though data, handling record types as required.

	while ( pos < dataLength ) {

		if ( ! cmd[ data[ pos ] ]( data[ pos++ ] ) ) break;

	}

	if ( xSects.length > 1 ) {

		xGroups.push( xSects );

	}

	groups.push( legs );

	var offsets = {
		x: ( min.x + max.x ) / 2,
		y: ( min.y + max.y ) / 2,
		z: ( min.z + max.z ) / 2
	};

	surveyTree.traverse( adjustCoords );

	this.offsets = offsets;

	this.limits = {
		min: min,
		max: max
	};

	return;

	function adjustCoords( node ) {

		var coords = node.p;

		if ( coords === undefined ) return;

		coords.x -= offsets.x;
		coords.y -= offsets.y;
		coords.z -= offsets.z;

	}

	function readLabelV7 () {
		// find length of label and read label = v3 - v7 .3d format

		var len = 0;
		var l;

		switch ( data[ pos ] ) {

		case 0xfe:

			l = new DataView( source, pos );

			len = l.getUint16( 0, true ) + data[ pos ];
			pos += 2;

			break;

		case 0xff:

			l = new DataView( source, pos );

			len = l.getUint32( 0, true );
			pos += 4;

			break;

		default:

			len = data[ pos++ ];

		}

		if ( len === 0 ) return false; // no label

		var db = [];

		for ( var i = 0; i < len; i++ ) {

			db.push( data[ pos++ ] );

		}

		label += String.fromCharCode.apply( null, db );

		return true;

	}

	function readLabelV8 ( flags ) {

		if ( flags & 0x20 )  return false; // no label change

		var b = data[ pos++ ];
		var add = 0;
		var del = 0;
		var l;

		if ( b !== 0 ) {

			// handle 4b= bit del/add codes
			del = b >> 4;   // left most 4 bits
			add = b & 0x0f; // right most 4 bits

		} else {

			// handle 8 bit and 32 bit del/add codes
			b = data[ pos++ ];

			if ( b !== 0xff ) {

				del = b;

			} else {

				l = new DataView( source, pos );

				del = l.getUint32( 0, true );
				pos += 4;

			}

			b = data[ pos++ ];

			if ( b !== 0xff ) {

				add = b;

			} else {

				l = new DataView( source, pos );

				add = l.getUint32( 0, true );
				pos += 4;

			}
		}

		if ( add === 0 && del === 0 ) return;

		if ( del ) label = label.slice( 0, -del );

		if ( add ) {

			var db = [];

			for ( var i = 0; i < add; i++ ) {

				db.push( data[ pos++ ] );

			}

			label += String.fromCharCode.apply( null, db );

		}

		return true;

	}

	function cmd_STOP ( /* c */ ) {

		if ( label ) label = '';

		return true;

	}

	function cmd_TRIM_PLUS ( c ) { // v7 and previous

		label = label.slice( 0, -16 );

		if ( label.charAt( label.length - 1 ) === '.') label = label.slice( 0, -1 ); // strip trailing '.'

		var parts = label.split( '.' );

		parts.splice( -( c ) );
		label = parts.join( '.' );

		if ( label ) label += '.';

		return true;

	}

	function cmd_TRIM ( c ) {  // v7 and previous

		var trim = c - 15;

		label = label.slice( 0, -trim );

		return true;

	}

	function cmd_DATE_V4 ( /* c */ ) {

		pos += 4;

		return true;

	}

	function cmd_DATE_V7 ( /* c */ ) {

		pos += 2;

		return true;

	}

	function cmd_DATE3_V7 ( /* c */ ) {

		pos += 4;

		return true;

	}

	function cmd_DATE2_V4 ( /* c */ ) {

		pos += 8;

		return true;

	}

	function cmd_DATE2_V7 ( /* c */ ) {

		pos += 3;

		return true;

	}

	function cmd_STYLE ( /* c */ ) {

		return true;

	}

	function cmd_DATEV8_1 ( /* c */ ) {

		pos += 2;

		return true;

	}

	function cmd_DATEV8_2 ( /* c */ ) {

		pos += 3;

		return true;

	}

	function cmd_DATEV8_3 ( /* c */ ) {

		pos += 4;

		return true;
	}

	function cmd_DATE_NODATE ( /* c */ ) {

		return true;

	}

	function cmd_LINE ( c ) {

		var flags = c & 0x3f;

		if ( readLabel( flags ) ) {

			// we have a new section name, add it to the survey tree
			sectionId = surveyTree.addPath( label.split( '.' ) );

		}

		var coords = readCoordinates();

		if ( flags & 0x01 ) {

			legs.push( { coords: coords, type: LEG_SURFACE, survey: sectionId } );

		} else if ( flags & 0x04 ) {

			legs.push( { coords: coords, type: LEG_SPLAY, survey: sectionId } );

		} else {

			legs.push( { coords: coords, type: LEG_CAVE, survey: sectionId } );

		}

		lastPosition = coords;

		return true;

	}

	function cmd_MOVE ( /* c */ ) {

		// new set of line segments
		if ( legs.length > 1 ) groups.push( legs );

		legs = [];

		// heuristic to detect line ends. lastPosition was presumably set in a line sequence therefore is at the end
		// of a line, Add the current label, presumably specified in the last LINE, to a Set of lineEnds.

		lineEnds.add( lastPosition.x + ':' + lastPosition.y + ':' + lastPosition.z );

		var coords = readCoordinates();

		legs.push( { coords: coords } );

		lastPosition = coords;

		return true;

	}

	function cmd_ERROR ( /* c */ ) {
		//var l = new DataView(source, pos);

		//console.log('legs   : ', l.getInt32(0, true));
		//console.log('length : ', l.getInt32(4, true));
		//console.log('E      : ', l.getInt32(8, true));
		//console.log('H      : ', l.getInt32(12, true));
		//console.log('V      : ', l.getInt32(16, true));
		pos += 20;

		return true;

	}

	function cmd_LABEL ( c ) {

		var flags = c & 0x7f;

		readLabel( 0 );

		if ( ! ( flags & 0x0E ) || flags & 0x20 ) { // skip surface only stations

			pos += 12; //skip coordinates
			return true;

		}

		var coords = readCoordinates();
		var path = label.split( '.' );

		stations.set( label, coords );

		surveyTree.addPath( path, { p: coords, type: ( flags & 0x04 ) ? STATION_ENTRANCE : STATION_NORMAL } );

		return true;

	}

	function cmd_XSECT16 ( c ) {

		var flags = c & 0x01;

		readLabel( flags );

		var l = new DataView( source, pos );

		pos += 8;

		return commonXSECT(
			flags,
			{
				l: l.getInt16( 0, true ) / 100,
				r: l.getInt16( 2, true ) / 100,
				u: l.getInt16( 4, true ) / 100,
				d: l.getInt16( 6, true ) / 100
			}
		);

	}

	function cmd_XSECT32 ( c ) {

		var flags = c & 0x01;

		readLabel( flags );

		var l = new DataView( source, pos );

		pos += 16;

		return commonXSECT(
			flags,
			{
				l: l.getInt32( 0, true ) / 100,
				r: l.getInt32( 0, true ) / 100,
				u: l.getInt32( 0, true ) / 100,
				d: l.getInt32( 0, true ) / 100
			}
		);

	}

	function commonXSECT ( flags, lrud ) {

		var position = stations.get( label );

		if ( ! position ) return;

		var station = label.split( '.' );

		// get survey path by removing last component of station name
		station.pop();

		var surveyId = surveyTree.getIdByPath( station );

		// FIXME to get a approach vector for the first XSECT in a run so we can add it to the display
		xSects.push( { start: lastPosition, end: position, lrud: lrud, survey: surveyId } );

		lastPosition = position;

		// some XSECTS are not flagged as last in passage
		// heuristic - the last line position before a move is an implied line end.
		// cmd_MOVE saves these in the set lineEnds.
		// this fixes up surveys that display incorrectly withg 'fly-back' artefacts in Aven and Loch.

		var endRun = false;

		if ( flags ) {

			endRun = true;

		} else if ( lineEnds.has( [ position.x, position.y, position.z ].toString() ) ) {

			endRun = true;
//			console.log( 'unterminated LRUD passage at ', label );

		}

		if ( endRun ) {

			if ( xSects.length > 0 ) xGroups.push( xSects );

			lastPosition = { x: 0, y: 0, z: 0 };
			xSects = [];

		}

		return true;

	}

	// functions aliased at runtime as required

	function __readCoordinatesProjected () {

		var l = new DataView( source, pos );

		var projectedCoords = self.projection.forward( {
			x: l.getInt32( 0, true ) / 100,
			y: l.getInt32( 4, true ) / 100
		} );

		var coords = {
			x: projectedCoords.x,
			y: projectedCoords.y,
			z: l.getInt32( 8, true ) / 100
		};

		min.x = Math.min( coords.x, min.x );
		min.y = Math.min( coords.y, min.y );
		min.z = Math.min( coords.z, min.z );

		max.x = Math.max( coords.x, max.x );
		max.y = Math.max( coords.y, max.y );
		max.z = Math.max( coords.z, max.z );

		pos += 12;

		return coords;

	}

	function __readCoordinates () {

		var l = new DataView( source, pos );

		var coords = {
			x: l.getInt32( 0, true ) / 100,
			y: l.getInt32( 4, true ) / 100,
			z: l.getInt32( 8, true ) / 100
		};

		min.x = Math.min( coords.x, min.x );
		min.y = Math.min( coords.y, min.y );
		min.z = Math.min( coords.z, min.z );

		max.x = Math.max( coords.x, max.x );
		max.y = Math.max( coords.y, max.y );
		max.z = Math.max( coords.z, max.z );

		pos += 12;

		return coords;

	}

};

Svx3dHandler.prototype.getLineSegments = function () {

	var lineSegments = [];
	var groups = this.groups;
	var offsets = this.offsets;

	for ( var i = 0, l = groups.length; i < l; i++ ) {

		var g = groups[ i ];

		for ( var v = 0, vMax = g.length - 1; v < vMax; v++ ) {

			// create vertex pairs for each line segment.
			// all vertices except first and last are duplicated.
			var from = g[ v ];
			var to   = g[ v + 1 ];


			// move coordinates around origin

			from.coords.x -= offsets.x;
			from.coords.y -= offsets.y;
			from.coords.z -= offsets.z;

			var fromCoords = from.coords;
			var toCoords = to.coords;

			// skip repeated points ( co-located stations )
			if ( fromCoords.x === toCoords.x && fromCoords.y === toCoords.y && fromCoords.z === toCoords.z ) continue;

			lineSegments.push( { from: fromCoords, to: toCoords, type: to.type, survey: to.survey } );

		}

		// move coordinates around origin

		to.coords.x -= offsets.x;
		to.coords.y -= offsets.y;
		to.coords.z -= offsets.z;

	}

	return lineSegments;

};

Svx3dHandler.prototype.getTerrainDimensions = function () {

	return { lines: 0, samples: 0 };

};

Svx3dHandler.prototype.getTerrainBitmap = function () {

	return false;

};

Svx3dHandler.prototype.getSurvey = function () {

	return {
		title: this.fileName,
		surveyTree: this.surveyTree,
		sourceCRS: this.sourceCRS,
		targetCRS: this.targetCRS,
		limits: this.limits,
		offsets: this.offsets,
		lineSegments: this.getLineSegments(),
		crossSections: this.xGroups,
		scraps: [],
		hasTerrain: false,
		metadata: this.metadata
	};

};



// EOF

function loxHandler  ( fileName, dataStream, metadata ) {

	this.fileName     = fileName;
	this.scraps       = [];
	this.faults       = [];
	this.lineSegments = [];
	this.xGroups      = [];
	this.surveyTree   = new Tree( '', 0 );
	this.isRegion     = false;
	this.metadata     = metadata;
	this.terrain      = {};
	this.hasTerrain   = false;

	var lineSegments = [];
	var stations     = [];
	var self         = this;
	var surveyTree   = this.surveyTree;

	// assumes little endian data ATM - FIXME

	var source = dataStream;
	var pos = 0; // file position
	var dataStart;
	var f = new DataView( source, 0 );
	var l = source.byteLength;

	var xGroup = [];
	var lastTo;

	// range

	var min = { x: Infinity, y: Infinity, z: Infinity };
	var max = { x: -Infinity, y: -Infinity, z: -Infinity };

	while ( pos < l ) readChunkHdr();

	this.lineSegments = lineSegments;

	// Drop data to give GC a chance ASAP
	source = null;

	this.limits = {
		min: min,
		max: max
	};

	var offsets = {
		x: ( min.x + max.x ) / 2,
		y: ( min.y + max.y ) / 2,
		z: ( min.z + max.z ) / 2
	};

	this.offsets = offsets;

	// convert to origin centered coordinates

	var i, j, coords, vertices;

	for ( i = 0; i < stations.length; i++ ) {

		coords = stations[ i ];

		coords.x -= offsets.x;
		coords.y -= offsets.y;
		coords.z -= offsets.z;

	}

	var scraps = this.scraps;

	// covert scraps coordinates

	for ( i = 0; i < scraps.length; i++ ) {

		vertices = scraps[ i ].vertices;

		for ( j = 0; j < vertices.length; j++ ) {

			coords = vertices[ j ];

			coords.x -= offsets.x;
			coords.y -= offsets.y;
			coords.z -= offsets.z;

		}

	}

	return;

	// .lox parsing functions

	function readChunkHdr () {

		var m_type     = readUint();
		var m_recSize  = readUint();
		var m_recCount = readUint();
		var m_dataSize = readUint();
		var doFunction;

		// offset of data region for out of line strings/images/scrap data.
		dataStart  = pos + m_recSize;

		switch ( m_type ) {

		case 1:

			doFunction = readSurvey;

			break;

		case 2:

			doFunction = readStation;

			break;

		case 3:

			doFunction = readShot;

			break;

		case 4:

			doFunction = readScrap;

			break;

		case 5:

			doFunction = readSurface;

			break;

		case 6:

			doFunction = readSurfaceBMP;

			break;

		default:

			console.log( 'unknown chunk header. type : ', m_type );

		}

		if ( doFunction !== undefined ) {

			for ( var i = 0; i < m_recCount; i++ ) {

				doFunction();

			}

		}

		skipData( m_dataSize );

	}

	function readUint () {

		var i = f.getUint32( pos, true );

		pos += 4;

		return i;

	}

	function skipData ( i ) {

		pos += i;

	}

	function readSurvey () {

		var m_id     = readUint();
		var namePtr  = readDataPtr();
		var m_parent = readUint();
		var titlePtr = readDataPtr();

		if ( m_parent != m_id ) {

			if ( ! surveyTree.addById( readString( namePtr ), m_id, m_parent ) ) console.log( 'error constructing survey tree for', readString( titlePtr ) );

		}

	}

	function readDataPtr () {

		var m_position = readUint();
		var m_size     = readUint();

		return { position: m_position, size: m_size };

	}

	function readString ( ptr ) {

		// strings are null terminated. Igore last byte in string
		var bytes = new Uint8Array( source, dataStart + ptr.position, ptr.size - 1 );

		return String.fromCharCode.apply( null, bytes );

	}

	function readStation () {

		var m_id       = readUint();
		var m_surveyId = readUint();
		var namePtr    = readDataPtr();

		readDataPtr(); // commentPtr

		var m_flags    = readUint();
		var coords     = readCoords();

		stations[ m_id ] = coords;

		// add stations to surveyTree make station id negative to avoid clashes with survey id space.

		// m_flags & 0x01 = surface

		surveyTree.addById( readString( namePtr ), - m_id, m_surveyId, { p: coords, type: ( m_flags & 0x02 ) ? STATION_ENTRANCE : STATION_NORMAL } );

	}

	function readCoords () {

		var f = new DataView( source, pos );

		pos += 24;

		coords = {
			x: f.getFloat64( 0,  true ),
			y: f.getFloat64( 8,  true ),
			z: f.getFloat64( 16, true )
		};

		min.x = Math.min( coords.x, min.x );
		min.y = Math.min( coords.y, min.y );
		min.z = Math.min( coords.z, min.z );

		max.x = Math.max( coords.x, max.x );
		max.y = Math.max( coords.y, max.y );
		max.z = Math.max( coords.z, max.z );

		return coords;

	}

	function readShot () {

		var m_from = readUint();
		var m_to   = readUint();

		var fromLRUD = readLRUD();
		var toLRUD   = readLRUD();

		var m_flags = readUint();

		var m_sectionType = readUint();

		var m_surveyId = readUint();

		f.getFloat64( pos, true ); // m_threshold

		var type = LEG_CAVE;

		pos += 8;

		if ( m_flags & 0x01 ) type = LEG_SURFACE;
		if ( m_flags & 0x08 ) type = LEG_SPLAY;

		var from = stations[ m_from ];
		var to   = stations[ m_to ];

		if ( m_sectionType !== 0x00 ) {

			if ( m_from !== lastTo ) {

				// new set of shots

				xGroup = [];
				self.xGroups.push( xGroup );

				xGroup.push( { start: to, end: from, lrud: fromLRUD, survey: m_surveyId } );

			}

			xGroup.push( { start: from, end: to, lrud: toLRUD, survey: m_surveyId } );

		}

		if ( from.x === to.x && from.y === to.y && from.z === to.z ) return;

		lineSegments.push( { from: from, to: to, type: type, survey: m_surveyId } );

		lastTo = m_to;

	}

	function readLRUD () {

		var f = new DataView( source, pos );

		pos += 32;

		return {
			l: f.getFloat64( 0,  true ),
			r: f.getFloat64( 8,  true ),
			u: f.getFloat64( 16, true ),
			d: f.getFloat64( 24, true )
		};

	}

	function readScrap () {

		readUint(); // m_id

		var m_surveyId   = readUint();

		var m_numPoints  = readUint();
		var pointsPtr    = readDataPtr();

		var m_num3Angles = readUint();
		var facesPtr     = readDataPtr();

		var scrap = { vertices: [], faces: [], survey: m_surveyId };
		var lastFace;
		var i, offset, f;

		for ( i = 0; i < m_numPoints; i++ ) {

			offset = dataStart + pointsPtr.position + i * 24; // 24 = 3 * sizeof( double )
			f = new DataView( source, offset );

			scrap.vertices.push( {
				x: f.getFloat64( 0,  true ),
				y: f.getFloat64( 8,  true ),
				z: f.getFloat64( 16, true )
			} );

		}

		// read faces from out of line data area

		for ( i = 0; i < m_num3Angles; i++ ) {

			offset = dataStart + facesPtr.position + i * 12; // 12 = 3 * sizeof( uint32 )
			f = new DataView( source, offset );

			var face = [
				f.getUint32( 0, true ),
				f.getUint32( 4, true ),
				f.getUint32( 8, true )
			];

			// check for face winding order == orientation

			fix_direction: { if ( lastFace !== undefined ) {

				var j;

				for ( j = 0; j < 3; j++ ) { // this case triggers more often than those below.

					if ( face[ j ] == lastFace[ ( j + 2 ) % 3 ] && face[ ( j + 1 ) % 3 ] == lastFace[ ( j + 3 ) % 3 ] ) {

						face.reverse();
						break fix_direction;

					}

				}

				for ( j = 0; j < 3; j++ ) {

					if ( face[ j ] == lastFace[ j ] && face[ ( j + 1 ) % 3 ] == lastFace[ ( j + 1 ) % 3 ] ) {

						face.reverse();
						break fix_direction;

					}

				}

				for ( j = 0; j < 3; j++ ) {

					if ( face[ j ] == lastFace[ ( j + 1 ) % 3 ] && face[ ( j + 1 ) % 3 ] == lastFace[ ( j + 2 ) % 3 ] ) {

						face.reverse();
						break fix_direction;

					}

				}

			} }

			scrap.faces.push( face );
			lastFace = face;

		}

		self.scraps.push( scrap );

	}

	function readSurface () {

		readUint(); // m_id

		var m_width    = readUint();
		var m_height   = readUint();

		var surfacePtr = readDataPtr();
		var m_calib    = readCalibration();

		var ab = source.slice( pos, pos + surfacePtr.size ); // required for 64b alignment

		var dtm = new Float64Array( ab, 0 );

		// flip y direction

		var data = [];

		for ( var i = 0; i < m_height; i++ ) {

			var offset = ( m_height - 1 - i ) * m_width;

			for ( var j = 0; j < m_width; j++ ) {

				data.push( dtm[ offset + j ] );

			}

		}

		var terrain = self.terrain;

		terrain.data = data;
		terrain.dimensions = {};

		var dimensions = terrain.dimensions;

		dimensions.samples = m_width;
		dimensions.lines   = m_height;
		dimensions.xOrigin = m_calib[ 0 ];
		dimensions.yOrigin = m_calib[ 1 ];
		dimensions.xDelta  = m_calib[ 2 ];
		dimensions.yDelta  = m_calib[ 5 ];

		self.hasTerrain = true;

	}

	function readCalibration () {

		var f = new DataView( source, pos );
		var m_calib = [];

		m_calib[ 0 ] = f.getFloat64( 0,  true );
		m_calib[ 1 ] = f.getFloat64( 8,  true );
		m_calib[ 2 ] = f.getFloat64( 16, true );
		m_calib[ 3 ] = f.getFloat64( 24, true );
		m_calib[ 4 ] = f.getFloat64( 32, true );
		m_calib[ 5 ] = f.getFloat64( 40, true );

		pos += 48;

		return m_calib;

	}

	function readSurfaceBMP () {

		readUint(); // m_type
		readUint(); // m_surfaceId

		var imagePtr = readDataPtr();

		readCalibration(); // m_calib

		self.terrain.bitmap = extractImage( imagePtr );

	}

	function extractImage ( imagePtr ) {

		var imgData = new Uint8Array( source, dataStart + imagePtr.position, imagePtr.size );
		var type;

		var b1 = imgData[ 0 ];
		var b2 = imgData[ 1 ];

		if ( b1 === 0xff && b2 === 0xd8 ) {

			type = 'image/jpeg';

		} else if ( b1 === 0x89 && b2 === 0x50 ) {

			type = 'image/png';

		}

		if ( ! type ) return '';

		var blob = new Blob( [ imgData ], { type: type } );
		var blobURL = URL.createObjectURL( blob );

		return blobURL;

	}

}

loxHandler.prototype.constructor = loxHandler;

loxHandler.prototype.getSurvey = function () {

	return {
		title: this.fileName,
		surveyTree: this.surveyTree,
		sourceCRS: null,
		targetCRS: null,
		lineSegments: this.lineSegments,
		crossSections: this.xGroups,
		scraps: this.scraps,
		hasTerrain: this.hasTerrain,
		metadata: this.metadata,
		terrain: this.terrain,
		limits: this.limits,
		offsets: this.offsets
	};

};



// EOF

/**
 * @author bhouston / http://clara.io
 * @author mrdoob / http://mrdoob.com/
 */

function Sphere( center, radius ) {

	this.center = ( center !== undefined ) ? center : new Vector3();
	this.radius = ( radius !== undefined ) ? radius : 0;

}

Object.assign( Sphere.prototype, {

	set: function ( center, radius ) {

		this.center.copy( center );
		this.radius = radius;

		return this;

	},

	setFromPoints: function () {

		var box = new Box3();

		return function setFromPoints( points, optionalCenter ) {

			var center = this.center;

			if ( optionalCenter !== undefined ) {

				center.copy( optionalCenter );

			} else {

				box.setFromPoints( points ).getCenter( center );

			}

			var maxRadiusSq = 0;

			for ( var i = 0, il = points.length; i < il; i ++ ) {

				maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( points[ i ] ) );

			}

			this.radius = Math.sqrt( maxRadiusSq );

			return this;

		};

	}(),

	clone: function () {

		return new this.constructor().copy( this );

	},

	copy: function ( sphere ) {

		this.center.copy( sphere.center );
		this.radius = sphere.radius;

		return this;

	},

	empty: function () {

		return ( this.radius <= 0 );

	},

	containsPoint: function ( point ) {

		return ( point.distanceToSquared( this.center ) <= ( this.radius * this.radius ) );

	},

	distanceToPoint: function ( point ) {

		return ( point.distanceTo( this.center ) - this.radius );

	},

	intersectsSphere: function ( sphere ) {

		var radiusSum = this.radius + sphere.radius;

		return sphere.center.distanceToSquared( this.center ) <= ( radiusSum * radiusSum );

	},

	intersectsBox: function ( box ) {

		return box.intersectsSphere( this );

	},

	intersectsPlane: function ( plane ) {

		// We use the following equation to compute the signed distance from
		// the center of the sphere to the plane.
		//
		// distance = q * n - d
		//
		// If this distance is greater than the radius of the sphere,
		// then there is no intersection.

		return Math.abs( this.center.dot( plane.normal ) - plane.constant ) <= this.radius;

	},

	clampPoint: function ( point, optionalTarget ) {

		var deltaLengthSq = this.center.distanceToSquared( point );

		var result = optionalTarget || new Vector3();

		result.copy( point );

		if ( deltaLengthSq > ( this.radius * this.radius ) ) {

			result.sub( this.center ).normalize();
			result.multiplyScalar( this.radius ).add( this.center );

		}

		return result;

	},

	getBoundingBox: function ( optionalTarget ) {

		var box = optionalTarget || new Box3();

		box.set( this.center, this.center );
		box.expandByScalar( this.radius );

		return box;

	},

	applyMatrix4: function ( matrix ) {

		this.center.applyMatrix4( matrix );
		this.radius = this.radius * matrix.getMaxScaleOnAxis();

		return this;

	},

	translate: function ( offset ) {

		this.center.add( offset );

		return this;

	},

	equals: function ( sphere ) {

		return sphere.center.equals( this.center ) && ( sphere.radius === this.radius );

	}

} );

/**
 * @author bhouston / http://clara.io
 * @author WestLangley / http://github.com/WestLangley
 */

function Box3( min, max ) {

	this.min = ( min !== undefined ) ? min : new Vector3( + Infinity, + Infinity, + Infinity );
	this.max = ( max !== undefined ) ? max : new Vector3( - Infinity, - Infinity, - Infinity );

}

Object.assign( Box3.prototype, {

	isBox3: true,

	set: function ( min, max ) {

		this.min.copy( min );
		this.max.copy( max );

		return this;

	},

	setFromArray: function ( array ) {

		var minX = + Infinity;
		var minY = + Infinity;
		var minZ = + Infinity;

		var maxX = - Infinity;
		var maxY = - Infinity;
		var maxZ = - Infinity;

		for ( var i = 0, l = array.length; i < l; i += 3 ) {

			var x = array[ i ];
			var y = array[ i + 1 ];
			var z = array[ i + 2 ];

			if ( x < minX ) minX = x;
			if ( y < minY ) minY = y;
			if ( z < minZ ) minZ = z;

			if ( x > maxX ) maxX = x;
			if ( y > maxY ) maxY = y;
			if ( z > maxZ ) maxZ = z;

		}

		this.min.set( minX, minY, minZ );
		this.max.set( maxX, maxY, maxZ );

		return this;

	},

	setFromBufferAttribute: function ( attribute ) {

		var minX = + Infinity;
		var minY = + Infinity;
		var minZ = + Infinity;

		var maxX = - Infinity;
		var maxY = - Infinity;
		var maxZ = - Infinity;

		for ( var i = 0, l = attribute.count; i < l; i ++ ) {

			var x = attribute.getX( i );
			var y = attribute.getY( i );
			var z = attribute.getZ( i );

			if ( x < minX ) minX = x;
			if ( y < minY ) minY = y;
			if ( z < minZ ) minZ = z;

			if ( x > maxX ) maxX = x;
			if ( y > maxY ) maxY = y;
			if ( z > maxZ ) maxZ = z;

		}

		this.min.set( minX, minY, minZ );
		this.max.set( maxX, maxY, maxZ );

		return this;

	},

	setFromPoints: function ( points ) {

		this.makeEmpty();

		for ( var i = 0, il = points.length; i < il; i ++ ) {

			this.expandByPoint( points[ i ] );

		}

		return this;

	},

	setFromCenterAndSize: function () {

		var v1 = new Vector3();

		return function setFromCenterAndSize( center, size ) {

			var halfSize = v1.copy( size ).multiplyScalar( 0.5 );

			this.min.copy( center ).sub( halfSize );
			this.max.copy( center ).add( halfSize );

			return this;

		};

	}(),

	setFromObject: function ( object ) {

		this.makeEmpty();

		return this.expandByObject( object );

	},

	clone: function () {

		return new this.constructor().copy( this );

	},

	copy: function ( box ) {

		this.min.copy( box.min );
		this.max.copy( box.max );

		return this;

	},

	makeEmpty: function () {

		this.min.x = this.min.y = this.min.z = + Infinity;
		this.max.x = this.max.y = this.max.z = - Infinity;

		return this;

	},

	isEmpty: function () {

		// this is a more robust check for empty than ( volume <= 0 ) because volume can get positive with two negative axes

		return ( this.max.x < this.min.x ) || ( this.max.y < this.min.y ) || ( this.max.z < this.min.z );

	},

	getCenter: function ( optionalTarget ) {

		var result = optionalTarget || new Vector3();
		return this.isEmpty() ? result.set( 0, 0, 0 ) : result.addVectors( this.min, this.max ).multiplyScalar( 0.5 );

	},

	getSize: function ( optionalTarget ) {

		var result = optionalTarget || new Vector3();
		return this.isEmpty() ? result.set( 0, 0, 0 ) : result.subVectors( this.max, this.min );

	},

	expandByPoint: function ( point ) {

		this.min.min( point );
		this.max.max( point );

		return this;

	},

	expandByVector: function ( vector ) {

		this.min.sub( vector );
		this.max.add( vector );

		return this;

	},

	expandByScalar: function ( scalar ) {

		this.min.addScalar( - scalar );
		this.max.addScalar( scalar );

		return this;

	},

	expandByObject: function () {

		// Computes the world-axis-aligned bounding box of an object (including its children),
		// accounting for both the object's, and children's, world transforms

		var v1 = new Vector3();

		return function expandByObject( object ) {

			var scope = this;

			object.updateMatrixWorld( true );

			object.traverse( function ( node ) {

				var i, l;

				var geometry = node.geometry;

				if ( geometry !== undefined ) {

					if ( geometry.isGeometry ) {

						var vertices = geometry.vertices;

						for ( i = 0, l = vertices.length; i < l; i ++ ) {

							v1.copy( vertices[ i ] );
							v1.applyMatrix4( node.matrixWorld );

							scope.expandByPoint( v1 );

						}

					} else if ( geometry.isBufferGeometry ) {

						var attribute = geometry.attributes.position;

						if ( attribute !== undefined ) {

							for ( i = 0, l = attribute.count; i < l; i ++ ) {

								v1.fromBufferAttribute( attribute, i ).applyMatrix4( node.matrixWorld );

								scope.expandByPoint( v1 );

							}

						}

					}

				}

			} );

			return this;

		};

	}(),

	containsPoint: function ( point ) {

		return point.x < this.min.x || point.x > this.max.x ||
			point.y < this.min.y || point.y > this.max.y ||
			point.z < this.min.z || point.z > this.max.z ? false : true;

	},

	containsBox: function ( box ) {

		return this.min.x <= box.min.x && box.max.x <= this.max.x &&
			this.min.y <= box.min.y && box.max.y <= this.max.y &&
			this.min.z <= box.min.z && box.max.z <= this.max.z;

	},

	getParameter: function ( point, optionalTarget ) {

		// This can potentially have a divide by zero if the box
		// has a size dimension of 0.

		var result = optionalTarget || new Vector3();

		return result.set(
			( point.x - this.min.x ) / ( this.max.x - this.min.x ),
			( point.y - this.min.y ) / ( this.max.y - this.min.y ),
			( point.z - this.min.z ) / ( this.max.z - this.min.z )
		);

	},

	intersectsBox: function ( box ) {

		// using 6 splitting planes to rule out intersections.
		return box.max.x < this.min.x || box.min.x > this.max.x ||
			box.max.y < this.min.y || box.min.y > this.max.y ||
			box.max.z < this.min.z || box.min.z > this.max.z ? false : true;

	},

	intersectsSphere: ( function () {

		var closestPoint = new Vector3();

		return function intersectsSphere( sphere ) {

			// Find the point on the AABB closest to the sphere center.
			this.clampPoint( sphere.center, closestPoint );

			// If that point is inside the sphere, the AABB and sphere intersect.
			return closestPoint.distanceToSquared( sphere.center ) <= ( sphere.radius * sphere.radius );

		};

	} )(),

	intersectsPlane: function ( plane ) {

		// We compute the minimum and maximum dot product values. If those values
		// are on the same side (back or front) of the plane, then there is no intersection.

		var min, max;

		if ( plane.normal.x > 0 ) {

			min = plane.normal.x * this.min.x;
			max = plane.normal.x * this.max.x;

		} else {

			min = plane.normal.x * this.max.x;
			max = plane.normal.x * this.min.x;

		}

		if ( plane.normal.y > 0 ) {

			min += plane.normal.y * this.min.y;
			max += plane.normal.y * this.max.y;

		} else {

			min += plane.normal.y * this.max.y;
			max += plane.normal.y * this.min.y;

		}

		if ( plane.normal.z > 0 ) {

			min += plane.normal.z * this.min.z;
			max += plane.normal.z * this.max.z;

		} else {

			min += plane.normal.z * this.max.z;
			max += plane.normal.z * this.min.z;

		}

		return ( min <= plane.constant && max >= plane.constant );

	},

	clampPoint: function ( point, optionalTarget ) {

		var result = optionalTarget || new Vector3();
		return result.copy( point ).clamp( this.min, this.max );

	},

	distanceToPoint: function () {

		var v1 = new Vector3();

		return function distanceToPoint( point ) {

			var clampedPoint = v1.copy( point ).clamp( this.min, this.max );
			return clampedPoint.sub( point ).length();

		};

	}(),

	getBoundingSphere: function () {

		var v1 = new Vector3();

		return function getBoundingSphere( optionalTarget ) {

			var result = optionalTarget || new Sphere();

			this.getCenter( result.center );

			result.radius = this.getSize( v1 ).length() * 0.5;

			return result;

		};

	}(),

	intersect: function ( box ) {

		this.min.max( box.min );
		this.max.min( box.max );

		// ensure that if there is no overlap, the result is fully empty, not slightly empty with non-inf/+inf values that will cause subsequence intersects to erroneously return valid values.
		if( this.isEmpty() ) this.makeEmpty();

		return this;

	},

	union: function ( box ) {

		this.min.min( box.min );
		this.max.max( box.max );

		return this;

	},

	applyMatrix4: function () {

		var points = [
			new Vector3(),
			new Vector3(),
			new Vector3(),
			new Vector3(),
			new Vector3(),
			new Vector3(),
			new Vector3(),
			new Vector3()
		];

		return function applyMatrix4( matrix ) {

			// transform of empty box is an empty box.
			if( this.isEmpty() ) return this;

			// NOTE: I am using a binary pattern to specify all 2^3 combinations below
			points[ 0 ].set( this.min.x, this.min.y, this.min.z ).applyMatrix4( matrix ); // 000
			points[ 1 ].set( this.min.x, this.min.y, this.max.z ).applyMatrix4( matrix ); // 001
			points[ 2 ].set( this.min.x, this.max.y, this.min.z ).applyMatrix4( matrix ); // 010
			points[ 3 ].set( this.min.x, this.max.y, this.max.z ).applyMatrix4( matrix ); // 011
			points[ 4 ].set( this.max.x, this.min.y, this.min.z ).applyMatrix4( matrix ); // 100
			points[ 5 ].set( this.max.x, this.min.y, this.max.z ).applyMatrix4( matrix ); // 101
			points[ 6 ].set( this.max.x, this.max.y, this.min.z ).applyMatrix4( matrix ); // 110
			points[ 7 ].set( this.max.x, this.max.y, this.max.z ).applyMatrix4( matrix );	// 111

			this.setFromPoints( points );

			return this;

		};

	}(),

	translate: function ( offset ) {

		this.min.add( offset );
		this.max.add( offset );

		return this;

	},

	equals: function ( box ) {

		return box.min.equals( this.min ) && box.max.equals( this.max );

	}

} );

function RegionHandler ( filename, dataStream ) {

	this.isRegion = true;
	this.data = dataStream;
	this.box = new Box3();

	var entrances = [];
	var caves = this.data.caves;
	var caveName;

	var min = this.box.min;
	var max = this.box.max;

	for ( caveName in caves ) {

		var i;
		var e = caves[ caveName ].entrances;

		for ( i = 0; i < e.length; i++ ) {

			var entrance = e[ i ];

			min.min( entrance.position );
			max.max( entrance.position );

			entrances.push( entrance );

		}

	}

	this.data.entrances = entrances;
	this.data.surveyTree = new Tree( this.data.title );

}

RegionHandler.prototype.constructor = RegionHandler;

RegionHandler.prototype.getSurvey = function () {

	return this.data;

};

RegionHandler.prototype.getLimits = function () {

	return this.box;

};



// EOF

// Polyfills

if ( Number.EPSILON === undefined ) {

	Number.EPSILON = Math.pow( 2, - 52 );

}

if ( Number.isInteger === undefined ) {

	// Missing in IE
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger

	Number.isInteger = function ( value ) {

		return typeof value === 'number' && isFinite( value ) && Math.floor( value ) === value;

	};

}

//

if ( Math.sign === undefined ) {

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign

	Math.sign = function ( x ) {

		return ( x < 0 ) ? - 1 : ( x > 0 ) ? 1 : + x;

	};

}

if ( Function.prototype.name === undefined ) {

	// Missing in IE
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name

	Object.defineProperty( Function.prototype, 'name', {

		get: function () {

			return this.toString().match( /^\s*function\s*([^\(\s]*)/ )[ 1 ];

		}

	} );

}

if ( Object.assign === undefined ) {

	// Missing in IE
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign

	( function () {

		Object.assign = function ( target ) {

			'use strict';

			if ( target === undefined || target === null ) {

				throw new TypeError( 'Cannot convert undefined or null to object' );

			}

			var output = Object( target );

			for ( var index = 1; index < arguments.length; index ++ ) {

				var source = arguments[ index ];

				if ( source !== undefined && source !== null ) {

					for ( var nextKey in source ) {

						if ( Object.prototype.hasOwnProperty.call( source, nextKey ) ) {

							output[ nextKey ] = source[ nextKey ];

						}

					}

				}

			}

			return output;

		};

	} )();

}

/**
 * https://github.com/mrdoob/eventdispatcher.js/
 */

function EventDispatcher() {}

Object.assign( EventDispatcher.prototype, {

	addEventListener: function ( type, listener ) {

		if ( this._listeners === undefined ) this._listeners = {};

		var listeners = this._listeners;

		if ( listeners[ type ] === undefined ) {

			listeners[ type ] = [];

		}

		if ( listeners[ type ].indexOf( listener ) === - 1 ) {

			listeners[ type ].push( listener );

		}

	},

	hasEventListener: function ( type, listener ) {

		if ( this._listeners === undefined ) return false;

		var listeners = this._listeners;

		return listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1;

	},

	removeEventListener: function ( type, listener ) {

		if ( this._listeners === undefined ) return;

		var listeners = this._listeners;
		var listenerArray = listeners[ type ];

		if ( listenerArray !== undefined ) {

			var index = listenerArray.indexOf( listener );

			if ( index !== - 1 ) {

				listenerArray.splice( index, 1 );

			}

		}

	},

	dispatchEvent: function ( event ) {

		if ( this._listeners === undefined ) return;

		var listeners = this._listeners;
		var listenerArray = listeners[ event.type ];

		if ( listenerArray !== undefined ) {

			event.target = this;

			var array = listenerArray.slice( 0 );

			for ( var i = 0, l = array.length; i < l; i ++ ) {

				array[ i ].call( this, event );

			}

		}

	}

} );

var PCFShadowMap = 1;
var PCFSoftShadowMap = 2;
var FrontSide = 0;
var BackSide = 1;
var DoubleSide = 2;
var FlatShading = 1;
var SmoothShading = 2;
var NoColors = 0;
var FaceColors = 1;
var VertexColors = 2;
var NoBlending = 0;
var NormalBlending = 1;
var AdditiveBlending = 2;
var SubtractiveBlending = 3;
var MultiplyBlending = 4;
var CustomBlending = 5;
var AddEquation = 100;








var SrcAlphaFactor = 204;
var OneMinusSrcAlphaFactor = 205;








var LessEqualDepth = 3;




var MultiplyOperation = 0;
var MixOperation = 1;
var AddOperation = 2;
var NoToneMapping = 0;
var LinearToneMapping = 1;
var ReinhardToneMapping = 2;
var Uncharted2ToneMapping = 3;
var CineonToneMapping = 4;
var UVMapping = 300;
var CubeReflectionMapping = 301;
var CubeRefractionMapping = 302;
var EquirectangularReflectionMapping = 303;
var EquirectangularRefractionMapping = 304;
var SphericalReflectionMapping = 305;
var CubeUVReflectionMapping = 306;
var CubeUVRefractionMapping = 307;
var RepeatWrapping = 1000;
var ClampToEdgeWrapping = 1001;
var MirroredRepeatWrapping = 1002;
var NearestFilter = 1003;
var NearestMipMapNearestFilter = 1004;
var NearestMipMapLinearFilter = 1005;
var LinearFilter = 1006;

var LinearMipMapLinearFilter = 1008;
var UnsignedByteType = 1009;


var UnsignedShortType = 1012;

var UnsignedIntType = 1014;
var FloatType = 1015;
var HalfFloatType = 1016;



var UnsignedInt248Type = 1020;

var RGBFormat = 1022;
var RGBAFormat = 1023;



var DepthFormat = 1026;
var DepthStencilFormat = 1027;












var InterpolateDiscrete = 2300;
var InterpolateLinear = 2301;
var InterpolateSmooth = 2302;
var ZeroCurvatureEnding = 2400;
var ZeroSlopeEnding = 2401;
var WrapAroundEnding = 2402;
var TrianglesDrawMode = 0;


var LinearEncoding = 3000;
var sRGBEncoding = 3001;
var GammaEncoding = 3007;
var RGBEEncoding = 3002;

var RGBM7Encoding = 3004;
var RGBM16Encoding = 3005;
var RGBDEncoding = 3006;

/**
 * @author mrdoob / http://mrdoob.com/
 * @author philogb / http://blog.thejit.org/
 * @author egraether / http://egraether.com/
 * @author zz85 / http://www.lab4games.net/zz85/blog
 */

function Vector2( x, y ) {

	this.x = x || 0;
	this.y = y || 0;

}

Object.defineProperties( Vector2.prototype, {

	"width" : {

		get: function () {

			return this.x;

		},

		set: function ( value ) {

			this.x = value;

		}

	},

	"height" : {

		get: function () {

			return this.y;

		},

		set: function ( value ) {

			this.y = value;

		}

	}

} );

Object.assign( Vector2.prototype, {

	isVector2: true,

	set: function ( x, y ) {

		this.x = x;
		this.y = y;

		return this;

	},

	setScalar: function ( scalar ) {

		this.x = scalar;
		this.y = scalar;

		return this;

	},

	setX: function ( x ) {

		this.x = x;

		return this;

	},

	setY: function ( y ) {

		this.y = y;

		return this;

	},

	setComponent: function ( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			default: throw new Error( 'index is out of range: ' + index );

		}

		return this;

	},

	getComponent: function ( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			default: throw new Error( 'index is out of range: ' + index );

		}

	},

	clone: function () {

		return new this.constructor( this.x, this.y );

	},

	copy: function ( v ) {

		this.x = v.x;
		this.y = v.y;

		return this;

	},

	add: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector2: .add() now only accepts one argument. Use .addVectors( a, b ) instead.' );
			return this.addVectors( v, w );

		}

		this.x += v.x;
		this.y += v.y;

		return this;

	},

	addScalar: function ( s ) {

		this.x += s;
		this.y += s;

		return this;

	},

	addVectors: function ( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;

		return this;

	},

	addScaledVector: function ( v, s ) {

		this.x += v.x * s;
		this.y += v.y * s;

		return this;

	},

	sub: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector2: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.' );
			return this.subVectors( v, w );

		}

		this.x -= v.x;
		this.y -= v.y;

		return this;

	},

	subScalar: function ( s ) {

		this.x -= s;
		this.y -= s;

		return this;

	},

	subVectors: function ( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;

		return this;

	},

	multiply: function ( v ) {

		this.x *= v.x;
		this.y *= v.y;

		return this;

	},

	multiplyScalar: function ( scalar ) {

		this.x *= scalar;
		this.y *= scalar;

		return this;

	},

	divide: function ( v ) {

		this.x /= v.x;
		this.y /= v.y;

		return this;

	},

	divideScalar: function ( scalar ) {

		return this.multiplyScalar( 1 / scalar );

	},

	min: function ( v ) {

		this.x = Math.min( this.x, v.x );
		this.y = Math.min( this.y, v.y );

		return this;

	},

	max: function ( v ) {

		this.x = Math.max( this.x, v.x );
		this.y = Math.max( this.y, v.y );

		return this;

	},

	clamp: function ( min, max ) {

		// assumes min < max, componentwise

		this.x = Math.max( min.x, Math.min( max.x, this.x ) );
		this.y = Math.max( min.y, Math.min( max.y, this.y ) );

		return this;

	},

	clampScalar: function () {

		var min = new Vector2();
		var max = new Vector2();

		return function clampScalar( minVal, maxVal ) {

			min.set( minVal, minVal );
			max.set( maxVal, maxVal );

			return this.clamp( min, max );

		};

	}(),

	clampLength: function ( min, max ) {

		var length = this.length();

		return this.divideScalar( length || 1 ).multiplyScalar( Math.max( min, Math.min( max, length ) ) );

	},

	floor: function () {

		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );

		return this;

	},

	ceil: function () {

		this.x = Math.ceil( this.x );
		this.y = Math.ceil( this.y );

		return this;

	},

	round: function () {

		this.x = Math.round( this.x );
		this.y = Math.round( this.y );

		return this;

	},

	roundToZero: function () {

		this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
		this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );

		return this;

	},

	negate: function () {

		this.x = - this.x;
		this.y = - this.y;

		return this;

	},

	dot: function ( v ) {

		return this.x * v.x + this.y * v.y;

	},

	lengthSq: function () {

		return this.x * this.x + this.y * this.y;

	},

	length: function () {

		return Math.sqrt( this.x * this.x + this.y * this.y );

	},

	lengthManhattan: function() {

		return Math.abs( this.x ) + Math.abs( this.y );

	},

	normalize: function () {

		return this.divideScalar( this.length() || 1 );

	},

	angle: function () {

		// computes the angle in radians with respect to the positive x-axis

		var angle = Math.atan2( this.y, this.x );

		if ( angle < 0 ) angle += 2 * Math.PI;

		return angle;

	},

	distanceTo: function ( v ) {

		return Math.sqrt( this.distanceToSquared( v ) );

	},

	distanceToSquared: function ( v ) {

		var dx = this.x - v.x, dy = this.y - v.y;
		return dx * dx + dy * dy;

	},

	distanceToManhattan: function ( v ) {

		return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y );

	},

	setLength: function ( length ) {

		return this.normalize().multiplyScalar( length );

	},

	lerp: function ( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;

		return this;

	},

	lerpVectors: function ( v1, v2, alpha ) {

		return this.subVectors( v2, v1 ).multiplyScalar( alpha ).add( v1 );

	},

	equals: function ( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) );

	},

	fromArray: function ( array, offset ) {

		if ( offset === undefined ) offset = 0;

		this.x = array[ offset ];
		this.y = array[ offset + 1 ];

		return this;

	},

	toArray: function ( array, offset ) {

		if ( array === undefined ) array = [];
		if ( offset === undefined ) offset = 0;

		array[ offset ] = this.x;
		array[ offset + 1 ] = this.y;

		return array;

	},

	fromBufferAttribute: function ( attribute, index, offset ) {

		if ( offset !== undefined ) {

			console.warn( 'THREE.Vector2: offset has been removed from .fromBufferAttribute().' );

		}

		this.x = attribute.getX( index );
		this.y = attribute.getY( index );

		return this;

	},

	rotateAround: function ( center, angle ) {

		var c = Math.cos( angle ), s = Math.sin( angle );

		var x = this.x - center.x;
		var y = this.y - center.y;

		this.x = x * c - y * s + center.x;
		this.y = x * s + y * c + center.y;

		return this;

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author szimek / https://github.com/szimek/
 */

var textureId = 0;

function Texture( image, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, encoding ) {

	Object.defineProperty( this, 'id', { value: textureId ++ } );

	this.uuid = _Math.generateUUID();

	this.name = '';

	this.image = image !== undefined ? image : Texture.DEFAULT_IMAGE;
	this.mipmaps = [];

	this.mapping = mapping !== undefined ? mapping : Texture.DEFAULT_MAPPING;

	this.wrapS = wrapS !== undefined ? wrapS : ClampToEdgeWrapping;
	this.wrapT = wrapT !== undefined ? wrapT : ClampToEdgeWrapping;

	this.magFilter = magFilter !== undefined ? magFilter : LinearFilter;
	this.minFilter = minFilter !== undefined ? minFilter : LinearMipMapLinearFilter;

	this.anisotropy = anisotropy !== undefined ? anisotropy : 1;

	this.format = format !== undefined ? format : RGBAFormat;
	this.type = type !== undefined ? type : UnsignedByteType;

	this.offset = new Vector2( 0, 0 );
	this.repeat = new Vector2( 1, 1 );

	this.generateMipmaps = true;
	this.premultiplyAlpha = false;
	this.flipY = true;
	this.unpackAlignment = 4;	// valid values: 1, 2, 4, 8 (see http://www.khronos.org/opengles/sdk/docs/man/xhtml/glPixelStorei.xml)

	// Values of encoding !== THREE.LinearEncoding only supported on map, envMap and emissiveMap.
	//
	// Also changing the encoding after already used by a Material will not automatically make the Material
	// update.  You need to explicitly call Material.needsUpdate to trigger it to recompile.
	this.encoding = encoding !== undefined ? encoding : LinearEncoding;

	this.version = 0;
	this.onUpdate = null;

}

Texture.DEFAULT_IMAGE = undefined;
Texture.DEFAULT_MAPPING = UVMapping;

Object.defineProperty( Texture.prototype, "needsUpdate", {

	set: function ( value ) {

		if ( value === true ) this.version ++;

	}

} );

Object.assign( Texture.prototype, EventDispatcher.prototype, {

	constructor: Texture,

	isTexture: true,

	clone: function () {

		return new this.constructor().copy( this );

	},

	copy: function ( source ) {

		this.name = source.name;

		this.image = source.image;
		this.mipmaps = source.mipmaps.slice( 0 );

		this.mapping = source.mapping;

		this.wrapS = source.wrapS;
		this.wrapT = source.wrapT;

		this.magFilter = source.magFilter;
		this.minFilter = source.minFilter;

		this.anisotropy = source.anisotropy;

		this.format = source.format;
		this.type = source.type;

		this.offset.copy( source.offset );
		this.repeat.copy( source.repeat );

		this.generateMipmaps = source.generateMipmaps;
		this.premultiplyAlpha = source.premultiplyAlpha;
		this.flipY = source.flipY;
		this.unpackAlignment = source.unpackAlignment;
		this.encoding = source.encoding;

		return this;

	},

	toJSON: function ( meta ) {

		if ( meta.textures[ this.uuid ] !== undefined ) {

			return meta.textures[ this.uuid ];

		}

		function getDataURL( image ) {

			var canvas;

			if ( image.toDataURL !== undefined ) {

				canvas = image;

			} else {

				canvas = document.createElementNS( 'http://www.w3.org/1999/xhtml', 'canvas' );
				canvas.width = image.width;
				canvas.height = image.height;

				canvas.getContext( '2d' ).drawImage( image, 0, 0, image.width, image.height );

			}

			if ( canvas.width > 2048 || canvas.height > 2048 ) {

				return canvas.toDataURL( 'image/jpeg', 0.6 );

			} else {

				return canvas.toDataURL( 'image/png' );

			}

		}

		var output = {
			metadata: {
				version: 4.5,
				type: 'Texture',
				generator: 'Texture.toJSON'
			},

			uuid: this.uuid,
			name: this.name,

			mapping: this.mapping,

			repeat: [ this.repeat.x, this.repeat.y ],
			offset: [ this.offset.x, this.offset.y ],
			wrap: [ this.wrapS, this.wrapT ],

			minFilter: this.minFilter,
			magFilter: this.magFilter,
			anisotropy: this.anisotropy,

			flipY: this.flipY
		};

		if ( this.image !== undefined ) {

			// TODO: Move to THREE.Image

			var image = this.image;

			if ( image.uuid === undefined ) {

				image.uuid = _Math.generateUUID(); // UGH

			}

			if ( meta.images[ image.uuid ] === undefined ) {

				meta.images[ image.uuid ] = {
					uuid: image.uuid,
					url: getDataURL( image )
				};

			}

			output.image = image.uuid;

		}

		meta.textures[ this.uuid ] = output;

		return output;

	},

	dispose: function () {

		this.dispatchEvent( { type: 'dispose' } );

	},

	transformUv: function ( uv ) {

		if ( this.mapping !== UVMapping ) return;

		uv.multiply( this.repeat );
		uv.add( this.offset );

		if ( uv.x < 0 || uv.x > 1 ) {

			switch ( this.wrapS ) {

				case RepeatWrapping:

					uv.x = uv.x - Math.floor( uv.x );
					break;

				case ClampToEdgeWrapping:

					uv.x = uv.x < 0 ? 0 : 1;
					break;

				case MirroredRepeatWrapping:

					if ( Math.abs( Math.floor( uv.x ) % 2 ) === 1 ) {

						uv.x = Math.ceil( uv.x ) - uv.x;

					} else {

						uv.x = uv.x - Math.floor( uv.x );

					}
					break;

			}

		}

		if ( uv.y < 0 || uv.y > 1 ) {

			switch ( this.wrapT ) {

				case RepeatWrapping:

					uv.y = uv.y - Math.floor( uv.y );
					break;

				case ClampToEdgeWrapping:

					uv.y = uv.y < 0 ? 0 : 1;
					break;

				case MirroredRepeatWrapping:

					if ( Math.abs( Math.floor( uv.y ) % 2 ) === 1 ) {

						uv.y = Math.ceil( uv.y ) - uv.y;

					} else {

						uv.y = uv.y - Math.floor( uv.y );

					}
					break;

			}

		}

		if ( this.flipY ) {

			uv.y = 1 - uv.y;

		}

	}

} );

/**
 * @author supereggbert / http://www.paulbrunt.co.uk/
 * @author philogb / http://blog.thejit.org/
 * @author mikael emtinger / http://gomo.se/
 * @author egraether / http://egraether.com/
 * @author WestLangley / http://github.com/WestLangley
 */

function Vector4( x, y, z, w ) {

	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
	this.w = ( w !== undefined ) ? w : 1;

}

Object.assign( Vector4.prototype, {

	isVector4: true,

	set: function ( x, y, z, w ) {

		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;

		return this;

	},

	setScalar: function ( scalar ) {

		this.x = scalar;
		this.y = scalar;
		this.z = scalar;
		this.w = scalar;

		return this;

	},

	setX: function ( x ) {

		this.x = x;

		return this;

	},

	setY: function ( y ) {

		this.y = y;

		return this;

	},

	setZ: function ( z ) {

		this.z = z;

		return this;

	},

	setW: function ( w ) {

		this.w = w;

		return this;

	},

	setComponent: function ( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			case 2: this.z = value; break;
			case 3: this.w = value; break;
			default: throw new Error( 'index is out of range: ' + index );

		}

		return this;

	},

	getComponent: function ( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			case 2: return this.z;
			case 3: return this.w;
			default: throw new Error( 'index is out of range: ' + index );

		}

	},

	clone: function () {

		return new this.constructor( this.x, this.y, this.z, this.w );

	},

	copy: function ( v ) {

		this.x = v.x;
		this.y = v.y;
		this.z = v.z;
		this.w = ( v.w !== undefined ) ? v.w : 1;

		return this;

	},

	add: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector4: .add() now only accepts one argument. Use .addVectors( a, b ) instead.' );
			return this.addVectors( v, w );

		}

		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
		this.w += v.w;

		return this;

	},

	addScalar: function ( s ) {

		this.x += s;
		this.y += s;
		this.z += s;
		this.w += s;

		return this;

	},

	addVectors: function ( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;
		this.z = a.z + b.z;
		this.w = a.w + b.w;

		return this;

	},

	addScaledVector: function ( v, s ) {

		this.x += v.x * s;
		this.y += v.y * s;
		this.z += v.z * s;
		this.w += v.w * s;

		return this;

	},

	sub: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector4: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.' );
			return this.subVectors( v, w );

		}

		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;
		this.w -= v.w;

		return this;

	},

	subScalar: function ( s ) {

		this.x -= s;
		this.y -= s;
		this.z -= s;
		this.w -= s;

		return this;

	},

	subVectors: function ( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;
		this.z = a.z - b.z;
		this.w = a.w - b.w;

		return this;

	},

	multiplyScalar: function ( scalar ) {

		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;
		this.w *= scalar;

		return this;

	},

	applyMatrix4: function ( m ) {

		var x = this.x, y = this.y, z = this.z, w = this.w;
		var e = m.elements;

		this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] * w;
		this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] * w;
		this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] * w;
		this.w = e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] * w;

		return this;

	},

	divideScalar: function ( scalar ) {

		return this.multiplyScalar( 1 / scalar );

	},

	setAxisAngleFromQuaternion: function ( q ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToAngle/index.htm

		// q is assumed to be normalized

		this.w = 2 * Math.acos( q.w );

		var s = Math.sqrt( 1 - q.w * q.w );

		if ( s < 0.0001 ) {

			 this.x = 1;
			 this.y = 0;
			 this.z = 0;

		} else {

			 this.x = q.x / s;
			 this.y = q.y / s;
			 this.z = q.z / s;

		}

		return this;

	},

	setAxisAngleFromRotationMatrix: function ( m ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToAngle/index.htm

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		var angle, x, y, z,		// variables for result
			epsilon = 0.01,		// margin to allow for rounding errors
			epsilon2 = 0.1,		// margin to distinguish between 0 and 180 degrees

			te = m.elements,

			m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
			m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
			m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ];

		if ( ( Math.abs( m12 - m21 ) < epsilon ) &&
		     ( Math.abs( m13 - m31 ) < epsilon ) &&
		     ( Math.abs( m23 - m32 ) < epsilon ) ) {

			// singularity found
			// first check for identity matrix which must have +1 for all terms
			// in leading diagonal and zero in other terms

			if ( ( Math.abs( m12 + m21 ) < epsilon2 ) &&
			     ( Math.abs( m13 + m31 ) < epsilon2 ) &&
			     ( Math.abs( m23 + m32 ) < epsilon2 ) &&
			     ( Math.abs( m11 + m22 + m33 - 3 ) < epsilon2 ) ) {

				// this singularity is identity matrix so angle = 0

				this.set( 1, 0, 0, 0 );

				return this; // zero angle, arbitrary axis

			}

			// otherwise this singularity is angle = 180

			angle = Math.PI;

			var xx = ( m11 + 1 ) / 2;
			var yy = ( m22 + 1 ) / 2;
			var zz = ( m33 + 1 ) / 2;
			var xy = ( m12 + m21 ) / 4;
			var xz = ( m13 + m31 ) / 4;
			var yz = ( m23 + m32 ) / 4;

			if ( ( xx > yy ) && ( xx > zz ) ) {

				// m11 is the largest diagonal term

				if ( xx < epsilon ) {

					x = 0;
					y = 0.707106781;
					z = 0.707106781;

				} else {

					x = Math.sqrt( xx );
					y = xy / x;
					z = xz / x;

				}

			} else if ( yy > zz ) {

				// m22 is the largest diagonal term

				if ( yy < epsilon ) {

					x = 0.707106781;
					y = 0;
					z = 0.707106781;

				} else {

					y = Math.sqrt( yy );
					x = xy / y;
					z = yz / y;

				}

			} else {

				// m33 is the largest diagonal term so base result on this

				if ( zz < epsilon ) {

					x = 0.707106781;
					y = 0.707106781;
					z = 0;

				} else {

					z = Math.sqrt( zz );
					x = xz / z;
					y = yz / z;

				}

			}

			this.set( x, y, z, angle );

			return this; // return 180 deg rotation

		}

		// as we have reached here there are no singularities so we can handle normally

		var s = Math.sqrt( ( m32 - m23 ) * ( m32 - m23 ) +
		                   ( m13 - m31 ) * ( m13 - m31 ) +
		                   ( m21 - m12 ) * ( m21 - m12 ) ); // used to normalize

		if ( Math.abs( s ) < 0.001 ) s = 1;

		// prevent divide by zero, should not happen if matrix is orthogonal and should be
		// caught by singularity test above, but I've left it in just in case

		this.x = ( m32 - m23 ) / s;
		this.y = ( m13 - m31 ) / s;
		this.z = ( m21 - m12 ) / s;
		this.w = Math.acos( ( m11 + m22 + m33 - 1 ) / 2 );

		return this;

	},

	min: function ( v ) {

		this.x = Math.min( this.x, v.x );
		this.y = Math.min( this.y, v.y );
		this.z = Math.min( this.z, v.z );
		this.w = Math.min( this.w, v.w );

		return this;

	},

	max: function ( v ) {

		this.x = Math.max( this.x, v.x );
		this.y = Math.max( this.y, v.y );
		this.z = Math.max( this.z, v.z );
		this.w = Math.max( this.w, v.w );

		return this;

	},

	clamp: function ( min, max ) {

		// assumes min < max, componentwise

		this.x = Math.max( min.x, Math.min( max.x, this.x ) );
		this.y = Math.max( min.y, Math.min( max.y, this.y ) );
		this.z = Math.max( min.z, Math.min( max.z, this.z ) );
		this.w = Math.max( min.w, Math.min( max.w, this.w ) );

		return this;

	},

	clampScalar: function () {

		var min, max;

		return function clampScalar( minVal, maxVal ) {

			if ( min === undefined ) {

				min = new Vector4();
				max = new Vector4();

			}

			min.set( minVal, minVal, minVal, minVal );
			max.set( maxVal, maxVal, maxVal, maxVal );

			return this.clamp( min, max );

		};

	}(),

	clampLength: function ( min, max ) {

		var length = this.length();

		return this.divideScalar( length || 1 ).multiplyScalar( Math.max( min, Math.min( max, length ) ) );

	},

	floor: function () {

		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );
		this.z = Math.floor( this.z );
		this.w = Math.floor( this.w );

		return this;

	},

	ceil: function () {

		this.x = Math.ceil( this.x );
		this.y = Math.ceil( this.y );
		this.z = Math.ceil( this.z );
		this.w = Math.ceil( this.w );

		return this;

	},

	round: function () {

		this.x = Math.round( this.x );
		this.y = Math.round( this.y );
		this.z = Math.round( this.z );
		this.w = Math.round( this.w );

		return this;

	},

	roundToZero: function () {

		this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
		this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );
		this.z = ( this.z < 0 ) ? Math.ceil( this.z ) : Math.floor( this.z );
		this.w = ( this.w < 0 ) ? Math.ceil( this.w ) : Math.floor( this.w );

		return this;

	},

	negate: function () {

		this.x = - this.x;
		this.y = - this.y;
		this.z = - this.z;
		this.w = - this.w;

		return this;

	},

	dot: function ( v ) {

		return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;

	},

	lengthSq: function () {

		return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;

	},

	length: function () {

		return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );

	},

	lengthManhattan: function () {

		return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z ) + Math.abs( this.w );

	},

	normalize: function () {

		return this.divideScalar( this.length() || 1 );

	},

	setLength: function ( length ) {

		return this.normalize().multiplyScalar( length );

	},

	lerp: function ( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;
		this.z += ( v.z - this.z ) * alpha;
		this.w += ( v.w - this.w ) * alpha;

		return this;

	},

	lerpVectors: function ( v1, v2, alpha ) {

		return this.subVectors( v2, v1 ).multiplyScalar( alpha ).add( v1 );

	},

	equals: function ( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) && ( v.w === this.w ) );

	},

	fromArray: function ( array, offset ) {

		if ( offset === undefined ) offset = 0;

		this.x = array[ offset ];
		this.y = array[ offset + 1 ];
		this.z = array[ offset + 2 ];
		this.w = array[ offset + 3 ];

		return this;

	},

	toArray: function ( array, offset ) {

		if ( array === undefined ) array = [];
		if ( offset === undefined ) offset = 0;

		array[ offset ] = this.x;
		array[ offset + 1 ] = this.y;
		array[ offset + 2 ] = this.z;
		array[ offset + 3 ] = this.w;

		return array;

	},

	fromBufferAttribute: function ( attribute, index, offset ) {

		if ( offset !== undefined ) {

			console.warn( 'THREE.Vector4: offset has been removed from .fromBufferAttribute().' );

		}

		this.x = attribute.getX( index );
		this.y = attribute.getY( index );
		this.z = attribute.getZ( index );
		this.w = attribute.getW( index );

		return this;

	}

} );

/**
 * @author szimek / https://github.com/szimek/
 * @author alteredq / http://alteredqualia.com/
 * @author Marius Kintel / https://github.com/kintel
 */

/*
 In options, we can specify:
 * Texture parameters for an auto-generated target texture
 * depthBuffer/stencilBuffer: Booleans to indicate if we should generate these buffers
*/
function WebGLRenderTarget( width, height, options ) {

	this.uuid = _Math.generateUUID();

	this.width = width;
	this.height = height;

	this.scissor = new Vector4( 0, 0, width, height );
	this.scissorTest = false;

	this.viewport = new Vector4( 0, 0, width, height );

	options = options || {};

	if ( options.minFilter === undefined ) options.minFilter = LinearFilter;

	this.texture = new Texture( undefined, undefined, options.wrapS, options.wrapT, options.magFilter, options.minFilter, options.format, options.type, options.anisotropy, options.encoding );

	this.depthBuffer = options.depthBuffer !== undefined ? options.depthBuffer : true;
	this.stencilBuffer = options.stencilBuffer !== undefined ? options.stencilBuffer : true;
	this.depthTexture = options.depthTexture !== undefined ? options.depthTexture : null;

}

Object.assign( WebGLRenderTarget.prototype, EventDispatcher.prototype, {

	isWebGLRenderTarget: true,

	setSize: function ( width, height ) {

		if ( this.width !== width || this.height !== height ) {

			this.width = width;
			this.height = height;

			this.dispose();

		}

		this.viewport.set( 0, 0, width, height );
		this.scissor.set( 0, 0, width, height );

	},

	clone: function () {

		return new this.constructor().copy( this );

	},

	copy: function ( source ) {

		this.width = source.width;
		this.height = source.height;

		this.viewport.copy( source.viewport );

		this.texture = source.texture.clone();

		this.depthBuffer = source.depthBuffer;
		this.stencilBuffer = source.stencilBuffer;
		this.depthTexture = source.depthTexture;

		return this;

	},

	dispose: function () {

		this.dispatchEvent( { type: 'dispose' } );

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 */

function CubeTexture( images, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, encoding ) {

	images = images !== undefined ? images : [];
	mapping = mapping !== undefined ? mapping : CubeReflectionMapping;

	Texture.call( this, images, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, encoding );

	this.flipY = false;

}

CubeTexture.prototype = Object.create( Texture.prototype );
CubeTexture.prototype.constructor = CubeTexture;

CubeTexture.prototype.isCubeTexture = true;

Object.defineProperty( CubeTexture.prototype, 'images', {

	get: function () {

		return this.image;

	},

	set: function ( value ) {

		this.image = value;

	}

} );

/**
 * @author tschw
 *
 * Uniforms of a program.
 * Those form a tree structure with a special top-level container for the root,
 * which you get by calling 'new WebGLUniforms( gl, program, renderer )'.
 *
 *
 * Properties of inner nodes including the top-level container:
 *
 * .seq - array of nested uniforms
 * .map - nested uniforms by name
 *
 *
 * Methods of all nodes except the top-level container:
 *
 * .setValue( gl, value, [renderer] )
 *
 * 		uploads a uniform value(s)
 *  	the 'renderer' parameter is needed for sampler uniforms
 *
 *
 * Static methods of the top-level container (renderer factorizations):
 *
 * .upload( gl, seq, values, renderer )
 *
 * 		sets uniforms in 'seq' to 'values[id].value'
 *
 * .seqWithValue( seq, values ) : filteredSeq
 *
 * 		filters 'seq' entries with corresponding entry in values
 *
 *
 * Methods of the top-level container (renderer factorizations):
 *
 * .setValue( gl, name, value )
 *
 * 		sets uniform with  name 'name' to 'value'
 *
 * .set( gl, obj, prop )
 *
 * 		sets uniform from object and property with same name than uniform
 *
 * .setOptional( gl, obj, prop )
 *
 * 		like .set for an optional property of the object
 *
 */

var emptyTexture = new Texture();
var emptyCubeTexture = new CubeTexture();

// --- Base for inner nodes (including the root) ---

function UniformContainer() {

	this.seq = [];
	this.map = {};

}

// --- Utilities ---

// Array Caches (provide typed arrays for temporary by size)

var arrayCacheF32 = [];
var arrayCacheI32 = [];

// Float32Array caches used for uploading Matrix uniforms

var mat4array = new Float32Array( 16 );
var mat3array = new Float32Array( 9 );

// Flattening for arrays of vectors and matrices

function flatten( array, nBlocks, blockSize ) {

	var firstElem = array[ 0 ];

	if ( firstElem <= 0 || firstElem > 0 ) return array;
	// unoptimized: ! isNaN( firstElem )
	// see http://jacksondunstan.com/articles/983

	var n = nBlocks * blockSize,
		r = arrayCacheF32[ n ];

	if ( r === undefined ) {

		r = new Float32Array( n );
		arrayCacheF32[ n ] = r;

	}

	if ( nBlocks !== 0 ) {

		firstElem.toArray( r, 0 );

		for ( var i = 1, offset = 0; i !== nBlocks; ++ i ) {

			offset += blockSize;
			array[ i ].toArray( r, offset );

		}

	}

	return r;

}

// Texture unit allocation

function allocTexUnits( renderer, n ) {

	var r = arrayCacheI32[ n ];

	if ( r === undefined ) {

		r = new Int32Array( n );
		arrayCacheI32[ n ] = r;

	}

	for ( var i = 0; i !== n; ++ i )
		r[ i ] = renderer.allocTextureUnit();

	return r;

}

// --- Setters ---

// Note: Defining these methods externally, because they come in a bunch
// and this way their names minify.

// Single scalar

function setValue1f( gl, v ) { gl.uniform1f( this.addr, v ); }
function setValue1i( gl, v ) { gl.uniform1i( this.addr, v ); }

// Single float vector (from flat array or THREE.VectorN)

function setValue2fv( gl, v ) {

	if ( v.x === undefined ) gl.uniform2fv( this.addr, v );
	else gl.uniform2f( this.addr, v.x, v.y );

}

function setValue3fv( gl, v ) {

	if ( v.x !== undefined )
		gl.uniform3f( this.addr, v.x, v.y, v.z );
	else if ( v.r !== undefined )
		gl.uniform3f( this.addr, v.r, v.g, v.b );
	else
		gl.uniform3fv( this.addr, v );

}

function setValue4fv( gl, v ) {

	if ( v.x === undefined ) gl.uniform4fv( this.addr, v );
	else gl.uniform4f( this.addr, v.x, v.y, v.z, v.w );

}

// Single matrix (from flat array or MatrixN)

function setValue2fm( gl, v ) {

	gl.uniformMatrix2fv( this.addr, false, v.elements || v );

}

function setValue3fm( gl, v ) {

	if ( v.elements === undefined ) {

		gl.uniformMatrix3fv( this.addr, false, v );

	} else {

		mat3array.set( v.elements );
		gl.uniformMatrix3fv( this.addr, false, mat3array );

	}

}

function setValue4fm( gl, v ) {

	if ( v.elements === undefined ) {

		gl.uniformMatrix4fv( this.addr, false, v );

	} else {

		mat4array.set( v.elements );
		gl.uniformMatrix4fv( this.addr, false, mat4array );

	}

}

// Single texture (2D / Cube)

function setValueT1( gl, v, renderer ) {

	var unit = renderer.allocTextureUnit();
	gl.uniform1i( this.addr, unit );
	renderer.setTexture2D( v || emptyTexture, unit );

}

function setValueT6( gl, v, renderer ) {

	var unit = renderer.allocTextureUnit();
	gl.uniform1i( this.addr, unit );
	renderer.setTextureCube( v || emptyCubeTexture, unit );

}

// Integer / Boolean vectors or arrays thereof (always flat arrays)

function setValue2iv( gl, v ) { gl.uniform2iv( this.addr, v ); }
function setValue3iv( gl, v ) { gl.uniform3iv( this.addr, v ); }
function setValue4iv( gl, v ) { gl.uniform4iv( this.addr, v ); }

// Helper to pick the right setter for the singular case

function getSingularSetter( type ) {

	switch ( type ) {

		case 0x1406: return setValue1f; // FLOAT
		case 0x8b50: return setValue2fv; // _VEC2
		case 0x8b51: return setValue3fv; // _VEC3
		case 0x8b52: return setValue4fv; // _VEC4

		case 0x8b5a: return setValue2fm; // _MAT2
		case 0x8b5b: return setValue3fm; // _MAT3
		case 0x8b5c: return setValue4fm; // _MAT4

		case 0x8b5e: case 0x8d66: return setValueT1; // SAMPLER_2D, SAMPLER_EXTERNAL_OES
		case 0x8b60: return setValueT6; // SAMPLER_CUBE

		case 0x1404: case 0x8b56: return setValue1i; // INT, BOOL
		case 0x8b53: case 0x8b57: return setValue2iv; // _VEC2
		case 0x8b54: case 0x8b58: return setValue3iv; // _VEC3
		case 0x8b55: case 0x8b59: return setValue4iv; // _VEC4

	}

}

// Array of scalars

function setValue1fv( gl, v ) { gl.uniform1fv( this.addr, v ); }
function setValue1iv( gl, v ) { gl.uniform1iv( this.addr, v ); }

// Array of vectors (flat or from THREE classes)

function setValueV2a( gl, v ) {

	gl.uniform2fv( this.addr, flatten( v, this.size, 2 ) );

}

function setValueV3a( gl, v ) {

	gl.uniform3fv( this.addr, flatten( v, this.size, 3 ) );

}

function setValueV4a( gl, v ) {

	gl.uniform4fv( this.addr, flatten( v, this.size, 4 ) );

}

// Array of matrices (flat or from THREE clases)

function setValueM2a( gl, v ) {

	gl.uniformMatrix2fv( this.addr, false, flatten( v, this.size, 4 ) );

}

function setValueM3a( gl, v ) {

	gl.uniformMatrix3fv( this.addr, false, flatten( v, this.size, 9 ) );

}

function setValueM4a( gl, v ) {

	gl.uniformMatrix4fv( this.addr, false, flatten( v, this.size, 16 ) );

}

// Array of textures (2D / Cube)

function setValueT1a( gl, v, renderer ) {

	var n = v.length,
		units = allocTexUnits( renderer, n );

	gl.uniform1iv( this.addr, units );

	for ( var i = 0; i !== n; ++ i ) {

		renderer.setTexture2D( v[ i ] || emptyTexture, units[ i ] );

	}

}

function setValueT6a( gl, v, renderer ) {

	var n = v.length,
		units = allocTexUnits( renderer, n );

	gl.uniform1iv( this.addr, units );

	for ( var i = 0; i !== n; ++ i ) {

		renderer.setTextureCube( v[ i ] || emptyCubeTexture, units[ i ] );

	}

}

// Helper to pick the right setter for a pure (bottom-level) array

function getPureArraySetter( type ) {

	switch ( type ) {

		case 0x1406: return setValue1fv; // FLOAT
		case 0x8b50: return setValueV2a; // _VEC2
		case 0x8b51: return setValueV3a; // _VEC3
		case 0x8b52: return setValueV4a; // _VEC4

		case 0x8b5a: return setValueM2a; // _MAT2
		case 0x8b5b: return setValueM3a; // _MAT3
		case 0x8b5c: return setValueM4a; // _MAT4

		case 0x8b5e: return setValueT1a; // SAMPLER_2D
		case 0x8b60: return setValueT6a; // SAMPLER_CUBE

		case 0x1404: case 0x8b56: return setValue1iv; // INT, BOOL
		case 0x8b53: case 0x8b57: return setValue2iv; // _VEC2
		case 0x8b54: case 0x8b58: return setValue3iv; // _VEC3
		case 0x8b55: case 0x8b59: return setValue4iv; // _VEC4

	}

}

// --- Uniform Classes ---

function SingleUniform( id, activeInfo, addr ) {

	this.id = id;
	this.addr = addr;
	this.setValue = getSingularSetter( activeInfo.type );

	// this.path = activeInfo.name; // DEBUG

}

function PureArrayUniform( id, activeInfo, addr ) {

	this.id = id;
	this.addr = addr;
	this.size = activeInfo.size;
	this.setValue = getPureArraySetter( activeInfo.type );

	// this.path = activeInfo.name; // DEBUG

}

function StructuredUniform( id ) {

	this.id = id;

	UniformContainer.call( this ); // mix-in

}

StructuredUniform.prototype.setValue = function ( gl, value ) {

	// Note: Don't need an extra 'renderer' parameter, since samplers
	// are not allowed in structured uniforms.

	var seq = this.seq;

	for ( var i = 0, n = seq.length; i !== n; ++ i ) {

		var u = seq[ i ];
		u.setValue( gl, value[ u.id ] );

	}

};

// --- Top-level ---

// Parser - builds up the property tree from the path strings

var RePathPart = /([\w\d_]+)(\])?(\[|\.)?/g;

// extracts
// 	- the identifier (member name or array index)
//  - followed by an optional right bracket (found when array index)
//  - followed by an optional left bracket or dot (type of subscript)
//
// Note: These portions can be read in a non-overlapping fashion and
// allow straightforward parsing of the hierarchy that WebGL encodes
// in the uniform names.

function addUniform( container, uniformObject ) {

	container.seq.push( uniformObject );
	container.map[ uniformObject.id ] = uniformObject;

}

function parseUniform( activeInfo, addr, container ) {

	var path = activeInfo.name,
		pathLength = path.length;

	// reset RegExp object, because of the early exit of a previous run
	RePathPart.lastIndex = 0;

	for ( ; ; ) {

		var match = RePathPart.exec( path ),
			matchEnd = RePathPart.lastIndex,

			id = match[ 1 ],
			idIsIndex = match[ 2 ] === ']',
			subscript = match[ 3 ];

		if ( idIsIndex ) id = id | 0; // convert to integer

		if ( subscript === undefined || subscript === '[' && matchEnd + 2 === pathLength ) {

			// bare name or "pure" bottom-level array "[0]" suffix

			addUniform( container, subscript === undefined ?
					new SingleUniform( id, activeInfo, addr ) :
					new PureArrayUniform( id, activeInfo, addr ) );

			break;

		} else {

			// step into inner node / create it in case it doesn't exist

			var map = container.map, next = map[ id ];

			if ( next === undefined ) {

				next = new StructuredUniform( id );
				addUniform( container, next );

			}

			container = next;

		}

	}

}

// Root Container

function WebGLUniforms( gl, program, renderer ) {

	UniformContainer.call( this );

	this.renderer = renderer;

	var n = gl.getProgramParameter( program, gl.ACTIVE_UNIFORMS );

	for ( var i = 0; i < n; ++ i ) {

		var info = gl.getActiveUniform( program, i ),
			path = info.name,
			addr = gl.getUniformLocation( program, path );

		parseUniform( info, addr, this );

	}

}

WebGLUniforms.prototype.setValue = function ( gl, name, value ) {

	var u = this.map[ name ];

	if ( u !== undefined ) u.setValue( gl, value, this.renderer );

};

WebGLUniforms.prototype.setOptional = function ( gl, object, name ) {

	var v = object[ name ];

	if ( v !== undefined ) this.setValue( gl, name, v );

};


// Static interface

WebGLUniforms.upload = function ( gl, seq, values, renderer ) {

	for ( var i = 0, n = seq.length; i !== n; ++ i ) {

		var u = seq[ i ],
			v = values[ u.id ];

		if ( v.needsUpdate !== false ) {

			// note: always updating when .needsUpdate is undefined
			u.setValue( gl, v.value, renderer );

		}

	}

};

WebGLUniforms.seqWithValue = function ( seq, values ) {

	var r = [];

	for ( var i = 0, n = seq.length; i !== n; ++ i ) {

		var u = seq[ i ];
		if ( u.id in values ) r.push( u );

	}

	return r;

};

/**
 * @author mrdoob / http://mrdoob.com/
 */

var ColorKeywords = { 'aliceblue': 0xF0F8FF, 'antiquewhite': 0xFAEBD7, 'aqua': 0x00FFFF, 'aquamarine': 0x7FFFD4, 'azure': 0xF0FFFF,
	'beige': 0xF5F5DC, 'bisque': 0xFFE4C4, 'black': 0x000000, 'blanchedalmond': 0xFFEBCD, 'blue': 0x0000FF, 'blueviolet': 0x8A2BE2,
	'brown': 0xA52A2A, 'burlywood': 0xDEB887, 'cadetblue': 0x5F9EA0, 'chartreuse': 0x7FFF00, 'chocolate': 0xD2691E, 'coral': 0xFF7F50,
	'cornflowerblue': 0x6495ED, 'cornsilk': 0xFFF8DC, 'crimson': 0xDC143C, 'cyan': 0x00FFFF, 'darkblue': 0x00008B, 'darkcyan': 0x008B8B,
	'darkgoldenrod': 0xB8860B, 'darkgray': 0xA9A9A9, 'darkgreen': 0x006400, 'darkgrey': 0xA9A9A9, 'darkkhaki': 0xBDB76B, 'darkmagenta': 0x8B008B,
	'darkolivegreen': 0x556B2F, 'darkorange': 0xFF8C00, 'darkorchid': 0x9932CC, 'darkred': 0x8B0000, 'darksalmon': 0xE9967A, 'darkseagreen': 0x8FBC8F,
	'darkslateblue': 0x483D8B, 'darkslategray': 0x2F4F4F, 'darkslategrey': 0x2F4F4F, 'darkturquoise': 0x00CED1, 'darkviolet': 0x9400D3,
	'deeppink': 0xFF1493, 'deepskyblue': 0x00BFFF, 'dimgray': 0x696969, 'dimgrey': 0x696969, 'dodgerblue': 0x1E90FF, 'firebrick': 0xB22222,
	'floralwhite': 0xFFFAF0, 'forestgreen': 0x228B22, 'fuchsia': 0xFF00FF, 'gainsboro': 0xDCDCDC, 'ghostwhite': 0xF8F8FF, 'gold': 0xFFD700,
	'goldenrod': 0xDAA520, 'gray': 0x808080, 'green': 0x008000, 'greenyellow': 0xADFF2F, 'grey': 0x808080, 'honeydew': 0xF0FFF0, 'hotpink': 0xFF69B4,
	'indianred': 0xCD5C5C, 'indigo': 0x4B0082, 'ivory': 0xFFFFF0, 'khaki': 0xF0E68C, 'lavender': 0xE6E6FA, 'lavenderblush': 0xFFF0F5, 'lawngreen': 0x7CFC00,
	'lemonchiffon': 0xFFFACD, 'lightblue': 0xADD8E6, 'lightcoral': 0xF08080, 'lightcyan': 0xE0FFFF, 'lightgoldenrodyellow': 0xFAFAD2, 'lightgray': 0xD3D3D3,
	'lightgreen': 0x90EE90, 'lightgrey': 0xD3D3D3, 'lightpink': 0xFFB6C1, 'lightsalmon': 0xFFA07A, 'lightseagreen': 0x20B2AA, 'lightskyblue': 0x87CEFA,
	'lightslategray': 0x778899, 'lightslategrey': 0x778899, 'lightsteelblue': 0xB0C4DE, 'lightyellow': 0xFFFFE0, 'lime': 0x00FF00, 'limegreen': 0x32CD32,
	'linen': 0xFAF0E6, 'magenta': 0xFF00FF, 'maroon': 0x800000, 'mediumaquamarine': 0x66CDAA, 'mediumblue': 0x0000CD, 'mediumorchid': 0xBA55D3,
	'mediumpurple': 0x9370DB, 'mediumseagreen': 0x3CB371, 'mediumslateblue': 0x7B68EE, 'mediumspringgreen': 0x00FA9A, 'mediumturquoise': 0x48D1CC,
	'mediumvioletred': 0xC71585, 'midnightblue': 0x191970, 'mintcream': 0xF5FFFA, 'mistyrose': 0xFFE4E1, 'moccasin': 0xFFE4B5, 'navajowhite': 0xFFDEAD,
	'navy': 0x000080, 'oldlace': 0xFDF5E6, 'olive': 0x808000, 'olivedrab': 0x6B8E23, 'orange': 0xFFA500, 'orangered': 0xFF4500, 'orchid': 0xDA70D6,
	'palegoldenrod': 0xEEE8AA, 'palegreen': 0x98FB98, 'paleturquoise': 0xAFEEEE, 'palevioletred': 0xDB7093, 'papayawhip': 0xFFEFD5, 'peachpuff': 0xFFDAB9,
	'peru': 0xCD853F, 'pink': 0xFFC0CB, 'plum': 0xDDA0DD, 'powderblue': 0xB0E0E6, 'purple': 0x800080, 'red': 0xFF0000, 'rosybrown': 0xBC8F8F,
	'royalblue': 0x4169E1, 'saddlebrown': 0x8B4513, 'salmon': 0xFA8072, 'sandybrown': 0xF4A460, 'seagreen': 0x2E8B57, 'seashell': 0xFFF5EE,
	'sienna': 0xA0522D, 'silver': 0xC0C0C0, 'skyblue': 0x87CEEB, 'slateblue': 0x6A5ACD, 'slategray': 0x708090, 'slategrey': 0x708090, 'snow': 0xFFFAFA,
	'springgreen': 0x00FF7F, 'steelblue': 0x4682B4, 'tan': 0xD2B48C, 'teal': 0x008080, 'thistle': 0xD8BFD8, 'tomato': 0xFF6347, 'turquoise': 0x40E0D0,
	'violet': 0xEE82EE, 'wheat': 0xF5DEB3, 'white': 0xFFFFFF, 'whitesmoke': 0xF5F5F5, 'yellow': 0xFFFF00, 'yellowgreen': 0x9ACD32 };

function Color( r, g, b ) {

	if ( g === undefined && b === undefined ) {

		// r is THREE.Color, hex or string
		return this.set( r );

	}

	return this.setRGB( r, g, b );

}

Object.assign( Color.prototype, {

	isColor: true,

	r: 1, g: 1, b: 1,

	set: function ( value ) {

		if ( value && value.isColor ) {

			this.copy( value );

		} else if ( typeof value === 'number' ) {

			this.setHex( value );

		} else if ( typeof value === 'string' ) {

			this.setStyle( value );

		}

		return this;

	},

	setScalar: function ( scalar ) {

		this.r = scalar;
		this.g = scalar;
		this.b = scalar;

		return this;

	},

	setHex: function ( hex ) {

		hex = Math.floor( hex );

		this.r = ( hex >> 16 & 255 ) / 255;
		this.g = ( hex >> 8 & 255 ) / 255;
		this.b = ( hex & 255 ) / 255;

		return this;

	},

	setRGB: function ( r, g, b ) {

		this.r = r;
		this.g = g;
		this.b = b;

		return this;

	},

	setHSL: function () {

		function hue2rgb( p, q, t ) {

			if ( t < 0 ) t += 1;
			if ( t > 1 ) t -= 1;
			if ( t < 1 / 6 ) return p + ( q - p ) * 6 * t;
			if ( t < 1 / 2 ) return q;
			if ( t < 2 / 3 ) return p + ( q - p ) * 6 * ( 2 / 3 - t );
			return p;

		}

		return function setHSL( h, s, l ) {

			// h,s,l ranges are in 0.0 - 1.0
			h = _Math.euclideanModulo( h, 1 );
			s = _Math.clamp( s, 0, 1 );
			l = _Math.clamp( l, 0, 1 );

			if ( s === 0 ) {

				this.r = this.g = this.b = l;

			} else {

				var p = l <= 0.5 ? l * ( 1 + s ) : l + s - ( l * s );
				var q = ( 2 * l ) - p;

				this.r = hue2rgb( q, p, h + 1 / 3 );
				this.g = hue2rgb( q, p, h );
				this.b = hue2rgb( q, p, h - 1 / 3 );

			}

			return this;

		};

	}(),

	setStyle: function ( style ) {

		function handleAlpha( string ) {

			if ( string === undefined ) return;

			if ( parseFloat( string ) < 1 ) {

				console.warn( 'THREE.Color: Alpha component of ' + style + ' will be ignored.' );

			}

		}


		var m;

		if ( m = /^((?:rgb|hsl)a?)\(\s*([^\)]*)\)/.exec( style ) ) {

			// rgb / hsl

			var color;
			var name = m[ 1 ];
			var components = m[ 2 ];

			switch ( name ) {

				case 'rgb':
				case 'rgba':

					if ( color = /^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/.exec( components ) ) {

						// rgb(255,0,0) rgba(255,0,0,0.5)
						this.r = Math.min( 255, parseInt( color[ 1 ], 10 ) ) / 255;
						this.g = Math.min( 255, parseInt( color[ 2 ], 10 ) ) / 255;
						this.b = Math.min( 255, parseInt( color[ 3 ], 10 ) ) / 255;

						handleAlpha( color[ 5 ] );

						return this;

					}

					if ( color = /^(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/.exec( components ) ) {

						// rgb(100%,0%,0%) rgba(100%,0%,0%,0.5)
						this.r = Math.min( 100, parseInt( color[ 1 ], 10 ) ) / 100;
						this.g = Math.min( 100, parseInt( color[ 2 ], 10 ) ) / 100;
						this.b = Math.min( 100, parseInt( color[ 3 ], 10 ) ) / 100;

						handleAlpha( color[ 5 ] );

						return this;

					}

					break;

				case 'hsl':
				case 'hsla':

					if ( color = /^([0-9]*\.?[0-9]+)\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/.exec( components ) ) {

						// hsl(120,50%,50%) hsla(120,50%,50%,0.5)
						var h = parseFloat( color[ 1 ] ) / 360;
						var s = parseInt( color[ 2 ], 10 ) / 100;
						var l = parseInt( color[ 3 ], 10 ) / 100;

						handleAlpha( color[ 5 ] );

						return this.setHSL( h, s, l );

					}

					break;

			}

		} else if ( m = /^\#([A-Fa-f0-9]+)$/.exec( style ) ) {

			// hex color

			var hex = m[ 1 ];
			var size = hex.length;

			if ( size === 3 ) {

				// #ff0
				this.r = parseInt( hex.charAt( 0 ) + hex.charAt( 0 ), 16 ) / 255;
				this.g = parseInt( hex.charAt( 1 ) + hex.charAt( 1 ), 16 ) / 255;
				this.b = parseInt( hex.charAt( 2 ) + hex.charAt( 2 ), 16 ) / 255;

				return this;

			} else if ( size === 6 ) {

				// #ff0000
				this.r = parseInt( hex.charAt( 0 ) + hex.charAt( 1 ), 16 ) / 255;
				this.g = parseInt( hex.charAt( 2 ) + hex.charAt( 3 ), 16 ) / 255;
				this.b = parseInt( hex.charAt( 4 ) + hex.charAt( 5 ), 16 ) / 255;

				return this;

			}

		}

		if ( style && style.length > 0 ) {

			// color keywords
			var hex = ColorKeywords[ style ];

			if ( hex !== undefined ) {

				// red
				this.setHex( hex );

			} else {

				// unknown color
				console.warn( 'THREE.Color: Unknown color ' + style );

			}

		}

		return this;

	},

	clone: function () {

		return new this.constructor( this.r, this.g, this.b );

	},

	copy: function ( color ) {

		this.r = color.r;
		this.g = color.g;
		this.b = color.b;

		return this;

	},

	copyGammaToLinear: function ( color, gammaFactor ) {

		if ( gammaFactor === undefined ) gammaFactor = 2.0;

		this.r = Math.pow( color.r, gammaFactor );
		this.g = Math.pow( color.g, gammaFactor );
		this.b = Math.pow( color.b, gammaFactor );

		return this;

	},

	copyLinearToGamma: function ( color, gammaFactor ) {

		if ( gammaFactor === undefined ) gammaFactor = 2.0;

		var safeInverse = ( gammaFactor > 0 ) ? ( 1.0 / gammaFactor ) : 1.0;

		this.r = Math.pow( color.r, safeInverse );
		this.g = Math.pow( color.g, safeInverse );
		this.b = Math.pow( color.b, safeInverse );

		return this;

	},

	convertGammaToLinear: function () {

		var r = this.r, g = this.g, b = this.b;

		this.r = r * r;
		this.g = g * g;
		this.b = b * b;

		return this;

	},

	convertLinearToGamma: function () {

		this.r = Math.sqrt( this.r );
		this.g = Math.sqrt( this.g );
		this.b = Math.sqrt( this.b );

		return this;

	},

	getHex: function () {

		return ( this.r * 255 ) << 16 ^ ( this.g * 255 ) << 8 ^ ( this.b * 255 ) << 0;

	},

	getHexString: function () {

		return ( '000000' + this.getHex().toString( 16 ) ).slice( - 6 );

	},

	getHSL: function ( optionalTarget ) {

		// h,s,l ranges are in 0.0 - 1.0

		var hsl = optionalTarget || { h: 0, s: 0, l: 0 };

		var r = this.r, g = this.g, b = this.b;

		var max = Math.max( r, g, b );
		var min = Math.min( r, g, b );

		var hue, saturation;
		var lightness = ( min + max ) / 2.0;

		if ( min === max ) {

			hue = 0;
			saturation = 0;

		} else {

			var delta = max - min;

			saturation = lightness <= 0.5 ? delta / ( max + min ) : delta / ( 2 - max - min );

			switch ( max ) {

				case r: hue = ( g - b ) / delta + ( g < b ? 6 : 0 ); break;
				case g: hue = ( b - r ) / delta + 2; break;
				case b: hue = ( r - g ) / delta + 4; break;

			}

			hue /= 6;

		}

		hsl.h = hue;
		hsl.s = saturation;
		hsl.l = lightness;

		return hsl;

	},

	getStyle: function () {

		return 'rgb(' + ( ( this.r * 255 ) | 0 ) + ',' + ( ( this.g * 255 ) | 0 ) + ',' + ( ( this.b * 255 ) | 0 ) + ')';

	},

	offsetHSL: function ( h, s, l ) {

		var hsl = this.getHSL();

		hsl.h += h; hsl.s += s; hsl.l += l;

		this.setHSL( hsl.h, hsl.s, hsl.l );

		return this;

	},

	add: function ( color ) {

		this.r += color.r;
		this.g += color.g;
		this.b += color.b;

		return this;

	},

	addColors: function ( color1, color2 ) {

		this.r = color1.r + color2.r;
		this.g = color1.g + color2.g;
		this.b = color1.b + color2.b;

		return this;

	},

	addScalar: function ( s ) {

		this.r += s;
		this.g += s;
		this.b += s;

		return this;

	},

	sub: function( color ) {

		this.r = Math.max( 0, this.r - color.r );
		this.g = Math.max( 0, this.g - color.g );
		this.b = Math.max( 0, this.b - color.b );

		return this;

	},

	multiply: function ( color ) {

		this.r *= color.r;
		this.g *= color.g;
		this.b *= color.b;

		return this;

	},

	multiplyScalar: function ( s ) {

		this.r *= s;
		this.g *= s;
		this.b *= s;

		return this;

	},

	lerp: function ( color, alpha ) {

		this.r += ( color.r - this.r ) * alpha;
		this.g += ( color.g - this.g ) * alpha;
		this.b += ( color.b - this.b ) * alpha;

		return this;

	},

	equals: function ( c ) {

		return ( c.r === this.r ) && ( c.g === this.g ) && ( c.b === this.b );

	},

	fromArray: function ( array, offset ) {

		if ( offset === undefined ) offset = 0;

		this.r = array[ offset ];
		this.g = array[ offset + 1 ];
		this.b = array[ offset + 2 ];

		return this;

	},

	toArray: function ( array, offset ) {

		if ( array === undefined ) array = [];
		if ( offset === undefined ) offset = 0;

		array[ offset ] = this.r;
		array[ offset + 1 ] = this.g;
		array[ offset + 2 ] = this.b;

		return array;

	},

	toJSON: function () {

		return this.getHex();

	}

} );

/**
 * Uniforms library for shared webgl shaders
 */

var UniformsLib = {

	common: {

		diffuse: { value: new Color( 0xeeeeee ) },
		opacity: { value: 1.0 },

		map: { value: null },
		offsetRepeat: { value: new Vector4( 0, 0, 1, 1 ) },

		specularMap: { value: null },
		alphaMap: { value: null },

		envMap: { value: null },
		flipEnvMap: { value: - 1 },
		reflectivity: { value: 1.0 },
		refractionRatio: { value: 0.98 }

	},

	aomap: {

		aoMap: { value: null },
		aoMapIntensity: { value: 1 }

	},

	lightmap: {

		lightMap: { value: null },
		lightMapIntensity: { value: 1 }

	},

	emissivemap: {

		emissiveMap: { value: null }

	},

	bumpmap: {

		bumpMap: { value: null },
		bumpScale: { value: 1 }

	},

	normalmap: {

		normalMap: { value: null },
		normalScale: { value: new Vector2( 1, 1 ) }

	},

	displacementmap: {

		displacementMap: { value: null },
		displacementScale: { value: 1 },
		displacementBias: { value: 0 }

	},

	roughnessmap: {

		roughnessMap: { value: null }

	},

	metalnessmap: {

		metalnessMap: { value: null }

	},

	gradientmap: {

		gradientMap: { value: null }

	},

	fog: {

		fogDensity: { value: 0.00025 },
		fogNear: { value: 1 },
		fogFar: { value: 2000 },
		fogColor: { value: new Color( 0xffffff ) }

	},

	lights: {

		ambientLightColor: { value: [] },

		directionalLights: { value: [], properties: {
			direction: {},
			color: {},

			shadow: {},
			shadowBias: {},
			shadowRadius: {},
			shadowMapSize: {}
		} },

		directionalShadowMap: { value: [] },
		directionalShadowMatrix: { value: [] },

		spotLights: { value: [], properties: {
			color: {},
			position: {},
			direction: {},
			distance: {},
			coneCos: {},
			penumbraCos: {},
			decay: {},

			shadow: {},
			shadowBias: {},
			shadowRadius: {},
			shadowMapSize: {}
		} },

		spotShadowMap: { value: [] },
		spotShadowMatrix: { value: [] },

		pointLights: { value: [], properties: {
			color: {},
			position: {},
			decay: {},
			distance: {},

			shadow: {},
			shadowBias: {},
			shadowRadius: {},
			shadowMapSize: {}
		} },

		pointShadowMap: { value: [] },
		pointShadowMatrix: { value: [] },

		hemisphereLights: { value: [], properties: {
			direction: {},
			skyColor: {},
			groundColor: {}
		} },

		// TODO (abelnation): RectAreaLight BRDF data needs to be moved from example to main src
		rectAreaLights: { value: [], properties: {
			color: {},
			position: {},
			width: {},
			height: {}
		} }

	},

	points: {

		diffuse: { value: new Color( 0xeeeeee ) },
		opacity: { value: 1.0 },
		size: { value: 1.0 },
		scale: { value: 1.0 },
		map: { value: null },
		offsetRepeat: { value: new Vector4( 0, 0, 1, 1 ) }

	}

};

/**
 * Uniform Utilities
 */

var UniformsUtils = {

	merge: function ( uniforms ) {

		var merged = {};

		for ( var u = 0; u < uniforms.length; u ++ ) {

			var tmp = this.clone( uniforms[ u ] );

			for ( var p in tmp ) {

				merged[ p ] = tmp[ p ];

			}

		}

		return merged;

	},

	clone: function ( uniforms_src ) {

		var uniforms_dst = {};

		for ( var u in uniforms_src ) {

			uniforms_dst[ u ] = {};

			for ( var p in uniforms_src[ u ] ) {

				var parameter_src = uniforms_src[ u ][ p ];

				if ( parameter_src && ( parameter_src.isColor ||
					parameter_src.isMatrix3 || parameter_src.isMatrix4 ||
					parameter_src.isVector2 || parameter_src.isVector3 || parameter_src.isVector4 ||
					parameter_src.isTexture ) ) {

					uniforms_dst[ u ][ p ] = parameter_src.clone();

				} else if ( Array.isArray( parameter_src ) ) {

					uniforms_dst[ u ][ p ] = parameter_src.slice();

				} else {

					uniforms_dst[ u ][ p ] = parameter_src;

				}

			}

		}

		return uniforms_dst;

	}

};

var alphamap_fragment = "#ifdef USE_ALPHAMAP\r\n\r\n\tdiffuseColor.a *= texture2D( alphaMap, vUv ).g;\r\n\r\n#endif\r\n";

var alphamap_pars_fragment = "#ifdef USE_ALPHAMAP\r\n\r\n\tuniform sampler2D alphaMap;\r\n\r\n#endif\r\n";

var alphatest_fragment = "#ifdef ALPHATEST\r\n\r\n\tif ( diffuseColor.a < ALPHATEST ) discard;\r\n\r\n#endif\r\n";

var aomap_fragment = "#ifdef USE_AOMAP\r\n\r\n\t// reads channel R, compatible with a combined OcclusionRoughnessMetallic (RGB) texture\r\n\tfloat ambientOcclusion = ( texture2D( aoMap, vUv2 ).r - 1.0 ) * aoMapIntensity + 1.0;\r\n\r\n\treflectedLight.indirectDiffuse *= ambientOcclusion;\r\n\r\n\t#if defined( USE_ENVMAP ) && defined( PHYSICAL )\r\n\r\n\t\tfloat dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );\r\n\r\n\t\treflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );\r\n\r\n\t#endif\r\n\r\n#endif\r\n";

var aomap_pars_fragment = "#ifdef USE_AOMAP\r\n\r\n\tuniform sampler2D aoMap;\r\n\tuniform float aoMapIntensity;\r\n\r\n#endif";

var begin_vertex = "\r\nvec3 transformed = vec3( position );\r\n";

var beginnormal_vertex = "\r\nvec3 objectNormal = vec3( normal );\r\n";

var bsdfs = "float punctualLightIntensityToIrradianceFactor( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {\r\n\r\n\tif( decayExponent > 0.0 ) {\r\n\r\n#if defined ( PHYSICALLY_CORRECT_LIGHTS )\r\n\r\n\t\t// based upon Frostbite 3 Moving to Physically-based Rendering\r\n\t\t// page 32, equation 26: E[window1]\r\n\t\t// http://www.frostbite.com/wp-content/uploads/2014/11/course_notes_moving_frostbite_to_pbr_v2.pdf\r\n\t\t// this is intended to be used on spot and point lights who are represented as luminous intensity\r\n\t\t// but who must be converted to luminous irradiance for surface lighting calculation\r\n\t\tfloat distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );\r\n\t\tfloat maxDistanceCutoffFactor = pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );\r\n\t\treturn distanceFalloff * maxDistanceCutoffFactor;\r\n\r\n#else\r\n\r\n\t\treturn pow( saturate( -lightDistance / cutoffDistance + 1.0 ), decayExponent );\r\n\r\n#endif\r\n\r\n\t}\r\n\r\n\treturn 1.0;\r\n\r\n}\r\n\r\nvec3 BRDF_Diffuse_Lambert( const in vec3 diffuseColor ) {\r\n\r\n\treturn RECIPROCAL_PI * diffuseColor;\r\n\r\n} // validated\r\n\r\nvec3 F_Schlick( const in vec3 specularColor, const in float dotLH ) {\r\n\r\n\t// Original approximation by Christophe Schlick '94\r\n\t// float fresnel = pow( 1.0 - dotLH, 5.0 );\r\n\r\n\t// Optimized variant (presented by Epic at SIGGRAPH '13)\r\n\tfloat fresnel = exp2( ( -5.55473 * dotLH - 6.98316 ) * dotLH );\r\n\r\n\treturn ( 1.0 - specularColor ) * fresnel + specularColor;\r\n\r\n} // validated\r\n\r\n// Microfacet Models for Refraction through Rough Surfaces - equation (34)\r\n// http://graphicrants.blogspot.com/2013/08/specular-brdf-reference.html\r\n// alpha is \"roughness squared\" in Disney’s reparameterization\r\nfloat G_GGX_Smith( const in float alpha, const in float dotNL, const in float dotNV ) {\r\n\r\n\t// geometry term = G(l)⋅G(v) / 4(n⋅l)(n⋅v)\r\n\r\n\tfloat a2 = pow2( alpha );\r\n\r\n\tfloat gl = dotNL + sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );\r\n\tfloat gv = dotNV + sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );\r\n\r\n\treturn 1.0 / ( gl * gv );\r\n\r\n} // validated\r\n\r\n// Moving Frostbite to Physically Based Rendering 2.0 - page 12, listing 2\r\n// http://www.frostbite.com/wp-content/uploads/2014/11/course_notes_moving_frostbite_to_pbr_v2.pdf\r\nfloat G_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {\r\n\r\n\tfloat a2 = pow2( alpha );\r\n\r\n\t// dotNL and dotNV are explicitly swapped. This is not a mistake.\r\n\tfloat gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );\r\n\tfloat gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );\r\n\r\n\treturn 0.5 / max( gv + gl, EPSILON );\r\n}\r\n\r\n// Microfacet Models for Refraction through Rough Surfaces - equation (33)\r\n// http://graphicrants.blogspot.com/2013/08/specular-brdf-reference.html\r\n// alpha is \"roughness squared\" in Disney’s reparameterization\r\nfloat D_GGX( const in float alpha, const in float dotNH ) {\r\n\r\n\tfloat a2 = pow2( alpha );\r\n\r\n\tfloat denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0; // avoid alpha = 0 with dotNH = 1\r\n\r\n\treturn RECIPROCAL_PI * a2 / pow2( denom );\r\n\r\n}\r\n\r\n// GGX Distribution, Schlick Fresnel, GGX-Smith Visibility\r\nvec3 BRDF_Specular_GGX( const in IncidentLight incidentLight, const in GeometricContext geometry, const in vec3 specularColor, const in float roughness ) {\r\n\r\n\tfloat alpha = pow2( roughness ); // UE4's roughness\r\n\r\n\tvec3 halfDir = normalize( incidentLight.direction + geometry.viewDir );\r\n\r\n\tfloat dotNL = saturate( dot( geometry.normal, incidentLight.direction ) );\r\n\tfloat dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );\r\n\tfloat dotNH = saturate( dot( geometry.normal, halfDir ) );\r\n\tfloat dotLH = saturate( dot( incidentLight.direction, halfDir ) );\r\n\r\n\tvec3 F = F_Schlick( specularColor, dotLH );\r\n\r\n\tfloat G = G_GGX_SmithCorrelated( alpha, dotNL, dotNV );\r\n\r\n\tfloat D = D_GGX( alpha, dotNH );\r\n\r\n\treturn F * ( G * D );\r\n\r\n} // validated\r\n\r\n// Rect Area Light\r\n\r\n// Area light computation code adapted from:\r\n// Real-Time Polygonal-Light Shading with Linearly Transformed Cosines\r\n// By: Eric Heitz, Jonathan Dupuy, Stephen Hill and David Neubelt\r\n// https://drive.google.com/file/d/0BzvWIdpUpRx_d09ndGVjNVJzZjA/view\r\n// https://eheitzresearch.wordpress.com/415-2/\r\n// http://blog.selfshadow.com/sandbox/ltc.html\r\n\r\nvec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {\r\n\r\n\tconst float LUT_SIZE  = 64.0;\r\n\tconst float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;\r\n\tconst float LUT_BIAS  = 0.5 / LUT_SIZE;\r\n\r\n\tfloat theta = acos( dot( N, V ) );\r\n\r\n\t// Parameterization of texture:\r\n\t// sqrt(roughness) -> [0,1]\r\n\t// theta -> [0, PI/2]\r\n\tvec2 uv = vec2(\r\n\t\tsqrt( saturate( roughness ) ),\r\n\t\tsaturate( theta / ( 0.5 * PI ) ) );\r\n\r\n\t// Ensure we don't have nonlinearities at the look-up table's edges\r\n\t// see: http://http.developer.nvidia.com/GPUGems2/gpugems2_chapter24.html\r\n\t//      \"Shader Analysis\" section\r\n\tuv = uv * LUT_SCALE + LUT_BIAS;\r\n\r\n\treturn uv;\r\n\r\n}\r\n\r\n// Real-Time Area Lighting: a Journey from Research to Production\r\n// By: Stephen Hill & Eric Heitz\r\n// http://advances.realtimerendering.com/s2016/s2016_ltc_rnd.pdf\r\n// An approximation for the form factor of a clipped rectangle.\r\nfloat LTC_ClippedSphereFormFactor( const in vec3 f ) {\r\n\r\n\tfloat l = length( f );\r\n\r\n\treturn max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );\r\n\r\n}\r\n\r\n// Real-Time Polygonal-Light Shading with Linearly Transformed Cosines\r\n// also Real-Time Area Lighting: a Journey from Research to Production\r\n// http://advances.realtimerendering.com/s2016/s2016_ltc_rnd.pdf\r\n// Normalization by 2*PI is incorporated in this function itself.\r\n// theta/sin(theta) is approximated by rational polynomial\r\nvec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {\r\n\r\n\tfloat x = dot( v1, v2 );\r\n\r\n\tfloat y = abs( x );\r\n\tfloat a = 0.86267 + (0.49788 + 0.01436 * y ) * y;\r\n\tfloat b = 3.45068 + (4.18814 + y) * y;\r\n\tfloat v = a / b;\r\n\r\n\tfloat theta_sintheta = (x > 0.0) ? v : 0.5 * inversesqrt( 1.0 - x * x ) - v;\r\n\r\n\treturn cross( v1, v2 ) * theta_sintheta;\r\n\r\n}\r\n\r\nvec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {\r\n\r\n\t// bail if point is on back side of plane of light\r\n\t// assumes ccw winding order of light vertices\r\n\tvec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];\r\n\tvec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];\r\n\tvec3 lightNormal = cross( v1, v2 );\r\n\r\n\tif( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );\r\n\r\n\t// construct orthonormal basis around N\r\n\tvec3 T1, T2;\r\n\tT1 = normalize( V - N * dot( V, N ) );\r\n\tT2 = - cross( N, T1 ); // negated from paper; possibly due to a different assumed handedness of world coordinate system\r\n\r\n\t// compute transform\r\n\tmat3 mat = mInv * transpose( mat3( T1, T2, N ) );\r\n\r\n\t// transform rect\r\n\tvec3 coords[ 4 ];\r\n\tcoords[ 0 ] = mat * ( rectCoords[ 0 ] - P );\r\n\tcoords[ 1 ] = mat * ( rectCoords[ 1 ] - P );\r\n\tcoords[ 2 ] = mat * ( rectCoords[ 2 ] - P );\r\n\tcoords[ 3 ] = mat * ( rectCoords[ 3 ] - P );\r\n\r\n\t// project rect onto sphere\r\n\tcoords[ 0 ] = normalize( coords[ 0 ] );\r\n\tcoords[ 1 ] = normalize( coords[ 1 ] );\r\n\tcoords[ 2 ] = normalize( coords[ 2 ] );\r\n\tcoords[ 3 ] = normalize( coords[ 3 ] );\r\n\r\n\t// calculate vector form factor\r\n\tvec3 vectorFormFactor = vec3( 0.0 );\r\n\tvectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );\r\n\tvectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );\r\n\tvectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );\r\n\tvectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );\r\n\r\n\t// adjust for horizon clipping\r\n\tvec3 result = vec3( LTC_ClippedSphereFormFactor( vectorFormFactor ) );\r\n\r\n\treturn result;\r\n\r\n}\r\n\r\n// End Rect Area Light\r\n\r\n// ref: https://www.unrealengine.com/blog/physically-based-shading-on-mobile - environmentBRDF for GGX on mobile\r\nvec3 BRDF_Specular_GGX_Environment( const in GeometricContext geometry, const in vec3 specularColor, const in float roughness ) {\r\n\r\n\tfloat dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );\r\n\r\n\tconst vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );\r\n\r\n\tconst vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );\r\n\r\n\tvec4 r = roughness * c0 + c1;\r\n\r\n\tfloat a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;\r\n\r\n\tvec2 AB = vec2( -1.04, 1.04 ) * a004 + r.zw;\r\n\r\n\treturn specularColor * AB.x + AB.y;\r\n\r\n} // validated\r\n\r\n\r\nfloat G_BlinnPhong_Implicit( ) {\r\n\r\n\t// geometry term is (n dot l)(n dot v) / 4(n dot l)(n dot v)\r\n\treturn 0.25;\r\n\r\n}\r\n\r\nfloat D_BlinnPhong( const in float shininess, const in float dotNH ) {\r\n\r\n\treturn RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );\r\n\r\n}\r\n\r\nvec3 BRDF_Specular_BlinnPhong( const in IncidentLight incidentLight, const in GeometricContext geometry, const in vec3 specularColor, const in float shininess ) {\r\n\r\n\tvec3 halfDir = normalize( incidentLight.direction + geometry.viewDir );\r\n\r\n\t//float dotNL = saturate( dot( geometry.normal, incidentLight.direction ) );\r\n\t//float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );\r\n\tfloat dotNH = saturate( dot( geometry.normal, halfDir ) );\r\n\tfloat dotLH = saturate( dot( incidentLight.direction, halfDir ) );\r\n\r\n\tvec3 F = F_Schlick( specularColor, dotLH );\r\n\r\n\tfloat G = G_BlinnPhong_Implicit( );\r\n\r\n\tfloat D = D_BlinnPhong( shininess, dotNH );\r\n\r\n\treturn F * ( G * D );\r\n\r\n} // validated\r\n\r\n// source: http://simonstechblog.blogspot.ca/2011/12/microfacet-brdf.html\r\nfloat GGXRoughnessToBlinnExponent( const in float ggxRoughness ) {\r\n\treturn ( 2.0 / pow2( ggxRoughness + 0.0001 ) - 2.0 );\r\n}\r\n\r\nfloat BlinnExponentToGGXRoughness( const in float blinnExponent ) {\r\n\treturn sqrt( 2.0 / ( blinnExponent + 2.0 ) );\r\n}\r\n";

var bumpmap_pars_fragment = "#ifdef USE_BUMPMAP\r\n\r\n\tuniform sampler2D bumpMap;\r\n\tuniform float bumpScale;\r\n\r\n\t// Derivative maps - bump mapping unparametrized surfaces by Morten Mikkelsen\r\n\t// http://mmikkelsen3d.blogspot.sk/2011/07/derivative-maps.html\r\n\r\n\t// Evaluate the derivative of the height w.r.t. screen-space using forward differencing (listing 2)\r\n\r\n\tvec2 dHdxy_fwd() {\r\n\r\n\t\tvec2 dSTdx = dFdx( vUv );\r\n\t\tvec2 dSTdy = dFdy( vUv );\r\n\r\n\t\tfloat Hll = bumpScale * texture2D( bumpMap, vUv ).x;\r\n\t\tfloat dBx = bumpScale * texture2D( bumpMap, vUv + dSTdx ).x - Hll;\r\n\t\tfloat dBy = bumpScale * texture2D( bumpMap, vUv + dSTdy ).x - Hll;\r\n\r\n\t\treturn vec2( dBx, dBy );\r\n\r\n\t}\r\n\r\n\tvec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy ) {\r\n\r\n\t\t// Workaround for Adreno 3XX dFd*( vec3 ) bug. See #9988\r\n\r\n\t\tvec3 vSigmaX = vec3( dFdx( surf_pos.x ), dFdx( surf_pos.y ), dFdx( surf_pos.z ) );\r\n\t\tvec3 vSigmaY = vec3( dFdy( surf_pos.x ), dFdy( surf_pos.y ), dFdy( surf_pos.z ) );\r\n\t\tvec3 vN = surf_norm;\t\t// normalized\r\n\r\n\t\tvec3 R1 = cross( vSigmaY, vN );\r\n\t\tvec3 R2 = cross( vN, vSigmaX );\r\n\r\n\t\tfloat fDet = dot( vSigmaX, R1 );\r\n\r\n\t\tvec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );\r\n\t\treturn normalize( abs( fDet ) * surf_norm - vGrad );\r\n\r\n\t}\r\n\r\n#endif\r\n";

var clipping_planes_fragment = "#if NUM_CLIPPING_PLANES > 0\r\n\r\n\tfor ( int i = 0; i < UNION_CLIPPING_PLANES; ++ i ) {\r\n\r\n\t\tvec4 plane = clippingPlanes[ i ];\r\n\t\tif ( dot( vViewPosition, plane.xyz ) > plane.w ) discard;\r\n\r\n\t}\r\n\t\t\r\n\t#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES\r\n\r\n\t\tbool clipped = true;\r\n\t\tfor ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; ++ i ) {\r\n\t\t\tvec4 plane = clippingPlanes[ i ];\r\n\t\t\tclipped = ( dot( vViewPosition, plane.xyz ) > plane.w ) && clipped;\r\n\t\t}\r\n\r\n\t\tif ( clipped ) discard;\r\n\t\r\n\t#endif\r\n\r\n#endif\r\n";

var clipping_planes_pars_fragment = "#if NUM_CLIPPING_PLANES > 0\r\n\r\n\t#if ! defined( PHYSICAL ) && ! defined( PHONG )\r\n\t\tvarying vec3 vViewPosition;\r\n\t#endif\r\n\r\n\tuniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];\r\n\r\n#endif\r\n";

var clipping_planes_pars_vertex = "#if NUM_CLIPPING_PLANES > 0 && ! defined( PHYSICAL ) && ! defined( PHONG )\r\n\tvarying vec3 vViewPosition;\r\n#endif\r\n";

var clipping_planes_vertex = "#if NUM_CLIPPING_PLANES > 0 && ! defined( PHYSICAL ) && ! defined( PHONG )\r\n\tvViewPosition = - mvPosition.xyz;\r\n#endif\r\n\r\n";

var color_fragment = "#ifdef USE_COLOR\r\n\r\n\tdiffuseColor.rgb *= vColor;\r\n\r\n#endif";

var color_pars_fragment = "#ifdef USE_COLOR\r\n\r\n\tvarying vec3 vColor;\r\n\r\n#endif\r\n";

var color_pars_vertex = "#ifdef USE_COLOR\r\n\r\n\tvarying vec3 vColor;\r\n\r\n#endif";

var color_vertex = "#ifdef USE_COLOR\r\n\r\n\tvColor.xyz = color.xyz;\r\n\r\n#endif";

var common = "#define PI 3.14159265359\r\n#define PI2 6.28318530718\r\n#define PI_HALF 1.5707963267949\r\n#define RECIPROCAL_PI 0.31830988618\r\n#define RECIPROCAL_PI2 0.15915494\r\n#define LOG2 1.442695\r\n#define EPSILON 1e-6\r\n\r\n#define saturate(a) clamp( a, 0.0, 1.0 )\r\n#define whiteCompliment(a) ( 1.0 - saturate( a ) )\r\n\r\nfloat pow2( const in float x ) { return x*x; }\r\nfloat pow3( const in float x ) { return x*x*x; }\r\nfloat pow4( const in float x ) { float x2 = x*x; return x2*x2; }\r\nfloat average( const in vec3 color ) { return dot( color, vec3( 0.3333 ) ); }\r\n// expects values in the range of [0,1]x[0,1], returns values in the [0,1] range.\r\n// do not collapse into a single function per: http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/\r\nhighp float rand( const in vec2 uv ) {\r\n\tconst highp float a = 12.9898, b = 78.233, c = 43758.5453;\r\n\thighp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );\r\n\treturn fract(sin(sn) * c);\r\n}\r\n\r\nstruct IncidentLight {\r\n\tvec3 color;\r\n\tvec3 direction;\r\n\tbool visible;\r\n};\r\n\r\nstruct ReflectedLight {\r\n\tvec3 directDiffuse;\r\n\tvec3 directSpecular;\r\n\tvec3 indirectDiffuse;\r\n\tvec3 indirectSpecular;\r\n};\r\n\r\nstruct GeometricContext {\r\n\tvec3 position;\r\n\tvec3 normal;\r\n\tvec3 viewDir;\r\n};\r\n\r\nvec3 transformDirection( in vec3 dir, in mat4 matrix ) {\r\n\r\n\treturn normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );\r\n\r\n}\r\n\r\n// http://en.wikibooks.org/wiki/GLSL_Programming/Applying_Matrix_Transformations\r\nvec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {\r\n\r\n\treturn normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );\r\n\r\n}\r\n\r\nvec3 projectOnPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {\r\n\r\n\tfloat distance = dot( planeNormal, point - pointOnPlane );\r\n\r\n\treturn - distance * planeNormal + point;\r\n\r\n}\r\n\r\nfloat sideOfPlane( in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {\r\n\r\n\treturn sign( dot( point - pointOnPlane, planeNormal ) );\r\n\r\n}\r\n\r\nvec3 linePlaneIntersect( in vec3 pointOnLine, in vec3 lineDirection, in vec3 pointOnPlane, in vec3 planeNormal ) {\r\n\r\n\treturn lineDirection * ( dot( planeNormal, pointOnPlane - pointOnLine ) / dot( planeNormal, lineDirection ) ) + pointOnLine;\r\n\r\n}\r\n\r\nmat3 transpose( const in mat3 v ) {\r\n\r\n\tmat3 tmp;\r\n\ttmp[0] = vec3(v[0].x, v[1].x, v[2].x);\r\n\ttmp[1] = vec3(v[0].y, v[1].y, v[2].y);\r\n\ttmp[2] = vec3(v[0].z, v[1].z, v[2].z);\r\n\r\n\treturn tmp;\r\n\r\n}\r\n";

var cube_uv_reflection_fragment = "#ifdef ENVMAP_TYPE_CUBE_UV\r\n\r\n#define cubeUV_textureSize (1024.0)\r\n\r\nint getFaceFromDirection(vec3 direction) {\r\n\tvec3 absDirection = abs(direction);\r\n\tint face = -1;\r\n\tif( absDirection.x > absDirection.z ) {\r\n\t\tif(absDirection.x > absDirection.y )\r\n\t\t\tface = direction.x > 0.0 ? 0 : 3;\r\n\t\telse\r\n\t\t\tface = direction.y > 0.0 ? 1 : 4;\r\n\t}\r\n\telse {\r\n\t\tif(absDirection.z > absDirection.y )\r\n\t\t\tface = direction.z > 0.0 ? 2 : 5;\r\n\t\telse\r\n\t\t\tface = direction.y > 0.0 ? 1 : 4;\r\n\t}\r\n\treturn face;\r\n}\r\n#define cubeUV_maxLods1  (log2(cubeUV_textureSize*0.25) - 1.0)\r\n#define cubeUV_rangeClamp (exp2((6.0 - 1.0) * 2.0))\r\n\r\nvec2 MipLevelInfo( vec3 vec, float roughnessLevel, float roughness ) {\r\n\tfloat scale = exp2(cubeUV_maxLods1 - roughnessLevel);\r\n\tfloat dxRoughness = dFdx(roughness);\r\n\tfloat dyRoughness = dFdy(roughness);\r\n\tvec3 dx = dFdx( vec * scale * dxRoughness );\r\n\tvec3 dy = dFdy( vec * scale * dyRoughness );\r\n\tfloat d = max( dot( dx, dx ), dot( dy, dy ) );\r\n\t// Clamp the value to the max mip level counts. hard coded to 6 mips\r\n\td = clamp(d, 1.0, cubeUV_rangeClamp);\r\n\tfloat mipLevel = 0.5 * log2(d);\r\n\treturn vec2(floor(mipLevel), fract(mipLevel));\r\n}\r\n\r\n#define cubeUV_maxLods2 (log2(cubeUV_textureSize*0.25) - 2.0)\r\n#define cubeUV_rcpTextureSize (1.0 / cubeUV_textureSize)\r\n\r\nvec2 getCubeUV(vec3 direction, float roughnessLevel, float mipLevel) {\r\n\tmipLevel = roughnessLevel > cubeUV_maxLods2 - 3.0 ? 0.0 : mipLevel;\r\n\tfloat a = 16.0 * cubeUV_rcpTextureSize;\r\n\r\n\tvec2 exp2_packed = exp2( vec2( roughnessLevel, mipLevel ) );\r\n\tvec2 rcp_exp2_packed = vec2( 1.0 ) / exp2_packed;\r\n\t// float powScale = exp2(roughnessLevel + mipLevel);\r\n\tfloat powScale = exp2_packed.x * exp2_packed.y;\r\n\t// float scale =  1.0 / exp2(roughnessLevel + 2.0 + mipLevel);\r\n\tfloat scale = rcp_exp2_packed.x * rcp_exp2_packed.y * 0.25;\r\n\t// float mipOffset = 0.75*(1.0 - 1.0/exp2(mipLevel))/exp2(roughnessLevel);\r\n\tfloat mipOffset = 0.75*(1.0 - rcp_exp2_packed.y) * rcp_exp2_packed.x;\r\n\r\n\tbool bRes = mipLevel == 0.0;\r\n\tscale =  bRes && (scale < a) ? a : scale;\r\n\r\n\tvec3 r;\r\n\tvec2 offset;\r\n\tint face = getFaceFromDirection(direction);\r\n\r\n\tfloat rcpPowScale = 1.0 / powScale;\r\n\r\n\tif( face == 0) {\r\n\t\tr = vec3(direction.x, -direction.z, direction.y);\r\n\t\toffset = vec2(0.0+mipOffset,0.75 * rcpPowScale);\r\n\t\toffset.y = bRes && (offset.y < 2.0*a) ? a : offset.y;\r\n\t}\r\n\telse if( face == 1) {\r\n\t\tr = vec3(direction.y, direction.x, direction.z);\r\n\t\toffset = vec2(scale+mipOffset, 0.75 * rcpPowScale);\r\n\t\toffset.y = bRes && (offset.y < 2.0*a) ? a : offset.y;\r\n\t}\r\n\telse if( face == 2) {\r\n\t\tr = vec3(direction.z, direction.x, direction.y);\r\n\t\toffset = vec2(2.0*scale+mipOffset, 0.75 * rcpPowScale);\r\n\t\toffset.y = bRes && (offset.y < 2.0*a) ? a : offset.y;\r\n\t}\r\n\telse if( face == 3) {\r\n\t\tr = vec3(direction.x, direction.z, direction.y);\r\n\t\toffset = vec2(0.0+mipOffset,0.5 * rcpPowScale);\r\n\t\toffset.y = bRes && (offset.y < 2.0*a) ? 0.0 : offset.y;\r\n\t}\r\n\telse if( face == 4) {\r\n\t\tr = vec3(direction.y, direction.x, -direction.z);\r\n\t\toffset = vec2(scale+mipOffset, 0.5 * rcpPowScale);\r\n\t\toffset.y = bRes && (offset.y < 2.0*a) ? 0.0 : offset.y;\r\n\t}\r\n\telse {\r\n\t\tr = vec3(direction.z, -direction.x, direction.y);\r\n\t\toffset = vec2(2.0*scale+mipOffset, 0.5 * rcpPowScale);\r\n\t\toffset.y = bRes && (offset.y < 2.0*a) ? 0.0 : offset.y;\r\n\t}\r\n\tr = normalize(r);\r\n\tfloat texelOffset = 0.5 * cubeUV_rcpTextureSize;\r\n\tvec2 s = ( r.yz / abs( r.x ) + vec2( 1.0 ) ) * 0.5;\r\n\tvec2 base = offset + vec2( texelOffset );\r\n\treturn base + s * ( scale - 2.0 * texelOffset );\r\n}\r\n\r\n#define cubeUV_maxLods3 (log2(cubeUV_textureSize*0.25) - 3.0)\r\n\r\nvec4 textureCubeUV(vec3 reflectedDirection, float roughness ) {\r\n\tfloat roughnessVal = roughness* cubeUV_maxLods3;\r\n\tfloat r1 = floor(roughnessVal);\r\n\tfloat r2 = r1 + 1.0;\r\n\tfloat t = fract(roughnessVal);\r\n\tvec2 mipInfo = MipLevelInfo(reflectedDirection, r1, roughness);\r\n\tfloat s = mipInfo.y;\r\n\tfloat level0 = mipInfo.x;\r\n\tfloat level1 = level0 + 1.0;\r\n\tlevel1 = level1 > 5.0 ? 5.0 : level1;\r\n\r\n\t// round to nearest mipmap if we are not interpolating.\r\n\tlevel0 += min( floor( s + 0.5 ), 5.0 );\r\n\r\n\t// Tri linear interpolation.\r\n\tvec2 uv_10 = getCubeUV(reflectedDirection, r1, level0);\r\n\tvec4 color10 = envMapTexelToLinear(texture2D(envMap, uv_10));\r\n\r\n\tvec2 uv_20 = getCubeUV(reflectedDirection, r2, level0);\r\n\tvec4 color20 = envMapTexelToLinear(texture2D(envMap, uv_20));\r\n\r\n\tvec4 result = mix(color10, color20, t);\r\n\r\n\treturn vec4(result.rgb, 1.0);\r\n}\r\n\r\n#endif\r\n";

var defaultnormal_vertex = "vec3 transformedNormal = normalMatrix * objectNormal;\r\n\r\n#ifdef FLIP_SIDED\r\n\r\n\ttransformedNormal = - transformedNormal;\r\n\r\n#endif\r\n";

var displacementmap_pars_vertex = "#ifdef USE_DISPLACEMENTMAP\r\n\r\n\tuniform sampler2D displacementMap;\r\n\tuniform float displacementScale;\r\n\tuniform float displacementBias;\r\n\r\n#endif\r\n";

var displacementmap_vertex = "#ifdef USE_DISPLACEMENTMAP\r\n\r\n\ttransformed += normalize( objectNormal ) * ( texture2D( displacementMap, uv ).x * displacementScale + displacementBias );\r\n\r\n#endif\r\n";

var emissivemap_fragment = "#ifdef USE_EMISSIVEMAP\r\n\r\n\tvec4 emissiveColor = texture2D( emissiveMap, vUv );\r\n\r\n\temissiveColor.rgb = emissiveMapTexelToLinear( emissiveColor ).rgb;\r\n\r\n\ttotalEmissiveRadiance *= emissiveColor.rgb;\r\n\r\n#endif\r\n";

var emissivemap_pars_fragment = "#ifdef USE_EMISSIVEMAP\r\n\r\n\tuniform sampler2D emissiveMap;\r\n\r\n#endif\r\n";

var encodings_fragment = "  gl_FragColor = linearToOutputTexel( gl_FragColor );\r\n";

var encodings_pars_fragment = "// For a discussion of what this is, please read this: http://lousodrome.net/blog/light/2013/05/26/gamma-correct-and-hdr-rendering-in-a-32-bits-buffer/\r\n\r\nvec4 LinearToLinear( in vec4 value ) {\r\n\treturn value;\r\n}\r\n\r\nvec4 GammaToLinear( in vec4 value, in float gammaFactor ) {\r\n\treturn vec4( pow( value.xyz, vec3( gammaFactor ) ), value.w );\r\n}\r\nvec4 LinearToGamma( in vec4 value, in float gammaFactor ) {\r\n\treturn vec4( pow( value.xyz, vec3( 1.0 / gammaFactor ) ), value.w );\r\n}\r\n\r\nvec4 sRGBToLinear( in vec4 value ) {\r\n\treturn vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.w );\r\n}\r\nvec4 LinearTosRGB( in vec4 value ) {\r\n\treturn vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.w );\r\n}\r\n\r\nvec4 RGBEToLinear( in vec4 value ) {\r\n\treturn vec4( value.rgb * exp2( value.a * 255.0 - 128.0 ), 1.0 );\r\n}\r\nvec4 LinearToRGBE( in vec4 value ) {\r\n\tfloat maxComponent = max( max( value.r, value.g ), value.b );\r\n\tfloat fExp = clamp( ceil( log2( maxComponent ) ), -128.0, 127.0 );\r\n\treturn vec4( value.rgb / exp2( fExp ), ( fExp + 128.0 ) / 255.0 );\r\n//  return vec4( value.brg, ( 3.0 + 128.0 ) / 256.0 );\r\n}\r\n\r\n// reference: http://iwasbeingirony.blogspot.ca/2010/06/difference-between-rgbm-and-rgbd.html\r\nvec4 RGBMToLinear( in vec4 value, in float maxRange ) {\r\n\treturn vec4( value.xyz * value.w * maxRange, 1.0 );\r\n}\r\nvec4 LinearToRGBM( in vec4 value, in float maxRange ) {\r\n\tfloat maxRGB = max( value.x, max( value.g, value.b ) );\r\n\tfloat M      = clamp( maxRGB / maxRange, 0.0, 1.0 );\r\n\tM            = ceil( M * 255.0 ) / 255.0;\r\n\treturn vec4( value.rgb / ( M * maxRange ), M );\r\n}\r\n\r\n// reference: http://iwasbeingirony.blogspot.ca/2010/06/difference-between-rgbm-and-rgbd.html\r\nvec4 RGBDToLinear( in vec4 value, in float maxRange ) {\r\n\treturn vec4( value.rgb * ( ( maxRange / 255.0 ) / value.a ), 1.0 );\r\n}\r\nvec4 LinearToRGBD( in vec4 value, in float maxRange ) {\r\n\tfloat maxRGB = max( value.x, max( value.g, value.b ) );\r\n\tfloat D      = max( maxRange / maxRGB, 1.0 );\r\n\tD            = min( floor( D ) / 255.0, 1.0 );\r\n\treturn vec4( value.rgb * ( D * ( 255.0 / maxRange ) ), D );\r\n}\r\n\r\n// LogLuv reference: http://graphicrants.blogspot.ca/2009/04/rgbm-color-encoding.html\r\n\r\n// M matrix, for encoding\r\nconst mat3 cLogLuvM = mat3( 0.2209, 0.3390, 0.4184, 0.1138, 0.6780, 0.7319, 0.0102, 0.1130, 0.2969 );\r\nvec4 LinearToLogLuv( in vec4 value )  {\r\n\tvec3 Xp_Y_XYZp = value.rgb * cLogLuvM;\r\n\tXp_Y_XYZp = max(Xp_Y_XYZp, vec3(1e-6, 1e-6, 1e-6));\r\n\tvec4 vResult;\r\n\tvResult.xy = Xp_Y_XYZp.xy / Xp_Y_XYZp.z;\r\n\tfloat Le = 2.0 * log2(Xp_Y_XYZp.y) + 127.0;\r\n\tvResult.w = fract(Le);\r\n\tvResult.z = (Le - (floor(vResult.w*255.0))/255.0)/255.0;\r\n\treturn vResult;\r\n}\r\n\r\n// Inverse M matrix, for decoding\r\nconst mat3 cLogLuvInverseM = mat3( 6.0014, -2.7008, -1.7996, -1.3320, 3.1029, -5.7721, 0.3008, -1.0882, 5.6268 );\r\nvec4 LogLuvToLinear( in vec4 value ) {\r\n\tfloat Le = value.z * 255.0 + value.w;\r\n\tvec3 Xp_Y_XYZp;\r\n\tXp_Y_XYZp.y = exp2((Le - 127.0) / 2.0);\r\n\tXp_Y_XYZp.z = Xp_Y_XYZp.y / value.y;\r\n\tXp_Y_XYZp.x = value.x * Xp_Y_XYZp.z;\r\n\tvec3 vRGB = Xp_Y_XYZp.rgb * cLogLuvInverseM;\r\n\treturn vec4( max(vRGB, 0.0), 1.0 );\r\n}\r\n";

var envmap_fragment = "#ifdef USE_ENVMAP\r\n\r\n\t#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )\r\n\r\n\t\tvec3 cameraToVertex = normalize( vWorldPosition - cameraPosition );\r\n\r\n\t\t// Transforming Normal Vectors with the Inverse Transformation\r\n\t\tvec3 worldNormal = inverseTransformDirection( normal, viewMatrix );\r\n\r\n\t\t#ifdef ENVMAP_MODE_REFLECTION\r\n\r\n\t\t\tvec3 reflectVec = reflect( cameraToVertex, worldNormal );\r\n\r\n\t\t#else\r\n\r\n\t\t\tvec3 reflectVec = refract( cameraToVertex, worldNormal, refractionRatio );\r\n\r\n\t\t#endif\r\n\r\n\t#else\r\n\r\n\t\tvec3 reflectVec = vReflect;\r\n\r\n\t#endif\r\n\r\n\t#ifdef ENVMAP_TYPE_CUBE\r\n\r\n\t\tvec4 envColor = textureCube( envMap, flipNormal * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );\r\n\r\n\t#elif defined( ENVMAP_TYPE_EQUIREC )\r\n\r\n\t\tvec2 sampleUV;\r\n\t\tsampleUV.y = asin( flipNormal * reflectVec.y ) * RECIPROCAL_PI + 0.5;\r\n\t\tsampleUV.x = atan( flipNormal * reflectVec.z, flipNormal * reflectVec.x ) * RECIPROCAL_PI2 + 0.5;\r\n\t\tvec4 envColor = texture2D( envMap, sampleUV );\r\n\r\n\t#elif defined( ENVMAP_TYPE_SPHERE )\r\n\r\n\t\tvec3 reflectView = flipNormal * normalize( ( viewMatrix * vec4( reflectVec, 0.0 ) ).xyz + vec3( 0.0, 0.0, 1.0 ) );\r\n\t\tvec4 envColor = texture2D( envMap, reflectView.xy * 0.5 + 0.5 );\r\n\r\n\t#else\r\n\r\n\t\tvec4 envColor = vec4( 0.0 );\r\n\r\n\t#endif\r\n\r\n\tenvColor = envMapTexelToLinear( envColor );\r\n\r\n\t#ifdef ENVMAP_BLENDING_MULTIPLY\r\n\r\n\t\toutgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );\r\n\r\n\t#elif defined( ENVMAP_BLENDING_MIX )\r\n\r\n\t\toutgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );\r\n\r\n\t#elif defined( ENVMAP_BLENDING_ADD )\r\n\r\n\t\toutgoingLight += envColor.xyz * specularStrength * reflectivity;\r\n\r\n\t#endif\r\n\r\n#endif\r\n";

var envmap_pars_fragment = "#if defined( USE_ENVMAP ) || defined( PHYSICAL )\r\n\tuniform float reflectivity;\r\n\tuniform float envMapIntensity;\r\n#endif\r\n\r\n#ifdef USE_ENVMAP\r\n\r\n\t#if ! defined( PHYSICAL ) && ( defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) )\r\n\t\tvarying vec3 vWorldPosition;\r\n\t#endif\r\n\r\n\t#ifdef ENVMAP_TYPE_CUBE\r\n\t\tuniform samplerCube envMap;\r\n\t#else\r\n\t\tuniform sampler2D envMap;\r\n\t#endif\r\n\tuniform float flipEnvMap;\r\n\r\n\t#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( PHYSICAL )\r\n\t\tuniform float refractionRatio;\r\n\t#else\r\n\t\tvarying vec3 vReflect;\r\n\t#endif\r\n\r\n#endif\r\n";

var envmap_pars_vertex = "#ifdef USE_ENVMAP\r\n\r\n\t#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )\r\n\t\tvarying vec3 vWorldPosition;\r\n\r\n\t#else\r\n\r\n\t\tvarying vec3 vReflect;\r\n\t\tuniform float refractionRatio;\r\n\r\n\t#endif\r\n\r\n#endif\r\n";

var envmap_vertex = "#ifdef USE_ENVMAP\r\n\r\n\t#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )\r\n\r\n\t\tvWorldPosition = worldPosition.xyz;\r\n\r\n\t#else\r\n\r\n\t\tvec3 cameraToVertex = normalize( worldPosition.xyz - cameraPosition );\r\n\r\n\t\tvec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );\r\n\r\n\t\t#ifdef ENVMAP_MODE_REFLECTION\r\n\r\n\t\t\tvReflect = reflect( cameraToVertex, worldNormal );\r\n\r\n\t\t#else\r\n\r\n\t\t\tvReflect = refract( cameraToVertex, worldNormal, refractionRatio );\r\n\r\n\t\t#endif\r\n\r\n\t#endif\r\n\r\n#endif\r\n";

var fog_vertex = "\r\n#ifdef USE_FOG\r\nfogDepth = -mvPosition.z;\r\n#endif";

var fog_pars_vertex = "#ifdef USE_FOG\r\n\r\n  varying float fogDepth;\r\n\r\n#endif\r\n";

var fog_fragment = "#ifdef USE_FOG\r\n\r\n\t#ifdef FOG_EXP2\r\n\r\n\t\tfloat fogFactor = whiteCompliment( exp2( - fogDensity * fogDensity * fogDepth * fogDepth * LOG2 ) );\r\n\r\n\t#else\r\n\r\n\t\tfloat fogFactor = smoothstep( fogNear, fogFar, fogDepth );\r\n\r\n\t#endif\r\n\r\n\tgl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );\r\n\r\n#endif\r\n";

var fog_pars_fragment = "#ifdef USE_FOG\r\n\r\n\tuniform vec3 fogColor;\r\n\tvarying float fogDepth;\r\n\r\n\t#ifdef FOG_EXP2\r\n\r\n\t\tuniform float fogDensity;\r\n\r\n\t#else\r\n\r\n\t\tuniform float fogNear;\r\n\t\tuniform float fogFar;\r\n\r\n\t#endif\r\n\r\n#endif\r\n";

var gradientmap_pars_fragment = "#ifdef TOON\r\n\r\n\tuniform sampler2D gradientMap;\r\n\r\n\tvec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {\r\n\r\n\t\t// dotNL will be from -1.0 to 1.0\r\n\t\tfloat dotNL = dot( normal, lightDirection );\r\n\t\tvec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );\r\n\r\n\t\t#ifdef USE_GRADIENTMAP\r\n\r\n\t\t\treturn texture2D( gradientMap, coord ).rgb;\r\n\r\n\t\t#else\r\n\r\n\t\t\treturn ( coord.x < 0.7 ) ? vec3( 0.7 ) : vec3( 1.0 );\r\n\r\n\t\t#endif\r\n\r\n\r\n\t}\r\n\r\n#endif\r\n";

var lightmap_fragment = "#ifdef USE_LIGHTMAP\r\n\r\n\treflectedLight.indirectDiffuse += PI * texture2D( lightMap, vUv2 ).xyz * lightMapIntensity; // factor of PI should not be present; included here to prevent breakage\r\n\r\n#endif\r\n";

var lightmap_pars_fragment = "#ifdef USE_LIGHTMAP\r\n\r\n\tuniform sampler2D lightMap;\r\n\tuniform float lightMapIntensity;\r\n\r\n#endif";

var lights_lambert_vertex = "vec3 diffuse = vec3( 1.0 );\r\n\r\nGeometricContext geometry;\r\ngeometry.position = mvPosition.xyz;\r\ngeometry.normal = normalize( transformedNormal );\r\ngeometry.viewDir = normalize( -mvPosition.xyz );\r\n\r\nGeometricContext backGeometry;\r\nbackGeometry.position = geometry.position;\r\nbackGeometry.normal = -geometry.normal;\r\nbackGeometry.viewDir = geometry.viewDir;\r\n\r\nvLightFront = vec3( 0.0 );\r\n\r\n#ifdef DOUBLE_SIDED\r\n\tvLightBack = vec3( 0.0 );\r\n#endif\r\n\r\nIncidentLight directLight;\r\nfloat dotNL;\r\nvec3 directLightColor_Diffuse;\r\n\r\n#if NUM_POINT_LIGHTS > 0\r\n\r\n\tfor ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\r\n\r\n\t\tgetPointDirectLightIrradiance( pointLights[ i ], geometry, directLight );\r\n\r\n\t\tdotNL = dot( geometry.normal, directLight.direction );\r\n\t\tdirectLightColor_Diffuse = PI * directLight.color;\r\n\r\n\t\tvLightFront += saturate( dotNL ) * directLightColor_Diffuse;\r\n\r\n\t\t#ifdef DOUBLE_SIDED\r\n\r\n\t\t\tvLightBack += saturate( -dotNL ) * directLightColor_Diffuse;\r\n\r\n\t\t#endif\r\n\r\n\t}\r\n\r\n#endif\r\n\r\n#if NUM_SPOT_LIGHTS > 0\r\n\r\n\tfor ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\r\n\r\n\t\tgetSpotDirectLightIrradiance( spotLights[ i ], geometry, directLight );\r\n\r\n\t\tdotNL = dot( geometry.normal, directLight.direction );\r\n\t\tdirectLightColor_Diffuse = PI * directLight.color;\r\n\r\n\t\tvLightFront += saturate( dotNL ) * directLightColor_Diffuse;\r\n\r\n\t\t#ifdef DOUBLE_SIDED\r\n\r\n\t\t\tvLightBack += saturate( -dotNL ) * directLightColor_Diffuse;\r\n\r\n\t\t#endif\r\n\t}\r\n\r\n#endif\r\n\r\n\r\n\r\n#if NUM_DIR_LIGHTS > 0\r\n\r\n\tfor ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\r\n\r\n\t\tgetDirectionalDirectLightIrradiance( directionalLights[ i ], geometry, directLight );\r\n\r\n\t\tdotNL = dot( geometry.normal, directLight.direction );\r\n\t\tdirectLightColor_Diffuse = PI * directLight.color;\r\n\r\n\t\tvLightFront += saturate( dotNL ) * directLightColor_Diffuse;\r\n\r\n\t\t#ifdef DOUBLE_SIDED\r\n\r\n\t\t\tvLightBack += saturate( -dotNL ) * directLightColor_Diffuse;\r\n\r\n\t\t#endif\r\n\r\n\t}\r\n\r\n#endif\r\n\r\n#if NUM_HEMI_LIGHTS > 0\r\n\r\n\tfor ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {\r\n\r\n\t\tvLightFront += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );\r\n\r\n\t\t#ifdef DOUBLE_SIDED\r\n\r\n\t\t\tvLightBack += getHemisphereLightIrradiance( hemisphereLights[ i ], backGeometry );\r\n\r\n\t\t#endif\r\n\r\n\t}\r\n\r\n#endif\r\n";

var lights_pars = "uniform vec3 ambientLightColor;\r\n\r\nvec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {\r\n\r\n\tvec3 irradiance = ambientLightColor;\r\n\r\n\t#ifndef PHYSICALLY_CORRECT_LIGHTS\r\n\r\n\t\tirradiance *= PI;\r\n\r\n\t#endif\r\n\r\n\treturn irradiance;\r\n\r\n}\r\n\r\n#if NUM_DIR_LIGHTS > 0\r\n\r\n\tstruct DirectionalLight {\r\n\t\tvec3 direction;\r\n\t\tvec3 color;\r\n\r\n\t\tint shadow;\r\n\t\tfloat shadowBias;\r\n\t\tfloat shadowRadius;\r\n\t\tvec2 shadowMapSize;\r\n\t};\r\n\r\n\tuniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];\r\n\r\n\tvoid getDirectionalDirectLightIrradiance( const in DirectionalLight directionalLight, const in GeometricContext geometry, out IncidentLight directLight ) {\r\n\r\n\t\tdirectLight.color = directionalLight.color;\r\n\t\tdirectLight.direction = directionalLight.direction;\r\n\t\tdirectLight.visible = true;\r\n\r\n\t}\r\n\r\n#endif\r\n\r\n\r\n#if NUM_POINT_LIGHTS > 0\r\n\r\n\tstruct PointLight {\r\n\t\tvec3 position;\r\n\t\tvec3 color;\r\n\t\tfloat distance;\r\n\t\tfloat decay;\r\n\r\n\t\tint shadow;\r\n\t\tfloat shadowBias;\r\n\t\tfloat shadowRadius;\r\n\t\tvec2 shadowMapSize;\r\n\t};\r\n\r\n\tuniform PointLight pointLights[ NUM_POINT_LIGHTS ];\r\n\r\n\t// directLight is an out parameter as having it as a return value caused compiler errors on some devices\r\n\tvoid getPointDirectLightIrradiance( const in PointLight pointLight, const in GeometricContext geometry, out IncidentLight directLight ) {\r\n\r\n\t\tvec3 lVector = pointLight.position - geometry.position;\r\n\t\tdirectLight.direction = normalize( lVector );\r\n\r\n\t\tfloat lightDistance = length( lVector );\r\n\r\n\t\tdirectLight.color = pointLight.color;\r\n\t\tdirectLight.color *= punctualLightIntensityToIrradianceFactor( lightDistance, pointLight.distance, pointLight.decay );\r\n\t\tdirectLight.visible = ( directLight.color != vec3( 0.0 ) );\r\n\r\n\t}\r\n\r\n#endif\r\n\r\n\r\n#if NUM_SPOT_LIGHTS > 0\r\n\r\n\tstruct SpotLight {\r\n\t\tvec3 position;\r\n\t\tvec3 direction;\r\n\t\tvec3 color;\r\n\t\tfloat distance;\r\n\t\tfloat decay;\r\n\t\tfloat coneCos;\r\n\t\tfloat penumbraCos;\r\n\r\n\t\tint shadow;\r\n\t\tfloat shadowBias;\r\n\t\tfloat shadowRadius;\r\n\t\tvec2 shadowMapSize;\r\n\t};\r\n\r\n\tuniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];\r\n\r\n\t// directLight is an out parameter as having it as a return value caused compiler errors on some devices\r\n\tvoid getSpotDirectLightIrradiance( const in SpotLight spotLight, const in GeometricContext geometry, out IncidentLight directLight  ) {\r\n\r\n\t\tvec3 lVector = spotLight.position - geometry.position;\r\n\t\tdirectLight.direction = normalize( lVector );\r\n\r\n\t\tfloat lightDistance = length( lVector );\r\n\t\tfloat angleCos = dot( directLight.direction, spotLight.direction );\r\n\r\n\t\tif ( angleCos > spotLight.coneCos ) {\r\n\r\n\t\t\tfloat spotEffect = smoothstep( spotLight.coneCos, spotLight.penumbraCos, angleCos );\r\n\r\n\t\t\tdirectLight.color = spotLight.color;\r\n\t\t\tdirectLight.color *= spotEffect * punctualLightIntensityToIrradianceFactor( lightDistance, spotLight.distance, spotLight.decay );\r\n\t\t\tdirectLight.visible = true;\r\n\r\n\t\t} else {\r\n\r\n\t\t\tdirectLight.color = vec3( 0.0 );\r\n\t\t\tdirectLight.visible = false;\r\n\r\n\t\t}\r\n\t}\r\n\r\n#endif\r\n\r\n\r\n#if NUM_RECT_AREA_LIGHTS > 0\r\n\r\n\tstruct RectAreaLight {\r\n\t\tvec3 color;\r\n\t\tvec3 position;\r\n\t\tvec3 halfWidth;\r\n\t\tvec3 halfHeight;\r\n\t};\r\n\r\n\t// Pre-computed values of LinearTransformedCosine approximation of BRDF\r\n\t// BRDF approximation Texture is 64x64\r\n\tuniform sampler2D ltcMat; // RGBA Float\r\n\tuniform sampler2D ltcMag; // Alpha Float (only has w component)\r\n\r\n\tuniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];\r\n\r\n#endif\r\n\r\n\r\n#if NUM_HEMI_LIGHTS > 0\r\n\r\n\tstruct HemisphereLight {\r\n\t\tvec3 direction;\r\n\t\tvec3 skyColor;\r\n\t\tvec3 groundColor;\r\n\t};\r\n\r\n\tuniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];\r\n\r\n\tvec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in GeometricContext geometry ) {\r\n\r\n\t\tfloat dotNL = dot( geometry.normal, hemiLight.direction );\r\n\t\tfloat hemiDiffuseWeight = 0.5 * dotNL + 0.5;\r\n\r\n\t\tvec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );\r\n\r\n\t\t#ifndef PHYSICALLY_CORRECT_LIGHTS\r\n\r\n\t\t\tirradiance *= PI;\r\n\r\n\t\t#endif\r\n\r\n\t\treturn irradiance;\r\n\r\n\t}\r\n\r\n#endif\r\n\r\n\r\n#if defined( USE_ENVMAP ) && defined( PHYSICAL )\r\n\r\n\tvec3 getLightProbeIndirectIrradiance( const in GeometricContext geometry, const in int maxMIPLevel ) {\r\n\r\n\t\tvec3 worldNormal = inverseTransformDirection( geometry.normal, viewMatrix );\r\n\r\n\t\t#ifdef ENVMAP_TYPE_CUBE\r\n\r\n\t\t\tvec3 queryVec = vec3( flipEnvMap * worldNormal.x, worldNormal.yz );\r\n\r\n\t\t\t// TODO: replace with properly filtered cubemaps and access the irradiance LOD level, be it the last LOD level\r\n\t\t\t// of a specular cubemap, or just the default level of a specially created irradiance cubemap.\r\n\r\n\t\t\t#ifdef TEXTURE_LOD_EXT\r\n\r\n\t\t\t\tvec4 envMapColor = textureCubeLodEXT( envMap, queryVec, float( maxMIPLevel ) );\r\n\r\n\t\t\t#else\r\n\r\n\t\t\t\t// force the bias high to get the last LOD level as it is the most blurred.\r\n\t\t\t\tvec4 envMapColor = textureCube( envMap, queryVec, float( maxMIPLevel ) );\r\n\r\n\t\t\t#endif\r\n\r\n\t\t\tenvMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;\r\n\r\n\t\t#elif defined( ENVMAP_TYPE_CUBE_UV )\r\n\r\n\t\t\tvec3 queryVec = vec3( flipEnvMap * worldNormal.x, worldNormal.yz );\r\n\t\t\tvec4 envMapColor = textureCubeUV( queryVec, 1.0 );\r\n\r\n\t\t#else\r\n\r\n\t\t\tvec4 envMapColor = vec4( 0.0 );\r\n\r\n\t\t#endif\r\n\r\n\t\treturn PI * envMapColor.rgb * envMapIntensity;\r\n\r\n\t}\r\n\r\n\t// taken from here: http://casual-effects.blogspot.ca/2011/08/plausible-environment-lighting-in-two.html\r\n\tfloat getSpecularMIPLevel( const in float blinnShininessExponent, const in int maxMIPLevel ) {\r\n\r\n\t\t//float envMapWidth = pow( 2.0, maxMIPLevelScalar );\r\n\t\t//float desiredMIPLevel = log2( envMapWidth * sqrt( 3.0 ) ) - 0.5 * log2( pow2( blinnShininessExponent ) + 1.0 );\r\n\r\n\t\tfloat maxMIPLevelScalar = float( maxMIPLevel );\r\n\t\tfloat desiredMIPLevel = maxMIPLevelScalar - 0.79248 - 0.5 * log2( pow2( blinnShininessExponent ) + 1.0 );\r\n\r\n\t\t// clamp to allowable LOD ranges.\r\n\t\treturn clamp( desiredMIPLevel, 0.0, maxMIPLevelScalar );\r\n\r\n\t}\r\n\r\n\tvec3 getLightProbeIndirectRadiance( const in GeometricContext geometry, const in float blinnShininessExponent, const in int maxMIPLevel ) {\r\n\r\n\t\t#ifdef ENVMAP_MODE_REFLECTION\r\n\r\n\t\t\tvec3 reflectVec = reflect( -geometry.viewDir, geometry.normal );\r\n\r\n\t\t#else\r\n\r\n\t\t\tvec3 reflectVec = refract( -geometry.viewDir, geometry.normal, refractionRatio );\r\n\r\n\t\t#endif\r\n\r\n\t\treflectVec = inverseTransformDirection( reflectVec, viewMatrix );\r\n\r\n\t\tfloat specularMIPLevel = getSpecularMIPLevel( blinnShininessExponent, maxMIPLevel );\r\n\r\n\t\t#ifdef ENVMAP_TYPE_CUBE\r\n\r\n\t\t\tvec3 queryReflectVec = vec3( flipEnvMap * reflectVec.x, reflectVec.yz );\r\n\r\n\t\t\t#ifdef TEXTURE_LOD_EXT\r\n\r\n\t\t\t\tvec4 envMapColor = textureCubeLodEXT( envMap, queryReflectVec, specularMIPLevel );\r\n\r\n\t\t\t#else\r\n\r\n\t\t\t\tvec4 envMapColor = textureCube( envMap, queryReflectVec, specularMIPLevel );\r\n\r\n\t\t\t#endif\r\n\r\n\t\t\tenvMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;\r\n\r\n\t\t#elif defined( ENVMAP_TYPE_CUBE_UV )\r\n\r\n\t\t\tvec3 queryReflectVec = vec3( flipEnvMap * reflectVec.x, reflectVec.yz );\r\n\t\t\tvec4 envMapColor = textureCubeUV(queryReflectVec, BlinnExponentToGGXRoughness(blinnShininessExponent));\r\n\r\n\t\t#elif defined( ENVMAP_TYPE_EQUIREC )\r\n\r\n\t\t\tvec2 sampleUV;\r\n\t\t\tsampleUV.y = saturate( reflectVec.y * 0.5 + 0.5 );\r\n\t\t\tsampleUV.x = atan( reflectVec.z, reflectVec.x ) * RECIPROCAL_PI2 + 0.5;\r\n\r\n\t\t\t#ifdef TEXTURE_LOD_EXT\r\n\r\n\t\t\t\tvec4 envMapColor = texture2DLodEXT( envMap, sampleUV, specularMIPLevel );\r\n\r\n\t\t\t#else\r\n\r\n\t\t\t\tvec4 envMapColor = texture2D( envMap, sampleUV, specularMIPLevel );\r\n\r\n\t\t\t#endif\r\n\r\n\t\t\tenvMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;\r\n\r\n\t\t#elif defined( ENVMAP_TYPE_SPHERE )\r\n\r\n\t\t\tvec3 reflectView = normalize( ( viewMatrix * vec4( reflectVec, 0.0 ) ).xyz + vec3( 0.0,0.0,1.0 ) );\r\n\r\n\t\t\t#ifdef TEXTURE_LOD_EXT\r\n\r\n\t\t\t\tvec4 envMapColor = texture2DLodEXT( envMap, reflectView.xy * 0.5 + 0.5, specularMIPLevel );\r\n\r\n\t\t\t#else\r\n\r\n\t\t\t\tvec4 envMapColor = texture2D( envMap, reflectView.xy * 0.5 + 0.5, specularMIPLevel );\r\n\r\n\t\t\t#endif\r\n\r\n\t\t\tenvMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;\r\n\r\n\t\t#endif\r\n\r\n\t\treturn envMapColor.rgb * envMapIntensity;\r\n\r\n\t}\r\n\r\n#endif\r\n";

var lights_phong_fragment = "BlinnPhongMaterial material;\r\nmaterial.diffuseColor = diffuseColor.rgb;\r\nmaterial.specularColor = specular;\r\nmaterial.specularShininess = shininess;\r\nmaterial.specularStrength = specularStrength;\r\n";

var lights_phong_pars_fragment = "varying vec3 vViewPosition;\r\n\r\n#ifndef FLAT_SHADED\r\n\r\n\tvarying vec3 vNormal;\r\n\r\n#endif\r\n\r\n\r\nstruct BlinnPhongMaterial {\r\n\r\n\tvec3\tdiffuseColor;\r\n\tvec3\tspecularColor;\r\n\tfloat\tspecularShininess;\r\n\tfloat\tspecularStrength;\r\n\r\n};\r\n\r\nvoid RE_Direct_BlinnPhong( const in IncidentLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {\r\n\r\n\t#ifdef TOON\r\n\r\n\t\tvec3 irradiance = getGradientIrradiance( geometry.normal, directLight.direction ) * directLight.color;\r\n\r\n\t#else\r\n\r\n\t\tfloat dotNL = saturate( dot( geometry.normal, directLight.direction ) );\r\n\t\tvec3 irradiance = dotNL * directLight.color;\r\n\r\n\t#endif\r\n\r\n\t#ifndef PHYSICALLY_CORRECT_LIGHTS\r\n\r\n\t\tirradiance *= PI; // punctual light\r\n\r\n\t#endif\r\n\r\n\treflectedLight.directDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );\r\n\r\n\treflectedLight.directSpecular += irradiance * BRDF_Specular_BlinnPhong( directLight, geometry, material.specularColor, material.specularShininess ) * material.specularStrength;\r\n\r\n}\r\n\r\nvoid RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {\r\n\r\n\treflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );\r\n\r\n}\r\n\r\n#define RE_Direct\t\t\t\tRE_Direct_BlinnPhong\r\n#define RE_IndirectDiffuse\t\tRE_IndirectDiffuse_BlinnPhong\r\n\r\n#define Material_LightProbeLOD( material )\t(0)\r\n";

var lights_physical_fragment = "PhysicalMaterial material;\r\nmaterial.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );\r\nmaterial.specularRoughness = clamp( roughnessFactor, 0.04, 1.0 );\r\n#ifdef STANDARD\r\n\tmaterial.specularColor = mix( vec3( DEFAULT_SPECULAR_COEFFICIENT ), diffuseColor.rgb, metalnessFactor );\r\n#else\r\n\tmaterial.specularColor = mix( vec3( MAXIMUM_SPECULAR_COEFFICIENT * pow2( reflectivity ) ), diffuseColor.rgb, metalnessFactor );\r\n\tmaterial.clearCoat = saturate( clearCoat ); // Burley clearcoat model\r\n\tmaterial.clearCoatRoughness = clamp( clearCoatRoughness, 0.04, 1.0 );\r\n#endif\r\n";

var lights_physical_pars_fragment = "struct PhysicalMaterial {\r\n\r\n\tvec3\tdiffuseColor;\r\n\tfloat\tspecularRoughness;\r\n\tvec3\tspecularColor;\r\n\r\n\t#ifndef STANDARD\r\n\t\tfloat clearCoat;\r\n\t\tfloat clearCoatRoughness;\r\n\t#endif\r\n\r\n};\r\n\r\n#define MAXIMUM_SPECULAR_COEFFICIENT 0.16\r\n#define DEFAULT_SPECULAR_COEFFICIENT 0.04\r\n\r\n// Clear coat directional hemishperical reflectance (this approximation should be improved)\r\nfloat clearCoatDHRApprox( const in float roughness, const in float dotNL ) {\r\n\r\n\treturn DEFAULT_SPECULAR_COEFFICIENT + ( 1.0 - DEFAULT_SPECULAR_COEFFICIENT ) * ( pow( 1.0 - dotNL, 5.0 ) * pow( 1.0 - roughness, 2.0 ) );\r\n\r\n}\r\n\r\n#if NUM_RECT_AREA_LIGHTS > 0\r\n\r\n\tvoid RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\r\n\r\n\t\tvec3 normal = geometry.normal;\r\n\t\tvec3 viewDir = geometry.viewDir;\r\n\t\tvec3 position = geometry.position;\r\n\t\tvec3 lightPos = rectAreaLight.position;\r\n\t\tvec3 halfWidth = rectAreaLight.halfWidth;\r\n\t\tvec3 halfHeight = rectAreaLight.halfHeight;\r\n\t\tvec3 lightColor = rectAreaLight.color;\r\n\t\tfloat roughness = material.specularRoughness;\r\n\r\n\t\tvec3 rectCoords[ 4 ];\r\n\t\trectCoords[ 0 ] = lightPos - halfWidth - halfHeight; // counterclockwise\r\n\t\trectCoords[ 1 ] = lightPos + halfWidth - halfHeight;\r\n\t\trectCoords[ 2 ] = lightPos + halfWidth + halfHeight;\r\n\t\trectCoords[ 3 ] = lightPos - halfWidth + halfHeight;\r\n\r\n\t\tvec2 uv = LTC_Uv( normal, viewDir, roughness );\r\n\r\n\t\tfloat norm = texture2D( ltcMag, uv ).a;\r\n\r\n\t\tvec4 t = texture2D( ltcMat, uv );\r\n\r\n\t\tmat3 mInv = mat3(\r\n\t\t\tvec3(   1,   0, t.y ),\r\n\t\t\tvec3(   0, t.z,   0 ),\r\n\t\t\tvec3( t.w,   0, t.x )\r\n\t\t);\r\n\r\n\t\treflectedLight.directSpecular += lightColor * material.specularColor * norm * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords ); // no fresnel\r\n\r\n\t\treflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1 ), rectCoords );\r\n\r\n\t}\r\n\r\n#endif\r\n\r\nvoid RE_Direct_Physical( const in IncidentLight directLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\r\n\r\n\tfloat dotNL = saturate( dot( geometry.normal, directLight.direction ) );\r\n\r\n\tvec3 irradiance = dotNL * directLight.color;\r\n\r\n\t#ifndef PHYSICALLY_CORRECT_LIGHTS\r\n\r\n\t\tirradiance *= PI; // punctual light\r\n\r\n\t#endif\r\n\r\n\t#ifndef STANDARD\r\n\t\tfloat clearCoatDHR = material.clearCoat * clearCoatDHRApprox( material.clearCoatRoughness, dotNL );\r\n\t#else\r\n\t\tfloat clearCoatDHR = 0.0;\r\n\t#endif\r\n\r\n\treflectedLight.directSpecular += ( 1.0 - clearCoatDHR ) * irradiance * BRDF_Specular_GGX( directLight, geometry, material.specularColor, material.specularRoughness );\r\n\r\n\treflectedLight.directDiffuse += ( 1.0 - clearCoatDHR ) * irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );\r\n\r\n\t#ifndef STANDARD\r\n\r\n\t\treflectedLight.directSpecular += irradiance * material.clearCoat * BRDF_Specular_GGX( directLight, geometry, vec3( DEFAULT_SPECULAR_COEFFICIENT ), material.clearCoatRoughness );\r\n\r\n\t#endif\r\n\r\n}\r\n\r\nvoid RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\r\n\r\n\treflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );\r\n\r\n}\r\n\r\nvoid RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 clearCoatRadiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\r\n\r\n\t#ifndef STANDARD\r\n\t\tfloat dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );\r\n\t\tfloat dotNL = dotNV;\r\n\t\tfloat clearCoatDHR = material.clearCoat * clearCoatDHRApprox( material.clearCoatRoughness, dotNL );\r\n\t#else\r\n\t\tfloat clearCoatDHR = 0.0;\r\n\t#endif\r\n\r\n\treflectedLight.indirectSpecular += ( 1.0 - clearCoatDHR ) * radiance * BRDF_Specular_GGX_Environment( geometry, material.specularColor, material.specularRoughness );\r\n\r\n\t#ifndef STANDARD\r\n\r\n\t\treflectedLight.indirectSpecular += clearCoatRadiance * material.clearCoat * BRDF_Specular_GGX_Environment( geometry, vec3( DEFAULT_SPECULAR_COEFFICIENT ), material.clearCoatRoughness );\r\n\r\n\t#endif\r\n\r\n}\r\n\r\n#define RE_Direct\t\t\t\tRE_Direct_Physical\r\n#define RE_Direct_RectArea\t\tRE_Direct_RectArea_Physical\r\n#define RE_IndirectDiffuse\t\tRE_IndirectDiffuse_Physical\r\n#define RE_IndirectSpecular\t\tRE_IndirectSpecular_Physical\r\n\r\n#define Material_BlinnShininessExponent( material )   GGXRoughnessToBlinnExponent( material.specularRoughness )\r\n#define Material_ClearCoat_BlinnShininessExponent( material )   GGXRoughnessToBlinnExponent( material.clearCoatRoughness )\r\n\r\n// ref: http://www.frostbite.com/wp-content/uploads/2014/11/course_notes_moving_frostbite_to_pbr_v2.pdf\r\nfloat computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {\r\n\r\n\treturn saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );\r\n\r\n}\r\n";

var lights_template = "\r\n\r\nGeometricContext geometry;\r\n\r\ngeometry.position = - vViewPosition;\r\ngeometry.normal = normal;\r\ngeometry.viewDir = normalize( vViewPosition );\r\n\r\nIncidentLight directLight;\r\n\r\n#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )\r\n\r\n\tPointLight pointLight;\r\n\r\n\tfor ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\r\n\r\n\t\tpointLight = pointLights[ i ];\r\n\r\n\t\tgetPointDirectLightIrradiance( pointLight, geometry, directLight );\r\n\r\n\t\t#ifdef USE_SHADOWMAP\r\n\t\tdirectLight.color *= all( bvec2( pointLight.shadow, directLight.visible ) ) ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ] ) : 1.0;\r\n\t\t#endif\r\n\r\n\t\tRE_Direct( directLight, geometry, material, reflectedLight );\r\n\r\n\t}\r\n\r\n#endif\r\n\r\n#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )\r\n\r\n\tSpotLight spotLight;\r\n\r\n\tfor ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\r\n\r\n\t\tspotLight = spotLights[ i ];\r\n\r\n\t\tgetSpotDirectLightIrradiance( spotLight, geometry, directLight );\r\n\r\n\t\t#ifdef USE_SHADOWMAP\r\n\t\tdirectLight.color *= all( bvec2( spotLight.shadow, directLight.visible ) ) ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;\r\n\t\t#endif\r\n\r\n\t\tRE_Direct( directLight, geometry, material, reflectedLight );\r\n\r\n\t}\r\n\r\n#endif\r\n\r\n#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )\r\n\r\n\tDirectionalLight directionalLight;\r\n\r\n\tfor ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\r\n\r\n\t\tdirectionalLight = directionalLights[ i ];\r\n\r\n\t\tgetDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );\r\n\r\n\t\t#ifdef USE_SHADOWMAP\r\n\t\tdirectLight.color *= all( bvec2( directionalLight.shadow, directLight.visible ) ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\r\n\t\t#endif\r\n\r\n\t\tRE_Direct( directLight, geometry, material, reflectedLight );\r\n\r\n\t}\r\n\r\n#endif\r\n\r\n#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )\r\n\r\n\tRectAreaLight rectAreaLight;\r\n\r\n\tfor ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {\r\n\r\n\t\trectAreaLight = rectAreaLights[ i ];\r\n\t\tRE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );\r\n\r\n\t}\r\n\r\n#endif\r\n\r\n#if defined( RE_IndirectDiffuse )\r\n\r\n\tvec3 irradiance = getAmbientLightIrradiance( ambientLightColor );\r\n\r\n\t#ifdef USE_LIGHTMAP\r\n\r\n\t\tvec3 lightMapIrradiance = texture2D( lightMap, vUv2 ).xyz * lightMapIntensity;\r\n\r\n\t\t#ifndef PHYSICALLY_CORRECT_LIGHTS\r\n\r\n\t\t\tlightMapIrradiance *= PI; // factor of PI should not be present; included here to prevent breakage\r\n\r\n\t\t#endif\r\n\r\n\t\tirradiance += lightMapIrradiance;\r\n\r\n\t#endif\r\n\r\n\t#if ( NUM_HEMI_LIGHTS > 0 )\r\n\r\n\t\tfor ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {\r\n\r\n\t\t\tirradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );\r\n\r\n\t\t}\r\n\r\n\t#endif\r\n\r\n\t#if defined( USE_ENVMAP ) && defined( PHYSICAL ) && defined( ENVMAP_TYPE_CUBE_UV )\r\n\r\n\t\t// TODO, replace 8 with the real maxMIPLevel\r\n\t\tirradiance += getLightProbeIndirectIrradiance( geometry, 8 );\r\n\r\n\t#endif\r\n\r\n\tRE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );\r\n\r\n#endif\r\n\r\n#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )\r\n\r\n\t// TODO, replace 8 with the real maxMIPLevel\r\n\tvec3 radiance = getLightProbeIndirectRadiance( geometry, Material_BlinnShininessExponent( material ), 8 );\r\n\r\n\t#ifndef STANDARD\r\n\t\tvec3 clearCoatRadiance = getLightProbeIndirectRadiance( geometry, Material_ClearCoat_BlinnShininessExponent( material ), 8 );\r\n\t#else\r\n\t\tvec3 clearCoatRadiance = vec3( 0.0 );\r\n\t#endif\r\n\r\n\tRE_IndirectSpecular( radiance, clearCoatRadiance, geometry, material, reflectedLight );\r\n\r\n#endif\r\n";

var logdepthbuf_fragment = "#if defined(USE_LOGDEPTHBUF) && defined(USE_LOGDEPTHBUF_EXT)\r\n\r\n\tgl_FragDepthEXT = log2(vFragDepth) * logDepthBufFC * 0.5;\r\n\r\n#endif";

var logdepthbuf_pars_fragment = "#ifdef USE_LOGDEPTHBUF\r\n\r\n\tuniform float logDepthBufFC;\r\n\r\n\t#ifdef USE_LOGDEPTHBUF_EXT\r\n\r\n\t\tvarying float vFragDepth;\r\n\r\n\t#endif\r\n\r\n#endif\r\n";

var logdepthbuf_pars_vertex = "#ifdef USE_LOGDEPTHBUF\r\n\r\n\t#ifdef USE_LOGDEPTHBUF_EXT\r\n\r\n\t\tvarying float vFragDepth;\r\n\r\n\t#endif\r\n\r\n\tuniform float logDepthBufFC;\r\n\r\n#endif";

var logdepthbuf_vertex = "#ifdef USE_LOGDEPTHBUF\r\n\r\n\tgl_Position.z = log2(max( EPSILON, gl_Position.w + 1.0 )) * logDepthBufFC;\r\n\r\n\t#ifdef USE_LOGDEPTHBUF_EXT\r\n\r\n\t\tvFragDepth = 1.0 + gl_Position.w;\r\n\r\n\t#else\r\n\r\n\t\tgl_Position.z = (gl_Position.z - 1.0) * gl_Position.w;\r\n\r\n\t#endif\r\n\r\n#endif\r\n";

var map_fragment = "#ifdef USE_MAP\r\n\r\n\tvec4 texelColor = texture2D( map, vUv );\r\n\r\n\ttexelColor = mapTexelToLinear( texelColor );\r\n\tdiffuseColor *= texelColor;\r\n\r\n#endif\r\n";

var map_pars_fragment = "#ifdef USE_MAP\r\n\r\n\tuniform sampler2D map;\r\n\r\n#endif\r\n";

var map_particle_fragment = "#ifdef USE_MAP\r\n\r\n\tvec4 mapTexel = texture2D( map, vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y ) * offsetRepeat.zw + offsetRepeat.xy );\r\n\tdiffuseColor *= mapTexelToLinear( mapTexel );\r\n\r\n#endif\r\n";

var map_particle_pars_fragment = "#ifdef USE_MAP\r\n\r\n\tuniform vec4 offsetRepeat;\r\n\tuniform sampler2D map;\r\n\r\n#endif\r\n";

var metalnessmap_fragment = "float metalnessFactor = metalness;\r\n\r\n#ifdef USE_METALNESSMAP\r\n\r\n\tvec4 texelMetalness = texture2D( metalnessMap, vUv );\r\n\r\n\t// reads channel B, compatible with a combined OcclusionRoughnessMetallic (RGB) texture\r\n\tmetalnessFactor *= texelMetalness.b;\r\n\r\n#endif\r\n";

var metalnessmap_pars_fragment = "#ifdef USE_METALNESSMAP\r\n\r\n\tuniform sampler2D metalnessMap;\r\n\r\n#endif";

var morphnormal_vertex = "#ifdef USE_MORPHNORMALS\r\n\r\n\tobjectNormal += ( morphNormal0 - normal ) * morphTargetInfluences[ 0 ];\r\n\tobjectNormal += ( morphNormal1 - normal ) * morphTargetInfluences[ 1 ];\r\n\tobjectNormal += ( morphNormal2 - normal ) * morphTargetInfluences[ 2 ];\r\n\tobjectNormal += ( morphNormal3 - normal ) * morphTargetInfluences[ 3 ];\r\n\r\n#endif\r\n";

var morphtarget_pars_vertex = "#ifdef USE_MORPHTARGETS\r\n\r\n\t#ifndef USE_MORPHNORMALS\r\n\r\n\tuniform float morphTargetInfluences[ 8 ];\r\n\r\n\t#else\r\n\r\n\tuniform float morphTargetInfluences[ 4 ];\r\n\r\n\t#endif\r\n\r\n#endif";

var morphtarget_vertex = "#ifdef USE_MORPHTARGETS\r\n\r\n\ttransformed += ( morphTarget0 - position ) * morphTargetInfluences[ 0 ];\r\n\ttransformed += ( morphTarget1 - position ) * morphTargetInfluences[ 1 ];\r\n\ttransformed += ( morphTarget2 - position ) * morphTargetInfluences[ 2 ];\r\n\ttransformed += ( morphTarget3 - position ) * morphTargetInfluences[ 3 ];\r\n\r\n\t#ifndef USE_MORPHNORMALS\r\n\r\n\ttransformed += ( morphTarget4 - position ) * morphTargetInfluences[ 4 ];\r\n\ttransformed += ( morphTarget5 - position ) * morphTargetInfluences[ 5 ];\r\n\ttransformed += ( morphTarget6 - position ) * morphTargetInfluences[ 6 ];\r\n\ttransformed += ( morphTarget7 - position ) * morphTargetInfluences[ 7 ];\r\n\r\n\t#endif\r\n\r\n#endif\r\n";

var normal_flip = "#ifdef DOUBLE_SIDED\r\n\tfloat flipNormal = ( float( gl_FrontFacing ) * 2.0 - 1.0 );\r\n#else\r\n\tfloat flipNormal = 1.0;\r\n#endif\r\n";

var normal_fragment = "#ifdef FLAT_SHADED\r\n\r\n\t// Workaround for Adreno/Nexus5 not able able to do dFdx( vViewPosition ) ...\r\n\r\n\tvec3 fdx = vec3( dFdx( vViewPosition.x ), dFdx( vViewPosition.y ), dFdx( vViewPosition.z ) );\r\n\tvec3 fdy = vec3( dFdy( vViewPosition.x ), dFdy( vViewPosition.y ), dFdy( vViewPosition.z ) );\r\n\tvec3 normal = normalize( cross( fdx, fdy ) );\r\n\r\n#else\r\n\r\n\tvec3 normal = normalize( vNormal ) * flipNormal;\r\n\r\n#endif\r\n\r\n#ifdef USE_NORMALMAP\r\n\r\n\tnormal = perturbNormal2Arb( -vViewPosition, normal );\r\n\r\n#elif defined( USE_BUMPMAP )\r\n\r\n\tnormal = perturbNormalArb( -vViewPosition, normal, dHdxy_fwd() );\r\n\r\n#endif\r\n";

var normalmap_pars_fragment = "#ifdef USE_NORMALMAP\r\n\r\n\tuniform sampler2D normalMap;\r\n\tuniform vec2 normalScale;\r\n\r\n\t// Per-Pixel Tangent Space Normal Mapping\r\n\t// http://hacksoflife.blogspot.ch/2009/11/per-pixel-tangent-space-normal-mapping.html\r\n\r\n\tvec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm ) {\r\n\r\n\t\t// Workaround for Adreno 3XX dFd*( vec3 ) bug. See #9988\r\n\r\n\t\tvec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );\r\n\t\tvec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );\r\n\t\tvec2 st0 = dFdx( vUv.st );\r\n\t\tvec2 st1 = dFdy( vUv.st );\r\n\r\n\t\tvec3 S = normalize( q0 * st1.t - q1 * st0.t );\r\n\t\tvec3 T = normalize( -q0 * st1.s + q1 * st0.s );\r\n\t\tvec3 N = normalize( surf_norm );\r\n\r\n\t\tvec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;\r\n\t\tmapN.xy = normalScale * mapN.xy;\r\n\t\tmat3 tsn = mat3( S, T, N );\r\n\t\treturn normalize( tsn * mapN );\r\n\r\n\t}\r\n\r\n#endif\r\n";

var packing = "vec3 packNormalToRGB( const in vec3 normal ) {\r\n\treturn normalize( normal ) * 0.5 + 0.5;\r\n}\r\n\r\nvec3 unpackRGBToNormal( const in vec3 rgb ) {\r\n\treturn 1.0 - 2.0 * rgb.xyz;\r\n}\r\n\r\nconst float PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)\r\nconst float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)\r\n\r\nconst vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );\r\nconst vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );\r\n\r\nconst float ShiftRight8 = 1. / 256.;\r\n\r\nvec4 packDepthToRGBA( const in float v ) {\r\n\tvec4 r = vec4( fract( v * PackFactors ), v );\r\n\tr.yzw -= r.xyz * ShiftRight8; // tidy overflow\r\n\treturn r * PackUpscale;\r\n}\r\n\r\nfloat unpackRGBAToDepth( const in vec4 v ) {\r\n\treturn dot( v, UnpackFactors );\r\n}\r\n\r\n// NOTE: viewZ/eyeZ is < 0 when in front of the camera per OpenGL conventions\r\n\r\nfloat viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {\r\n\treturn ( viewZ + near ) / ( near - far );\r\n}\r\nfloat orthographicDepthToViewZ( const in float linearClipZ, const in float near, const in float far ) {\r\n\treturn linearClipZ * ( near - far ) - near;\r\n}\r\n\r\nfloat viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {\r\n\treturn (( near + viewZ ) * far ) / (( far - near ) * viewZ );\r\n}\r\nfloat perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {\r\n\treturn ( near * far ) / ( ( far - near ) * invClipZ - far );\r\n}\r\n";

var premultiplied_alpha_fragment = "#ifdef PREMULTIPLIED_ALPHA\r\n\r\n\t// Get get normal blending with premultipled, use with CustomBlending, OneFactor, OneMinusSrcAlphaFactor, AddEquation.\r\n\tgl_FragColor.rgb *= gl_FragColor.a;\r\n\r\n#endif\r\n";

var project_vertex = "vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );\r\n\r\ngl_Position = projectionMatrix * mvPosition;\r\n";

var dithering_fragment = "#if defined( DITHERING )\r\n\r\n  gl_FragColor.rgb = dithering( gl_FragColor.rgb );\r\n\r\n#endif\r\n";

var dithering_pars_fragment = "#if defined( DITHERING )\r\n\r\n\t// based on https://www.shadertoy.com/view/MslGR8\r\n\tvec3 dithering( vec3 color ) {\r\n\t\t//Calculate grid position\r\n\t\tfloat grid_position = rand( gl_FragCoord.xy );\r\n\r\n\t\t//Shift the individual colors differently, thus making it even harder to see the dithering pattern\r\n\t\tvec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );\r\n\r\n\t\t//modify shift acording to grid position.\r\n\t\tdither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );\r\n\r\n\t\t//shift the color by dither_shift\r\n\t\treturn color + dither_shift_RGB;\r\n\t}\r\n\r\n#endif\r\n";

var roughnessmap_fragment = "float roughnessFactor = roughness;\r\n\r\n#ifdef USE_ROUGHNESSMAP\r\n\r\n\tvec4 texelRoughness = texture2D( roughnessMap, vUv );\r\n\r\n\t// reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture\r\n\troughnessFactor *= texelRoughness.g;\r\n\r\n#endif\r\n";

var roughnessmap_pars_fragment = "#ifdef USE_ROUGHNESSMAP\r\n\r\n\tuniform sampler2D roughnessMap;\r\n\r\n#endif";

var shadowmap_pars_fragment = "#ifdef USE_SHADOWMAP\r\n\r\n\t#if NUM_DIR_LIGHTS > 0\r\n\r\n\t\tuniform sampler2D directionalShadowMap[ NUM_DIR_LIGHTS ];\r\n\t\tvarying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHTS ];\r\n\r\n\t#endif\r\n\r\n\t#if NUM_SPOT_LIGHTS > 0\r\n\r\n\t\tuniform sampler2D spotShadowMap[ NUM_SPOT_LIGHTS ];\r\n\t\tvarying vec4 vSpotShadowCoord[ NUM_SPOT_LIGHTS ];\r\n\r\n\t#endif\r\n\r\n\t#if NUM_POINT_LIGHTS > 0\r\n\r\n\t\tuniform sampler2D pointShadowMap[ NUM_POINT_LIGHTS ];\r\n\t\tvarying vec4 vPointShadowCoord[ NUM_POINT_LIGHTS ];\r\n\r\n\t#endif\r\n\r\n\r\n\r\n\tfloat texture2DCompare( sampler2D depths, vec2 uv, float compare ) {\r\n\r\n\t\treturn step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );\r\n\r\n\t}\r\n\r\n\tfloat texture2DShadowLerp( sampler2D depths, vec2 size, vec2 uv, float compare ) {\r\n\r\n\t\tconst vec2 offset = vec2( 0.0, 1.0 );\r\n\r\n\t\tvec2 texelSize = vec2( 1.0 ) / size;\r\n\t\tvec2 centroidUV = floor( uv * size + 0.5 ) / size;\r\n\r\n\t\tfloat lb = texture2DCompare( depths, centroidUV + texelSize * offset.xx, compare );\r\n\t\tfloat lt = texture2DCompare( depths, centroidUV + texelSize * offset.xy, compare );\r\n\t\tfloat rb = texture2DCompare( depths, centroidUV + texelSize * offset.yx, compare );\r\n\t\tfloat rt = texture2DCompare( depths, centroidUV + texelSize * offset.yy, compare );\r\n\r\n\t\tvec2 f = fract( uv * size + 0.5 );\r\n\r\n\t\tfloat a = mix( lb, lt, f.y );\r\n\t\tfloat b = mix( rb, rt, f.y );\r\n\t\tfloat c = mix( a, b, f.x );\r\n\r\n\t\treturn c;\r\n\r\n\t}\r\n\r\n\tfloat getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {\r\n\r\n\t\tfloat shadow = 1.0;\r\n\r\n\t\tshadowCoord.xyz /= shadowCoord.w;\r\n\t\tshadowCoord.z += shadowBias;\r\n\r\n\t\t// if ( something && something ) breaks ATI OpenGL shader compiler\r\n\t\t// if ( all( something, something ) ) using this instead\r\n\r\n\t\tbvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );\r\n\t\tbool inFrustum = all( inFrustumVec );\r\n\r\n\t\tbvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );\r\n\r\n\t\tbool frustumTest = all( frustumTestVec );\r\n\r\n\t\tif ( frustumTest ) {\r\n\r\n\t\t#if defined( SHADOWMAP_TYPE_PCF )\r\n\r\n\t\t\tvec2 texelSize = vec2( 1.0 ) / shadowMapSize;\r\n\r\n\t\t\tfloat dx0 = - texelSize.x * shadowRadius;\r\n\t\t\tfloat dy0 = - texelSize.y * shadowRadius;\r\n\t\t\tfloat dx1 = + texelSize.x * shadowRadius;\r\n\t\t\tfloat dy1 = + texelSize.y * shadowRadius;\r\n\r\n\t\t\tshadow = (\r\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +\r\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +\r\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +\r\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +\r\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +\r\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +\r\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +\r\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +\r\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )\r\n\t\t\t) * ( 1.0 / 9.0 );\r\n\r\n\t\t#elif defined( SHADOWMAP_TYPE_PCF_SOFT )\r\n\r\n\t\t\tvec2 texelSize = vec2( 1.0 ) / shadowMapSize;\r\n\r\n\t\t\tfloat dx0 = - texelSize.x * shadowRadius;\r\n\t\t\tfloat dy0 = - texelSize.y * shadowRadius;\r\n\t\t\tfloat dx1 = + texelSize.x * shadowRadius;\r\n\t\t\tfloat dy1 = + texelSize.y * shadowRadius;\r\n\r\n\t\t\tshadow = (\r\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +\r\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +\r\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +\r\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +\r\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy, shadowCoord.z ) +\r\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +\r\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +\r\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +\r\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )\r\n\t\t\t) * ( 1.0 / 9.0 );\r\n\r\n\t\t#else // no percentage-closer filtering:\r\n\r\n\t\t\tshadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );\r\n\r\n\t\t#endif\r\n\r\n\t\t}\r\n\r\n\t\treturn shadow;\r\n\r\n\t}\r\n\r\n\t// cubeToUV() maps a 3D direction vector suitable for cube texture mapping to a 2D\r\n\t// vector suitable for 2D texture mapping. This code uses the following layout for the\r\n\t// 2D texture:\r\n\t//\r\n\t// xzXZ\r\n\t//  y Y\r\n\t//\r\n\t// Y - Positive y direction\r\n\t// y - Negative y direction\r\n\t// X - Positive x direction\r\n\t// x - Negative x direction\r\n\t// Z - Positive z direction\r\n\t// z - Negative z direction\r\n\t//\r\n\t// Source and test bed:\r\n\t// https://gist.github.com/tschw/da10c43c467ce8afd0c4\r\n\r\n\tvec2 cubeToUV( vec3 v, float texelSizeY ) {\r\n\r\n\t\t// Number of texels to avoid at the edge of each square\r\n\r\n\t\tvec3 absV = abs( v );\r\n\r\n\t\t// Intersect unit cube\r\n\r\n\t\tfloat scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );\r\n\t\tabsV *= scaleToCube;\r\n\r\n\t\t// Apply scale to avoid seams\r\n\r\n\t\t// two texels less per square (one texel will do for NEAREST)\r\n\t\tv *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );\r\n\r\n\t\t// Unwrap\r\n\r\n\t\t// space: -1 ... 1 range for each square\r\n\t\t//\r\n\t\t// #X##\t\tdim    := ( 4 , 2 )\r\n\t\t//  # #\t\tcenter := ( 1 , 1 )\r\n\r\n\t\tvec2 planar = v.xy;\r\n\r\n\t\tfloat almostATexel = 1.5 * texelSizeY;\r\n\t\tfloat almostOne = 1.0 - almostATexel;\r\n\r\n\t\tif ( absV.z >= almostOne ) {\r\n\r\n\t\t\tif ( v.z > 0.0 )\r\n\t\t\t\tplanar.x = 4.0 - v.x;\r\n\r\n\t\t} else if ( absV.x >= almostOne ) {\r\n\r\n\t\t\tfloat signX = sign( v.x );\r\n\t\t\tplanar.x = v.z * signX + 2.0 * signX;\r\n\r\n\t\t} else if ( absV.y >= almostOne ) {\r\n\r\n\t\t\tfloat signY = sign( v.y );\r\n\t\t\tplanar.x = v.x + 2.0 * signY + 2.0;\r\n\t\t\tplanar.y = v.z * signY - 2.0;\r\n\r\n\t\t}\r\n\r\n\t\t// Transform to UV space\r\n\r\n\t\t// scale := 0.5 / dim\r\n\t\t// translate := ( center + 0.5 ) / dim\r\n\t\treturn vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );\r\n\r\n\t}\r\n\r\n\tfloat getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {\r\n\r\n\t\tvec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );\r\n\r\n\t\t// for point lights, the uniform @vShadowCoord is re-purposed to hold\r\n\t\t// the distance from the light to the world-space position of the fragment.\r\n\t\tvec3 lightToPosition = shadowCoord.xyz;\r\n\r\n\t\t// bd3D = base direction 3D\r\n\t\tvec3 bd3D = normalize( lightToPosition );\r\n\t\t// dp = distance from light to fragment position\r\n\t\tfloat dp = ( length( lightToPosition ) - shadowBias ) / 1000.0;\r\n\r\n\t\t#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT )\r\n\r\n\t\t\tvec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;\r\n\r\n\t\t\treturn (\r\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +\r\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +\r\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +\r\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +\r\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +\r\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +\r\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +\r\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +\r\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )\r\n\t\t\t) * ( 1.0 / 9.0 );\r\n\r\n\t\t#else // no percentage-closer filtering\r\n\r\n\t\t\treturn texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );\r\n\r\n\t\t#endif\r\n\r\n\t}\r\n\r\n#endif\r\n";

var shadowmap_pars_vertex = "#ifdef USE_SHADOWMAP\r\n\r\n\t#if NUM_DIR_LIGHTS > 0\r\n\r\n\t\tuniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHTS ];\r\n\t\tvarying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHTS ];\r\n\r\n\t#endif\r\n\r\n\t#if NUM_SPOT_LIGHTS > 0\r\n\r\n\t\tuniform mat4 spotShadowMatrix[ NUM_SPOT_LIGHTS ];\r\n\t\tvarying vec4 vSpotShadowCoord[ NUM_SPOT_LIGHTS ];\r\n\r\n\t#endif\r\n\r\n\t#if NUM_POINT_LIGHTS > 0\r\n\r\n\t\tuniform mat4 pointShadowMatrix[ NUM_POINT_LIGHTS ];\r\n\t\tvarying vec4 vPointShadowCoord[ NUM_POINT_LIGHTS ];\r\n\r\n\t#endif\r\n\r\n\r\n\r\n#endif\r\n";

var shadowmap_vertex = "#ifdef USE_SHADOWMAP\r\n\r\n\t#if NUM_DIR_LIGHTS > 0\r\n\r\n\tfor ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\r\n\r\n\t\tvDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * worldPosition;\r\n\r\n\t}\r\n\r\n\t#endif\r\n\r\n\t#if NUM_SPOT_LIGHTS > 0\r\n\r\n\tfor ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\r\n\r\n\t\tvSpotShadowCoord[ i ] = spotShadowMatrix[ i ] * worldPosition;\r\n\r\n\t}\r\n\r\n\t#endif\r\n\r\n\t#if NUM_POINT_LIGHTS > 0\r\n\r\n\tfor ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\r\n\r\n\t\tvPointShadowCoord[ i ] = pointShadowMatrix[ i ] * worldPosition;\r\n\r\n\t}\r\n\r\n\t#endif\r\n\r\n\r\n\r\n#endif\r\n";

var shadowmask_pars_fragment = "float getShadowMask() {\r\n\r\n\tfloat shadow = 1.0;\r\n\r\n\t#ifdef USE_SHADOWMAP\r\n\r\n\t#if NUM_DIR_LIGHTS > 0\r\n\r\n\tDirectionalLight directionalLight;\r\n\r\n\tfor ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\r\n\r\n\t\tdirectionalLight = directionalLights[ i ];\r\n\t\tshadow *= bool( directionalLight.shadow ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\r\n\r\n\t}\r\n\r\n\t#endif\r\n\r\n\t#if NUM_SPOT_LIGHTS > 0\r\n\r\n\tSpotLight spotLight;\r\n\r\n\tfor ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\r\n\r\n\t\tspotLight = spotLights[ i ];\r\n\t\tshadow *= bool( spotLight.shadow ) ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;\r\n\r\n\t}\r\n\r\n\t#endif\r\n\r\n\t#if NUM_POINT_LIGHTS > 0\r\n\r\n\tPointLight pointLight;\r\n\r\n\tfor ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\r\n\r\n\t\tpointLight = pointLights[ i ];\r\n\t\tshadow *= bool( pointLight.shadow ) ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ] ) : 1.0;\r\n\r\n\t}\r\n\r\n\t#endif\r\n\r\n\r\n\r\n\t#endif\r\n\r\n\treturn shadow;\r\n\r\n}\r\n";

var skinbase_vertex = "#ifdef USE_SKINNING\r\n\r\n\tmat4 boneMatX = getBoneMatrix( skinIndex.x );\r\n\tmat4 boneMatY = getBoneMatrix( skinIndex.y );\r\n\tmat4 boneMatZ = getBoneMatrix( skinIndex.z );\r\n\tmat4 boneMatW = getBoneMatrix( skinIndex.w );\r\n\r\n#endif";

var skinning_pars_vertex = "#ifdef USE_SKINNING\r\n\r\n\tuniform mat4 bindMatrix;\r\n\tuniform mat4 bindMatrixInverse;\r\n\r\n\t#ifdef BONE_TEXTURE\r\n\r\n\t\tuniform sampler2D boneTexture;\r\n\t\tuniform int boneTextureSize;\r\n\r\n\t\tmat4 getBoneMatrix( const in float i ) {\r\n\r\n\t\t\tfloat j = i * 4.0;\r\n\t\t\tfloat x = mod( j, float( boneTextureSize ) );\r\n\t\t\tfloat y = floor( j / float( boneTextureSize ) );\r\n\r\n\t\t\tfloat dx = 1.0 / float( boneTextureSize );\r\n\t\t\tfloat dy = 1.0 / float( boneTextureSize );\r\n\r\n\t\t\ty = dy * ( y + 0.5 );\r\n\r\n\t\t\tvec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );\r\n\t\t\tvec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );\r\n\t\t\tvec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );\r\n\t\t\tvec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );\r\n\r\n\t\t\tmat4 bone = mat4( v1, v2, v3, v4 );\r\n\r\n\t\t\treturn bone;\r\n\r\n\t\t}\r\n\r\n\t#else\r\n\r\n\t\tuniform mat4 boneMatrices[ MAX_BONES ];\r\n\r\n\t\tmat4 getBoneMatrix( const in float i ) {\r\n\r\n\t\t\tmat4 bone = boneMatrices[ int(i) ];\r\n\t\t\treturn bone;\r\n\r\n\t\t}\r\n\r\n\t#endif\r\n\r\n#endif\r\n";

var skinning_vertex = "#ifdef USE_SKINNING\r\n\r\n\tvec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );\r\n\r\n\tvec4 skinned = vec4( 0.0 );\r\n\tskinned += boneMatX * skinVertex * skinWeight.x;\r\n\tskinned += boneMatY * skinVertex * skinWeight.y;\r\n\tskinned += boneMatZ * skinVertex * skinWeight.z;\r\n\tskinned += boneMatW * skinVertex * skinWeight.w;\r\n\r\n\ttransformed = ( bindMatrixInverse * skinned ).xyz;\r\n\r\n#endif\r\n";

var skinnormal_vertex = "#ifdef USE_SKINNING\r\n\r\n\tmat4 skinMatrix = mat4( 0.0 );\r\n\tskinMatrix += skinWeight.x * boneMatX;\r\n\tskinMatrix += skinWeight.y * boneMatY;\r\n\tskinMatrix += skinWeight.z * boneMatZ;\r\n\tskinMatrix += skinWeight.w * boneMatW;\r\n\tskinMatrix  = bindMatrixInverse * skinMatrix * bindMatrix;\r\n\r\n\tobjectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;\r\n\r\n#endif\r\n";

var specularmap_fragment = "float specularStrength;\r\n\r\n#ifdef USE_SPECULARMAP\r\n\r\n\tvec4 texelSpecular = texture2D( specularMap, vUv );\r\n\tspecularStrength = texelSpecular.r;\r\n\r\n#else\r\n\r\n\tspecularStrength = 1.0;\r\n\r\n#endif";

var specularmap_pars_fragment = "#ifdef USE_SPECULARMAP\r\n\r\n\tuniform sampler2D specularMap;\r\n\r\n#endif";

var tonemapping_fragment = "#if defined( TONE_MAPPING )\r\n\r\n  gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );\r\n\r\n#endif\r\n";

var tonemapping_pars_fragment = "#define saturate(a) clamp( a, 0.0, 1.0 )\r\n\r\nuniform float toneMappingExposure;\r\nuniform float toneMappingWhitePoint;\r\n\r\n// exposure only\r\nvec3 LinearToneMapping( vec3 color ) {\r\n\r\n\treturn toneMappingExposure * color;\r\n\r\n}\r\n\r\n// source: https://www.cs.utah.edu/~reinhard/cdrom/\r\nvec3 ReinhardToneMapping( vec3 color ) {\r\n\r\n\tcolor *= toneMappingExposure;\r\n\treturn saturate( color / ( vec3( 1.0 ) + color ) );\r\n\r\n}\r\n\r\n// source: http://filmicgames.com/archives/75\r\n#define Uncharted2Helper( x ) max( ( ( x * ( 0.15 * x + 0.10 * 0.50 ) + 0.20 * 0.02 ) / ( x * ( 0.15 * x + 0.50 ) + 0.20 * 0.30 ) ) - 0.02 / 0.30, vec3( 0.0 ) )\r\nvec3 Uncharted2ToneMapping( vec3 color ) {\r\n\r\n\t// John Hable's filmic operator from Uncharted 2 video game\r\n\tcolor *= toneMappingExposure;\r\n\treturn saturate( Uncharted2Helper( color ) / Uncharted2Helper( vec3( toneMappingWhitePoint ) ) );\r\n\r\n}\r\n\r\n// source: http://filmicgames.com/archives/75\r\nvec3 OptimizedCineonToneMapping( vec3 color ) {\r\n\r\n\t// optimized filmic operator by Jim Hejl and Richard Burgess-Dawson\r\n\tcolor *= toneMappingExposure;\r\n\tcolor = max( vec3( 0.0 ), color - 0.004 );\r\n\treturn pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );\r\n\r\n}\r\n";

var uv_pars_fragment = "#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )\r\n\r\n\tvarying vec2 vUv;\r\n\r\n#endif";

var uv_pars_vertex = "#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )\r\n\r\n\tvarying vec2 vUv;\r\n\tuniform vec4 offsetRepeat;\r\n\r\n#endif\r\n";

var uv_vertex = "#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )\r\n\r\n\tvUv = uv * offsetRepeat.zw + offsetRepeat.xy;\r\n\r\n#endif";

var uv2_pars_fragment = "#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )\r\n\r\n\tvarying vec2 vUv2;\r\n\r\n#endif";

var uv2_pars_vertex = "#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )\r\n\r\n\tattribute vec2 uv2;\r\n\tvarying vec2 vUv2;\r\n\r\n#endif";

var uv2_vertex = "#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )\r\n\r\n\tvUv2 = uv2;\r\n\r\n#endif";

var worldpos_vertex = "#if defined( USE_ENVMAP ) || defined( PHONG ) || defined( PHYSICAL ) || defined( LAMBERT ) || defined ( USE_SHADOWMAP )\r\n\r\n\tvec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );\r\n\r\n#endif\r\n";

var cube_frag = "uniform samplerCube tCube;\r\nuniform float tFlip;\r\nuniform float opacity;\r\n\r\nvarying vec3 vWorldPosition;\r\n\r\n#include <common>\r\n\r\nvoid main() {\r\n\r\n\tgl_FragColor = textureCube( tCube, vec3( tFlip * vWorldPosition.x, vWorldPosition.yz ) );\r\n\tgl_FragColor.a *= opacity;\r\n\r\n}\r\n";

var cube_vert = "varying vec3 vWorldPosition;\r\n\r\n#include <common>\r\n\r\nvoid main() {\r\n\r\n\tvWorldPosition = transformDirection( position, modelMatrix );\r\n\r\n\t#include <begin_vertex>\r\n\t#include <project_vertex>\r\n\r\n}\r\n";

var depth_frag = "#if DEPTH_PACKING == 3200\r\n\r\n\tuniform float opacity;\r\n\r\n#endif\r\n\r\n#include <common>\r\n#include <packing>\r\n#include <uv_pars_fragment>\r\n#include <map_pars_fragment>\r\n#include <alphamap_pars_fragment>\r\n#include <logdepthbuf_pars_fragment>\r\n#include <clipping_planes_pars_fragment>\r\n\r\nvoid main() {\r\n\r\n\t#include <clipping_planes_fragment>\r\n\r\n\tvec4 diffuseColor = vec4( 1.0 );\r\n\r\n\t#if DEPTH_PACKING == 3200\r\n\r\n\t\tdiffuseColor.a = opacity;\r\n\r\n\t#endif\r\n\r\n\t#include <map_fragment>\r\n\t#include <alphamap_fragment>\r\n\t#include <alphatest_fragment>\r\n\r\n\t#include <logdepthbuf_fragment>\r\n\r\n\t#if DEPTH_PACKING == 3200\r\n\r\n\t\tgl_FragColor = vec4( vec3( gl_FragCoord.z ), opacity );\r\n\r\n\t#elif DEPTH_PACKING == 3201\r\n\r\n\t\tgl_FragColor = packDepthToRGBA( gl_FragCoord.z );\r\n\r\n\t#endif\r\n\r\n}\r\n";

var depth_vert = "#include <common>\r\n#include <uv_pars_vertex>\r\n#include <displacementmap_pars_vertex>\r\n#include <morphtarget_pars_vertex>\r\n#include <skinning_pars_vertex>\r\n#include <logdepthbuf_pars_vertex>\r\n#include <clipping_planes_pars_vertex>\r\n\r\nvoid main() {\r\n\r\n\t#include <uv_vertex>\r\n\r\n\t#include <skinbase_vertex>\r\n\r\n\t#ifdef USE_DISPLACEMENTMAP\r\n\r\n\t\t#include <beginnormal_vertex>\r\n\t\t#include <morphnormal_vertex>\r\n\t\t#include <skinnormal_vertex>\r\n\r\n\t#endif\r\n\r\n\t#include <begin_vertex>\r\n\t#include <morphtarget_vertex>\r\n\t#include <skinning_vertex>\r\n\t#include <displacementmap_vertex>\r\n\t#include <project_vertex>\r\n\t#include <logdepthbuf_vertex>\r\n\t#include <clipping_planes_vertex>\r\n\r\n}\r\n";

var distanceRGBA_frag = "uniform vec3 lightPos;\r\nvarying vec4 vWorldPosition;\r\n\r\n#include <common>\r\n#include <packing>\r\n#include <clipping_planes_pars_fragment>\r\n\r\nvoid main () {\r\n\r\n\t#include <clipping_planes_fragment>\r\n\r\n\tgl_FragColor = packDepthToRGBA( length( vWorldPosition.xyz - lightPos.xyz ) / 1000.0 );\r\n\r\n}\r\n";

var distanceRGBA_vert = "varying vec4 vWorldPosition;\r\n\r\n#include <common>\r\n#include <morphtarget_pars_vertex>\r\n#include <skinning_pars_vertex>\r\n#include <clipping_planes_pars_vertex>\r\n\r\nvoid main() {\r\n\r\n\t#include <skinbase_vertex>\r\n\t#include <begin_vertex>\r\n\t#include <morphtarget_vertex>\r\n\t#include <skinning_vertex>\r\n\t#include <project_vertex>\r\n\t#include <worldpos_vertex>\r\n\t#include <clipping_planes_vertex>\r\n\r\n\tvWorldPosition = worldPosition;\r\n\r\n}\r\n";

var equirect_frag = "uniform sampler2D tEquirect;\r\nuniform float tFlip;\r\n\r\nvarying vec3 vWorldPosition;\r\n\r\n#include <common>\r\n\r\nvoid main() {\r\n\r\n\t// \tgl_FragColor = textureCube( tCube, vec3( tFlip * vWorldPosition.x, vWorldPosition.yz ) );\r\n\tvec3 direction = normalize( vWorldPosition );\r\n\tvec2 sampleUV;\r\n\tsampleUV.y = saturate( tFlip * direction.y * -0.5 + 0.5 );\r\n\tsampleUV.x = atan( direction.z, direction.x ) * RECIPROCAL_PI2 + 0.5;\r\n\tgl_FragColor = texture2D( tEquirect, sampleUV );\r\n\r\n}\r\n";

var equirect_vert = "varying vec3 vWorldPosition;\r\n\r\n#include <common>\r\n\r\nvoid main() {\r\n\r\n\tvWorldPosition = transformDirection( position, modelMatrix );\r\n\r\n\t#include <begin_vertex>\r\n\t#include <project_vertex>\r\n\r\n}\r\n";

var linedashed_frag = "uniform vec3 diffuse;\r\nuniform float opacity;\r\n\r\nuniform float dashSize;\r\nuniform float totalSize;\r\n\r\nvarying float vLineDistance;\r\n\r\n#include <common>\r\n#include <color_pars_fragment>\r\n#include <fog_pars_fragment>\r\n#include <logdepthbuf_pars_fragment>\r\n#include <clipping_planes_pars_fragment>\r\n\r\nvoid main() {\r\n\r\n\t#include <clipping_planes_fragment>\r\n\r\n\tif ( mod( vLineDistance, totalSize ) > dashSize ) {\r\n\r\n\t\tdiscard;\r\n\r\n\t}\r\n\r\n\tvec3 outgoingLight = vec3( 0.0 );\r\n\tvec4 diffuseColor = vec4( diffuse, opacity );\r\n\r\n\t#include <logdepthbuf_fragment>\r\n\t#include <color_fragment>\r\n\r\n\toutgoingLight = diffuseColor.rgb; // simple shader\r\n\r\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\r\n\r\n\t#include <premultiplied_alpha_fragment>\r\n\t#include <tonemapping_fragment>\r\n\t#include <encodings_fragment>\r\n\t#include <fog_fragment>\r\n\r\n}\r\n";

var linedashed_vert = "uniform float scale;\r\nattribute float lineDistance;\r\n\r\nvarying float vLineDistance;\r\n\r\n#include <common>\r\n#include <color_pars_vertex>\r\n#include <fog_pars_vertex>\r\n#include <logdepthbuf_pars_vertex>\r\n#include <clipping_planes_pars_vertex>\r\n\r\nvoid main() {\r\n\r\n\t#include <color_vertex>\r\n\r\n\tvLineDistance = scale * lineDistance;\r\n\r\n\tvec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\r\n\tgl_Position = projectionMatrix * mvPosition;\r\n\r\n\t#include <logdepthbuf_vertex>\r\n\t#include <clipping_planes_vertex>\r\n\t#include <fog_vertex>\r\n\r\n}\r\n";

var meshbasic_frag = "uniform vec3 diffuse;\r\nuniform float opacity;\r\n\r\n#ifndef FLAT_SHADED\r\n\r\n\tvarying vec3 vNormal;\r\n\r\n#endif\r\n\r\n#include <common>\r\n#include <color_pars_fragment>\r\n#include <uv_pars_fragment>\r\n#include <uv2_pars_fragment>\r\n#include <map_pars_fragment>\r\n#include <alphamap_pars_fragment>\r\n#include <aomap_pars_fragment>\r\n#include <lightmap_pars_fragment>\r\n#include <envmap_pars_fragment>\r\n#include <fog_pars_fragment>\r\n#include <specularmap_pars_fragment>\r\n#include <logdepthbuf_pars_fragment>\r\n#include <clipping_planes_pars_fragment>\r\n\r\nvoid main() {\r\n\r\n\t#include <clipping_planes_fragment>\r\n\r\n\tvec4 diffuseColor = vec4( diffuse, opacity );\r\n\r\n\t#include <logdepthbuf_fragment>\r\n\t#include <map_fragment>\r\n\t#include <color_fragment>\r\n\t#include <alphamap_fragment>\r\n\t#include <alphatest_fragment>\r\n\t#include <specularmap_fragment>\r\n\r\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\r\n\r\n\t// accumulation (baked indirect lighting only)\r\n\t#ifdef USE_LIGHTMAP\r\n\r\n\t\treflectedLight.indirectDiffuse += texture2D( lightMap, vUv2 ).xyz * lightMapIntensity;\r\n\r\n\t#else\r\n\r\n\t\treflectedLight.indirectDiffuse += vec3( 1.0 );\r\n\r\n\t#endif\r\n\r\n\t// modulation\r\n\t#include <aomap_fragment>\r\n\r\n\treflectedLight.indirectDiffuse *= diffuseColor.rgb;\r\n\r\n\tvec3 outgoingLight = reflectedLight.indirectDiffuse;\r\n\r\n\t#include <normal_flip>\r\n\t#include <envmap_fragment>\r\n\r\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\r\n\r\n\t#include <premultiplied_alpha_fragment>\r\n\t#include <tonemapping_fragment>\r\n\t#include <encodings_fragment>\r\n\t#include <fog_fragment>\r\n\r\n}\r\n";

var meshbasic_vert = "#include <common>\r\n#include <uv_pars_vertex>\r\n#include <uv2_pars_vertex>\r\n#include <envmap_pars_vertex>\r\n#include <color_pars_vertex>\r\n#include <fog_pars_vertex>\r\n#include <morphtarget_pars_vertex>\r\n#include <skinning_pars_vertex>\r\n#include <logdepthbuf_pars_vertex>\r\n#include <clipping_planes_pars_vertex>\r\n\r\nvoid main() {\r\n\r\n\t#include <uv_vertex>\r\n\t#include <uv2_vertex>\r\n\t#include <color_vertex>\r\n\t#include <skinbase_vertex>\r\n\r\n\t#ifdef USE_ENVMAP\r\n\r\n\t#include <beginnormal_vertex>\r\n\t#include <morphnormal_vertex>\r\n\t#include <skinnormal_vertex>\r\n\t#include <defaultnormal_vertex>\r\n\r\n\t#endif\r\n\r\n\t#include <begin_vertex>\r\n\t#include <morphtarget_vertex>\r\n\t#include <skinning_vertex>\r\n\t#include <project_vertex>\r\n\t#include <logdepthbuf_vertex>\r\n\r\n\t#include <worldpos_vertex>\r\n\t#include <clipping_planes_vertex>\r\n\t#include <envmap_vertex>\r\n\t#include <fog_vertex>\r\n\r\n}\r\n";

var meshlambert_frag = "uniform vec3 diffuse;\r\nuniform vec3 emissive;\r\nuniform float opacity;\r\n\r\nvarying vec3 vLightFront;\r\n\r\n#ifdef DOUBLE_SIDED\r\n\r\n\tvarying vec3 vLightBack;\r\n\r\n#endif\r\n\r\n#include <common>\r\n#include <packing>\r\n#include <dithering_pars_fragment>\r\n#include <color_pars_fragment>\r\n#include <uv_pars_fragment>\r\n#include <uv2_pars_fragment>\r\n#include <map_pars_fragment>\r\n#include <alphamap_pars_fragment>\r\n#include <aomap_pars_fragment>\r\n#include <lightmap_pars_fragment>\r\n#include <emissivemap_pars_fragment>\r\n#include <envmap_pars_fragment>\r\n#include <bsdfs>\r\n#include <lights_pars>\r\n#include <fog_pars_fragment>\r\n#include <shadowmap_pars_fragment>\r\n#include <shadowmask_pars_fragment>\r\n#include <specularmap_pars_fragment>\r\n#include <logdepthbuf_pars_fragment>\r\n#include <clipping_planes_pars_fragment>\r\n\r\nvoid main() {\r\n\r\n\t#include <clipping_planes_fragment>\r\n\r\n\tvec4 diffuseColor = vec4( diffuse, opacity );\r\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\r\n\tvec3 totalEmissiveRadiance = emissive;\r\n\r\n\t#include <logdepthbuf_fragment>\r\n\t#include <map_fragment>\r\n\t#include <color_fragment>\r\n\t#include <alphamap_fragment>\r\n\t#include <alphatest_fragment>\r\n\t#include <specularmap_fragment>\r\n\t#include <emissivemap_fragment>\r\n\r\n\t// accumulation\r\n\treflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );\r\n\r\n\t#include <lightmap_fragment>\r\n\r\n\treflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );\r\n\r\n\t#ifdef DOUBLE_SIDED\r\n\r\n\t\treflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;\r\n\r\n\t#else\r\n\r\n\t\treflectedLight.directDiffuse = vLightFront;\r\n\r\n\t#endif\r\n\r\n\treflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();\r\n\r\n\t// modulation\r\n\t#include <aomap_fragment>\r\n\r\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\r\n\r\n\t#include <normal_flip>\r\n\t#include <envmap_fragment>\r\n\r\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\r\n\r\n\t#include <tonemapping_fragment>\r\n\t#include <encodings_fragment>\r\n\t#include <fog_fragment>\r\n\t#include <premultiplied_alpha_fragment>\r\n\t#include <dithering_fragment>\r\n\r\n}\r\n";

var meshlambert_vert = "#define LAMBERT\r\n\r\nvarying vec3 vLightFront;\r\n\r\n#ifdef DOUBLE_SIDED\r\n\r\n\tvarying vec3 vLightBack;\r\n\r\n#endif\r\n\r\n#include <common>\r\n#include <uv_pars_vertex>\r\n#include <uv2_pars_vertex>\r\n#include <envmap_pars_vertex>\r\n#include <bsdfs>\r\n#include <lights_pars>\r\n#include <color_pars_vertex>\r\n#include <fog_pars_vertex>\r\n#include <morphtarget_pars_vertex>\r\n#include <skinning_pars_vertex>\r\n#include <shadowmap_pars_vertex>\r\n#include <logdepthbuf_pars_vertex>\r\n#include <clipping_planes_pars_vertex>\r\n\r\nvoid main() {\r\n\r\n\t#include <uv_vertex>\r\n\t#include <uv2_vertex>\r\n\t#include <color_vertex>\r\n\r\n\t#include <beginnormal_vertex>\r\n\t#include <morphnormal_vertex>\r\n\t#include <skinbase_vertex>\r\n\t#include <skinnormal_vertex>\r\n\t#include <defaultnormal_vertex>\r\n\r\n\t#include <begin_vertex>\r\n\t#include <morphtarget_vertex>\r\n\t#include <skinning_vertex>\r\n\t#include <project_vertex>\r\n\t#include <logdepthbuf_vertex>\r\n\t#include <clipping_planes_vertex>\r\n\r\n\t#include <worldpos_vertex>\r\n\t#include <envmap_vertex>\r\n\t#include <lights_lambert_vertex>\r\n\t#include <shadowmap_vertex>\r\n\t#include <fog_vertex>\r\n\r\n}\r\n";

var meshphong_frag = "#define PHONG\r\n\r\nuniform vec3 diffuse;\r\nuniform vec3 emissive;\r\nuniform vec3 specular;\r\nuniform float shininess;\r\nuniform float opacity;\r\n\r\n#include <common>\r\n#include <packing>\r\n#include <dithering_pars_fragment>\r\n#include <color_pars_fragment>\r\n#include <uv_pars_fragment>\r\n#include <uv2_pars_fragment>\r\n#include <map_pars_fragment>\r\n#include <alphamap_pars_fragment>\r\n#include <aomap_pars_fragment>\r\n#include <lightmap_pars_fragment>\r\n#include <emissivemap_pars_fragment>\r\n#include <envmap_pars_fragment>\r\n#include <gradientmap_pars_fragment>\r\n#include <fog_pars_fragment>\r\n#include <bsdfs>\r\n#include <lights_pars>\r\n#include <lights_phong_pars_fragment>\r\n#include <shadowmap_pars_fragment>\r\n#include <bumpmap_pars_fragment>\r\n#include <normalmap_pars_fragment>\r\n#include <specularmap_pars_fragment>\r\n#include <logdepthbuf_pars_fragment>\r\n#include <clipping_planes_pars_fragment>\r\n\r\nvoid main() {\r\n\r\n\t#include <clipping_planes_fragment>\r\n\r\n\tvec4 diffuseColor = vec4( diffuse, opacity );\r\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\r\n\tvec3 totalEmissiveRadiance = emissive;\r\n\r\n\t#include <logdepthbuf_fragment>\r\n\t#include <map_fragment>\r\n\t#include <color_fragment>\r\n\t#include <alphamap_fragment>\r\n\t#include <alphatest_fragment>\r\n\t#include <specularmap_fragment>\r\n\t#include <normal_flip>\r\n\t#include <normal_fragment>\r\n\t#include <emissivemap_fragment>\r\n\r\n\t// accumulation\r\n\t#include <lights_phong_fragment>\r\n\t#include <lights_template>\r\n\r\n\t// modulation\r\n\t#include <aomap_fragment>\r\n\r\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\r\n\r\n\t#include <envmap_fragment>\r\n\r\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\r\n\r\n\t#include <tonemapping_fragment>\r\n\t#include <encodings_fragment>\r\n\t#include <fog_fragment>\r\n\t#include <premultiplied_alpha_fragment>\r\n\t#include <dithering_fragment>\r\n\r\n}\r\n";

var meshphong_vert = "#define PHONG\r\n\r\nvarying vec3 vViewPosition;\r\n\r\n#ifndef FLAT_SHADED\r\n\r\n\tvarying vec3 vNormal;\r\n\r\n#endif\r\n\r\n#include <common>\r\n#include <uv_pars_vertex>\r\n#include <uv2_pars_vertex>\r\n#include <displacementmap_pars_vertex>\r\n#include <envmap_pars_vertex>\r\n#include <color_pars_vertex>\r\n#include <fog_pars_vertex>\r\n#include <morphtarget_pars_vertex>\r\n#include <skinning_pars_vertex>\r\n#include <shadowmap_pars_vertex>\r\n#include <logdepthbuf_pars_vertex>\r\n#include <clipping_planes_pars_vertex>\r\n\r\nvoid main() {\r\n\r\n\t#include <uv_vertex>\r\n\t#include <uv2_vertex>\r\n\t#include <color_vertex>\r\n\r\n\t#include <beginnormal_vertex>\r\n\t#include <morphnormal_vertex>\r\n\t#include <skinbase_vertex>\r\n\t#include <skinnormal_vertex>\r\n\t#include <defaultnormal_vertex>\r\n\r\n#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED\r\n\r\n\tvNormal = normalize( transformedNormal );\r\n\r\n#endif\r\n\r\n\t#include <begin_vertex>\r\n\t#include <morphtarget_vertex>\r\n\t#include <skinning_vertex>\r\n\t#include <displacementmap_vertex>\r\n\t#include <project_vertex>\r\n\t#include <logdepthbuf_vertex>\r\n\t#include <clipping_planes_vertex>\r\n\r\n\tvViewPosition = - mvPosition.xyz;\r\n\r\n\t#include <worldpos_vertex>\r\n\t#include <envmap_vertex>\r\n\t#include <shadowmap_vertex>\r\n\t#include <fog_vertex>\r\n\r\n}\r\n";

var meshphysical_frag = "#define PHYSICAL\r\n\r\nuniform vec3 diffuse;\r\nuniform vec3 emissive;\r\nuniform float roughness;\r\nuniform float metalness;\r\nuniform float opacity;\r\n\r\n#ifndef STANDARD\r\n\tuniform float clearCoat;\r\n\tuniform float clearCoatRoughness;\r\n#endif\r\n\r\nvarying vec3 vViewPosition;\r\n\r\n#ifndef FLAT_SHADED\r\n\r\n\tvarying vec3 vNormal;\r\n\r\n#endif\r\n\r\n#include <common>\r\n#include <packing>\r\n#include <dithering_pars_fragment>\r\n#include <color_pars_fragment>\r\n#include <uv_pars_fragment>\r\n#include <uv2_pars_fragment>\r\n#include <map_pars_fragment>\r\n#include <alphamap_pars_fragment>\r\n#include <aomap_pars_fragment>\r\n#include <lightmap_pars_fragment>\r\n#include <emissivemap_pars_fragment>\r\n#include <envmap_pars_fragment>\r\n#include <fog_pars_fragment>\r\n#include <bsdfs>\r\n#include <cube_uv_reflection_fragment>\r\n#include <lights_pars>\r\n#include <lights_physical_pars_fragment>\r\n#include <shadowmap_pars_fragment>\r\n#include <bumpmap_pars_fragment>\r\n#include <normalmap_pars_fragment>\r\n#include <roughnessmap_pars_fragment>\r\n#include <metalnessmap_pars_fragment>\r\n#include <logdepthbuf_pars_fragment>\r\n#include <clipping_planes_pars_fragment>\r\n\r\nvoid main() {\r\n\r\n\t#include <clipping_planes_fragment>\r\n\r\n\tvec4 diffuseColor = vec4( diffuse, opacity );\r\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\r\n\tvec3 totalEmissiveRadiance = emissive;\r\n\r\n\t#include <logdepthbuf_fragment>\r\n\t#include <map_fragment>\r\n\t#include <color_fragment>\r\n\t#include <alphamap_fragment>\r\n\t#include <alphatest_fragment>\r\n\t#include <roughnessmap_fragment>\r\n\t#include <metalnessmap_fragment>\r\n\t#include <normal_flip>\r\n\t#include <normal_fragment>\r\n\t#include <emissivemap_fragment>\r\n\r\n\t// accumulation\r\n\t#include <lights_physical_fragment>\r\n\t#include <lights_template>\r\n\r\n\t// modulation\r\n\t#include <aomap_fragment>\r\n\r\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\r\n\r\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\r\n\r\n\t#include <tonemapping_fragment>\r\n\t#include <encodings_fragment>\r\n\t#include <fog_fragment>\r\n\t#include <premultiplied_alpha_fragment>\r\n\t#include <dithering_fragment>\r\n\r\n}\r\n";

var meshphysical_vert = "#define PHYSICAL\r\n\r\nvarying vec3 vViewPosition;\r\n\r\n#ifndef FLAT_SHADED\r\n\r\n\tvarying vec3 vNormal;\r\n\r\n#endif\r\n\r\n#include <common>\r\n#include <uv_pars_vertex>\r\n#include <uv2_pars_vertex>\r\n#include <displacementmap_pars_vertex>\r\n#include <color_pars_vertex>\r\n#include <fog_pars_vertex>\r\n#include <morphtarget_pars_vertex>\r\n#include <skinning_pars_vertex>\r\n#include <shadowmap_pars_vertex>\r\n#include <logdepthbuf_pars_vertex>\r\n#include <clipping_planes_pars_vertex>\r\n\r\nvoid main() {\r\n\r\n\t#include <uv_vertex>\r\n\t#include <uv2_vertex>\r\n\t#include <color_vertex>\r\n\r\n\t#include <beginnormal_vertex>\r\n\t#include <morphnormal_vertex>\r\n\t#include <skinbase_vertex>\r\n\t#include <skinnormal_vertex>\r\n\t#include <defaultnormal_vertex>\r\n\r\n#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED\r\n\r\n\tvNormal = normalize( transformedNormal );\r\n\r\n#endif\r\n\r\n\t#include <begin_vertex>\r\n\t#include <morphtarget_vertex>\r\n\t#include <skinning_vertex>\r\n\t#include <displacementmap_vertex>\r\n\t#include <project_vertex>\r\n\t#include <logdepthbuf_vertex>\r\n\t#include <clipping_planes_vertex>\r\n\r\n\tvViewPosition = - mvPosition.xyz;\r\n\r\n\t#include <worldpos_vertex>\r\n\t#include <shadowmap_vertex>\r\n\t#include <fog_vertex>\r\n\r\n}\r\n";

var normal_frag = "#define NORMAL\r\n\r\nuniform float opacity;\r\n\r\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP )\r\n\r\n\tvarying vec3 vViewPosition;\r\n\r\n#endif\r\n\r\n#ifndef FLAT_SHADED\r\n\r\n\tvarying vec3 vNormal;\r\n\r\n#endif\r\n\r\n#include <packing>\r\n#include <uv_pars_fragment>\r\n#include <bumpmap_pars_fragment>\r\n#include <normalmap_pars_fragment>\r\n#include <logdepthbuf_pars_fragment>\r\n\r\nvoid main() {\r\n\r\n\t#include <logdepthbuf_fragment>\r\n\t#include <normal_flip>\r\n\t#include <normal_fragment>\r\n\r\n\tgl_FragColor = vec4( packNormalToRGB( normal ), opacity );\r\n\r\n}\r\n";

var normal_vert = "#define NORMAL\r\n\r\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP )\r\n\r\n\tvarying vec3 vViewPosition;\r\n\r\n#endif\r\n\r\n#ifndef FLAT_SHADED\r\n\r\n\tvarying vec3 vNormal;\r\n\r\n#endif\r\n\r\n#include <uv_pars_vertex>\r\n#include <displacementmap_pars_vertex>\r\n#include <morphtarget_pars_vertex>\r\n#include <skinning_pars_vertex>\r\n#include <logdepthbuf_pars_vertex>\r\n\r\nvoid main() {\r\n\r\n\t#include <uv_vertex>\r\n\r\n\t#include <beginnormal_vertex>\r\n\t#include <morphnormal_vertex>\r\n\t#include <skinbase_vertex>\r\n\t#include <skinnormal_vertex>\r\n\t#include <defaultnormal_vertex>\r\n\r\n#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED\r\n\r\n\tvNormal = normalize( transformedNormal );\r\n\r\n#endif\r\n\r\n\t#include <begin_vertex>\r\n\t#include <morphtarget_vertex>\r\n\t#include <skinning_vertex>\r\n\t#include <displacementmap_vertex>\r\n\t#include <project_vertex>\r\n\t#include <logdepthbuf_vertex>\r\n\r\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP )\r\n\r\n\tvViewPosition = - mvPosition.xyz;\r\n\r\n#endif\r\n\r\n}\r\n";

var points_frag = "uniform vec3 diffuse;\r\nuniform float opacity;\r\n\r\n#include <common>\r\n#include <packing>\r\n#include <color_pars_fragment>\r\n#include <map_particle_pars_fragment>\r\n#include <fog_pars_fragment>\r\n#include <shadowmap_pars_fragment>\r\n#include <logdepthbuf_pars_fragment>\r\n#include <clipping_planes_pars_fragment>\r\n\r\nvoid main() {\r\n\r\n\t#include <clipping_planes_fragment>\r\n\r\n\tvec3 outgoingLight = vec3( 0.0 );\r\n\tvec4 diffuseColor = vec4( diffuse, opacity );\r\n\r\n\t#include <logdepthbuf_fragment>\r\n\t#include <map_particle_fragment>\r\n\t#include <color_fragment>\r\n\t#include <alphatest_fragment>\r\n\r\n\toutgoingLight = diffuseColor.rgb;\r\n\r\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\r\n\r\n\t#include <premultiplied_alpha_fragment>\r\n\t#include <tonemapping_fragment>\r\n\t#include <encodings_fragment>\r\n\t#include <fog_fragment>\r\n\r\n}\r\n";

var points_vert = "uniform float size;\r\nuniform float scale;\r\n\r\n#include <common>\r\n#include <color_pars_vertex>\r\n#include <fog_pars_vertex>\r\n#include <shadowmap_pars_vertex>\r\n#include <logdepthbuf_pars_vertex>\r\n#include <clipping_planes_pars_vertex>\r\n\r\nvoid main() {\r\n\r\n\t#include <color_vertex>\r\n\t#include <begin_vertex>\r\n\t#include <project_vertex>\r\n\r\n\t#ifdef USE_SIZEATTENUATION\r\n\t\tgl_PointSize = size * ( scale / - mvPosition.z );\r\n\t#else\r\n\t\tgl_PointSize = size;\r\n\t#endif\r\n\r\n\t#include <logdepthbuf_vertex>\r\n\t#include <clipping_planes_vertex>\r\n\t#include <worldpos_vertex>\r\n\t#include <shadowmap_vertex>\r\n\t#include <fog_vertex>\r\n\r\n}\r\n";

var shadow_frag = "uniform float opacity;\r\n\r\n#include <common>\r\n#include <packing>\r\n#include <bsdfs>\r\n#include <lights_pars>\r\n#include <shadowmap_pars_fragment>\r\n#include <shadowmask_pars_fragment>\r\n\r\nvoid main() {\r\n\r\n\tgl_FragColor = vec4( 0.0, 0.0, 0.0, opacity * ( 1.0 - getShadowMask() ) );\r\n\r\n}\r\n";

var shadow_vert = "#include <shadowmap_pars_vertex>\r\n\r\nvoid main() {\r\n\r\n\t#include <begin_vertex>\r\n\t#include <project_vertex>\r\n\t#include <worldpos_vertex>\r\n\t#include <shadowmap_vertex>\r\n\r\n}\r\n";

var ShaderChunk = {
	alphamap_fragment: alphamap_fragment,
	alphamap_pars_fragment: alphamap_pars_fragment,
	alphatest_fragment: alphatest_fragment,
	aomap_fragment: aomap_fragment,
	aomap_pars_fragment: aomap_pars_fragment,
	begin_vertex: begin_vertex,
	beginnormal_vertex: beginnormal_vertex,
	bsdfs: bsdfs,
	bumpmap_pars_fragment: bumpmap_pars_fragment,
	clipping_planes_fragment: clipping_planes_fragment,
	clipping_planes_pars_fragment: clipping_planes_pars_fragment,
	clipping_planes_pars_vertex: clipping_planes_pars_vertex,
	clipping_planes_vertex: clipping_planes_vertex,
	color_fragment: color_fragment,
	color_pars_fragment: color_pars_fragment,
	color_pars_vertex: color_pars_vertex,
	color_vertex: color_vertex,
	common: common,
	cube_uv_reflection_fragment: cube_uv_reflection_fragment,
	defaultnormal_vertex: defaultnormal_vertex,
	displacementmap_pars_vertex: displacementmap_pars_vertex,
	displacementmap_vertex: displacementmap_vertex,
	emissivemap_fragment: emissivemap_fragment,
	emissivemap_pars_fragment: emissivemap_pars_fragment,
	encodings_fragment: encodings_fragment,
	encodings_pars_fragment: encodings_pars_fragment,
	envmap_fragment: envmap_fragment,
	envmap_pars_fragment: envmap_pars_fragment,
	envmap_pars_vertex: envmap_pars_vertex,
	envmap_vertex: envmap_vertex,
	fog_vertex: fog_vertex,
	fog_pars_vertex: fog_pars_vertex,
	fog_fragment: fog_fragment,
	fog_pars_fragment: fog_pars_fragment,
	gradientmap_pars_fragment: gradientmap_pars_fragment,
	lightmap_fragment: lightmap_fragment,
	lightmap_pars_fragment: lightmap_pars_fragment,
	lights_lambert_vertex: lights_lambert_vertex,
	lights_pars: lights_pars,
	lights_phong_fragment: lights_phong_fragment,
	lights_phong_pars_fragment: lights_phong_pars_fragment,
	lights_physical_fragment: lights_physical_fragment,
	lights_physical_pars_fragment: lights_physical_pars_fragment,
	lights_template: lights_template,
	logdepthbuf_fragment: logdepthbuf_fragment,
	logdepthbuf_pars_fragment: logdepthbuf_pars_fragment,
	logdepthbuf_pars_vertex: logdepthbuf_pars_vertex,
	logdepthbuf_vertex: logdepthbuf_vertex,
	map_fragment: map_fragment,
	map_pars_fragment: map_pars_fragment,
	map_particle_fragment: map_particle_fragment,
	map_particle_pars_fragment: map_particle_pars_fragment,
	metalnessmap_fragment: metalnessmap_fragment,
	metalnessmap_pars_fragment: metalnessmap_pars_fragment,
	morphnormal_vertex: morphnormal_vertex,
	morphtarget_pars_vertex: morphtarget_pars_vertex,
	morphtarget_vertex: morphtarget_vertex,
	normal_flip: normal_flip,
	normal_fragment: normal_fragment,
	normalmap_pars_fragment: normalmap_pars_fragment,
	packing: packing,
	premultiplied_alpha_fragment: premultiplied_alpha_fragment,
	project_vertex: project_vertex,
	dithering_fragment: dithering_fragment,
	dithering_pars_fragment: dithering_pars_fragment,
	roughnessmap_fragment: roughnessmap_fragment,
	roughnessmap_pars_fragment: roughnessmap_pars_fragment,
	shadowmap_pars_fragment: shadowmap_pars_fragment,
	shadowmap_pars_vertex: shadowmap_pars_vertex,
	shadowmap_vertex: shadowmap_vertex,
	shadowmask_pars_fragment: shadowmask_pars_fragment,
	skinbase_vertex: skinbase_vertex,
	skinning_pars_vertex: skinning_pars_vertex,
	skinning_vertex: skinning_vertex,
	skinnormal_vertex: skinnormal_vertex,
	specularmap_fragment: specularmap_fragment,
	specularmap_pars_fragment: specularmap_pars_fragment,
	tonemapping_fragment: tonemapping_fragment,
	tonemapping_pars_fragment: tonemapping_pars_fragment,
	uv_pars_fragment: uv_pars_fragment,
	uv_pars_vertex: uv_pars_vertex,
	uv_vertex: uv_vertex,
	uv2_pars_fragment: uv2_pars_fragment,
	uv2_pars_vertex: uv2_pars_vertex,
	uv2_vertex: uv2_vertex,
	worldpos_vertex: worldpos_vertex,

	cube_frag: cube_frag,
	cube_vert: cube_vert,
	depth_frag: depth_frag,
	depth_vert: depth_vert,
	distanceRGBA_frag: distanceRGBA_frag,
	distanceRGBA_vert: distanceRGBA_vert,
	equirect_frag: equirect_frag,
	equirect_vert: equirect_vert,
	linedashed_frag: linedashed_frag,
	linedashed_vert: linedashed_vert,
	meshbasic_frag: meshbasic_frag,
	meshbasic_vert: meshbasic_vert,
	meshlambert_frag: meshlambert_frag,
	meshlambert_vert: meshlambert_vert,
	meshphong_frag: meshphong_frag,
	meshphong_vert: meshphong_vert,
	meshphysical_frag: meshphysical_frag,
	meshphysical_vert: meshphysical_vert,
	normal_frag: normal_frag,
	normal_vert: normal_vert,
	points_frag: points_frag,
	points_vert: points_vert,
	shadow_frag: shadow_frag,
	shadow_vert: shadow_vert
};

/**
 * @author alteredq / http://alteredqualia.com/
 * @author mrdoob / http://mrdoob.com/
 * @author mikael emtinger / http://gomo.se/
 */

var ShaderLib = {

	basic: {

		uniforms: UniformsUtils.merge( [
			UniformsLib.common,
			UniformsLib.aomap,
			UniformsLib.lightmap,
			UniformsLib.fog
		] ),

		vertexShader: ShaderChunk.meshbasic_vert,
		fragmentShader: ShaderChunk.meshbasic_frag

	},

	lambert: {

		uniforms: UniformsUtils.merge( [
			UniformsLib.common,
			UniformsLib.aomap,
			UniformsLib.lightmap,
			UniformsLib.emissivemap,
			UniformsLib.fog,
			UniformsLib.lights,
			{
				emissive: { value: new Color( 0x000000 ) }
			}
		] ),

		vertexShader: ShaderChunk.meshlambert_vert,
		fragmentShader: ShaderChunk.meshlambert_frag

	},

	phong: {

		uniforms: UniformsUtils.merge( [
			UniformsLib.common,
			UniformsLib.aomap,
			UniformsLib.lightmap,
			UniformsLib.emissivemap,
			UniformsLib.bumpmap,
			UniformsLib.normalmap,
			UniformsLib.displacementmap,
			UniformsLib.gradientmap,
			UniformsLib.fog,
			UniformsLib.lights,
			{
				emissive: { value: new Color( 0x000000 ) },
				specular: { value: new Color( 0x111111 ) },
				shininess: { value: 30 }
			}
		] ),

		vertexShader: ShaderChunk.meshphong_vert,
		fragmentShader: ShaderChunk.meshphong_frag

	},

	standard: {

		uniforms: UniformsUtils.merge( [
			UniformsLib.common,
			UniformsLib.aomap,
			UniformsLib.lightmap,
			UniformsLib.emissivemap,
			UniformsLib.bumpmap,
			UniformsLib.normalmap,
			UniformsLib.displacementmap,
			UniformsLib.roughnessmap,
			UniformsLib.metalnessmap,
			UniformsLib.fog,
			UniformsLib.lights,
			{
				emissive: { value: new Color( 0x000000 ) },
				roughness: { value: 0.5 },
				metalness: { value: 0.5 },
				envMapIntensity: { value: 1 } // temporary
			}
		] ),

		vertexShader: ShaderChunk.meshphysical_vert,
		fragmentShader: ShaderChunk.meshphysical_frag

	},

	points: {

		uniforms: UniformsUtils.merge( [
			UniformsLib.points,
			UniformsLib.fog
		] ),

		vertexShader: ShaderChunk.points_vert,
		fragmentShader: ShaderChunk.points_frag

	},

	dashed: {

		uniforms: UniformsUtils.merge( [
			UniformsLib.common,
			UniformsLib.fog,
			{
				scale: { value: 1 },
				dashSize: { value: 1 },
				totalSize: { value: 2 }
			}
		] ),

		vertexShader: ShaderChunk.linedashed_vert,
		fragmentShader: ShaderChunk.linedashed_frag

	},

	depth: {

		uniforms: UniformsUtils.merge( [
			UniformsLib.common,
			UniformsLib.displacementmap
		] ),

		vertexShader: ShaderChunk.depth_vert,
		fragmentShader: ShaderChunk.depth_frag

	},

	normal: {

		uniforms: UniformsUtils.merge( [
			UniformsLib.common,
			UniformsLib.bumpmap,
			UniformsLib.normalmap,
			UniformsLib.displacementmap,
			{
				opacity: { value: 1.0 }
			}
		] ),

		vertexShader: ShaderChunk.normal_vert,
		fragmentShader: ShaderChunk.normal_frag

	},

	/* -------------------------------------------------------------------------
	//	Cube map shader
	 ------------------------------------------------------------------------- */

	cube: {

		uniforms: {
			tCube: { value: null },
			tFlip: { value: - 1 },
			opacity: { value: 1.0 }
		},

		vertexShader: ShaderChunk.cube_vert,
		fragmentShader: ShaderChunk.cube_frag

	},

	/* -------------------------------------------------------------------------
	//	Cube map shader
	 ------------------------------------------------------------------------- */

	equirect: {

		uniforms: {
			tEquirect: { value: null },
			tFlip: { value: - 1 }
		},

		vertexShader: ShaderChunk.equirect_vert,
		fragmentShader: ShaderChunk.equirect_frag

	},

	distanceRGBA: {

		uniforms: {
			lightPos: { value: new Vector3() }
		},

		vertexShader: ShaderChunk.distanceRGBA_vert,
		fragmentShader: ShaderChunk.distanceRGBA_frag

	}

};

ShaderLib.physical = {

	uniforms: UniformsUtils.merge( [
		ShaderLib.standard.uniforms,
		{
			clearCoat: { value: 0 },
			clearCoatRoughness: { value: 0 }
		}
	] ),

	vertexShader: ShaderChunk.meshphysical_vert,
	fragmentShader: ShaderChunk.meshphysical_frag

};

/**
 * @author bhouston / http://clara.io
 */

function Box2( min, max ) {

	this.min = ( min !== undefined ) ? min : new Vector2( + Infinity, + Infinity );
	this.max = ( max !== undefined ) ? max : new Vector2( - Infinity, - Infinity );

}

Object.assign( Box2.prototype, {

	set: function ( min, max ) {

		this.min.copy( min );
		this.max.copy( max );

		return this;

	},

	setFromPoints: function ( points ) {

		this.makeEmpty();

		for ( var i = 0, il = points.length; i < il; i ++ ) {

			this.expandByPoint( points[ i ] );

		}

		return this;

	},

	setFromCenterAndSize: function () {

		var v1 = new Vector2();

		return function setFromCenterAndSize( center, size ) {

			var halfSize = v1.copy( size ).multiplyScalar( 0.5 );
			this.min.copy( center ).sub( halfSize );
			this.max.copy( center ).add( halfSize );

			return this;

		};

	}(),

	clone: function () {

		return new this.constructor().copy( this );

	},

	copy: function ( box ) {

		this.min.copy( box.min );
		this.max.copy( box.max );

		return this;

	},

	makeEmpty: function () {

		this.min.x = this.min.y = + Infinity;
		this.max.x = this.max.y = - Infinity;

		return this;

	},

	isEmpty: function () {

		// this is a more robust check for empty than ( volume <= 0 ) because volume can get positive with two negative axes

		return ( this.max.x < this.min.x ) || ( this.max.y < this.min.y );

	},

	getCenter: function ( optionalTarget ) {

		var result = optionalTarget || new Vector2();
		return this.isEmpty() ? result.set( 0, 0 ) : result.addVectors( this.min, this.max ).multiplyScalar( 0.5 );

	},

	getSize: function ( optionalTarget ) {

		var result = optionalTarget || new Vector2();
		return this.isEmpty() ? result.set( 0, 0 ) : result.subVectors( this.max, this.min );

	},

	expandByPoint: function ( point ) {

		this.min.min( point );
		this.max.max( point );

		return this;

	},

	expandByVector: function ( vector ) {

		this.min.sub( vector );
		this.max.add( vector );

		return this;

	},

	expandByScalar: function ( scalar ) {

		this.min.addScalar( - scalar );
		this.max.addScalar( scalar );

		return this;

	},

	containsPoint: function ( point ) {

		return point.x < this.min.x || point.x > this.max.x ||
			point.y < this.min.y || point.y > this.max.y ? false : true;

	},

	containsBox: function ( box ) {

		return this.min.x <= box.min.x && box.max.x <= this.max.x &&
			this.min.y <= box.min.y && box.max.y <= this.max.y;

	},

	getParameter: function ( point, optionalTarget ) {

		// This can potentially have a divide by zero if the box
		// has a size dimension of 0.

		var result = optionalTarget || new Vector2();

		return result.set(
			( point.x - this.min.x ) / ( this.max.x - this.min.x ),
			( point.y - this.min.y ) / ( this.max.y - this.min.y )
		);

	},

	intersectsBox: function ( box ) {

		// using 4 splitting planes to rule out intersections

		return box.max.x < this.min.x || box.min.x > this.max.x ||
			box.max.y < this.min.y || box.min.y > this.max.y ? false : true;

	},

	clampPoint: function ( point, optionalTarget ) {

		var result = optionalTarget || new Vector2();
		return result.copy( point ).clamp( this.min, this.max );

	},

	distanceToPoint: function () {

		var v1 = new Vector2();

		return function distanceToPoint( point ) {

			var clampedPoint = v1.copy( point ).clamp( this.min, this.max );
			return clampedPoint.sub( point ).length();

		};

	}(),

	intersect: function ( box ) {

		this.min.max( box.min );
		this.max.min( box.max );

		return this;

	},

	union: function ( box ) {

		this.min.min( box.min );
		this.max.max( box.max );

		return this;

	},

	translate: function ( offset ) {

		this.min.add( offset );
		this.max.add( offset );

		return this;

	},

	equals: function ( box ) {

		return box.min.equals( this.min ) && box.max.equals( this.max );

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 */

var materialId = 0;

function Material() {

	Object.defineProperty( this, 'id', { value: materialId ++ } );

	this.uuid = _Math.generateUUID();

	this.name = '';
	this.type = 'Material';

	this.fog = true;
	this.lights = true;

	this.blending = NormalBlending;
	this.side = FrontSide;
	this.shading = SmoothShading; // THREE.FlatShading, THREE.SmoothShading
	this.vertexColors = NoColors; // THREE.NoColors, THREE.VertexColors, THREE.FaceColors

	this.opacity = 1;
	this.transparent = false;

	this.blendSrc = SrcAlphaFactor;
	this.blendDst = OneMinusSrcAlphaFactor;
	this.blendEquation = AddEquation;
	this.blendSrcAlpha = null;
	this.blendDstAlpha = null;
	this.blendEquationAlpha = null;

	this.depthFunc = LessEqualDepth;
	this.depthTest = true;
	this.depthWrite = true;

	this.clippingPlanes = null;
	this.clipIntersection = false;
	this.clipShadows = false;

	this.colorWrite = true;

	this.precision = null; // override the renderer's default precision for this material

	this.polygonOffset = false;
	this.polygonOffsetFactor = 0;
	this.polygonOffsetUnits = 0;

	this.dithering = false;

	this.alphaTest = 0;
	this.premultipliedAlpha = false;

	this.overdraw = 0; // Overdrawn pixels (typically between 0 and 1) for fixing antialiasing gaps in CanvasRenderer

	this.visible = true;

	this.needsUpdate = true;

}

Object.assign( Material.prototype, EventDispatcher.prototype, {

	isMaterial: true,

	onBeforeCompile: function () {},

	setValues: function ( values ) {

		if ( values === undefined ) return;

		for ( var key in values ) {

			var newValue = values[ key ];

			if ( newValue === undefined ) {

				console.warn( "THREE.Material: '" + key + "' parameter is undefined." );
				continue;

			}

			var currentValue = this[ key ];

			if ( currentValue === undefined ) {

				console.warn( "THREE." + this.type + ": '" + key + "' is not a property of this material." );
				continue;

			}

			if ( currentValue && currentValue.isColor ) {

				currentValue.set( newValue );

			} else if ( ( currentValue && currentValue.isVector3 ) && ( newValue && newValue.isVector3 ) ) {

				currentValue.copy( newValue );

			} else if ( key === 'overdraw' ) {

				// ensure overdraw is backwards-compatible with legacy boolean type
				this[ key ] = Number( newValue );

			} else {

				this[ key ] = newValue;

			}

		}

	},

	toJSON: function ( meta ) {

		var isRoot = meta === undefined;

		if ( isRoot ) {

			meta = {
				textures: {},
				images: {}
			};

		}

		var data = {
			metadata: {
				version: 4.5,
				type: 'Material',
				generator: 'Material.toJSON'
			}
		};

		// standard Material serialization
		data.uuid = this.uuid;
		data.type = this.type;

		if ( this.name !== '' ) data.name = this.name;

		if ( this.color && this.color.isColor ) data.color = this.color.getHex();

		if ( this.roughness !== undefined ) data.roughness = this.roughness;
		if ( this.metalness !== undefined ) data.metalness = this.metalness;

		if ( this.emissive && this.emissive.isColor ) data.emissive = this.emissive.getHex();
		if ( this.specular && this.specular.isColor ) data.specular = this.specular.getHex();
		if ( this.shininess !== undefined ) data.shininess = this.shininess;
		if ( this.clearCoat !== undefined ) data.clearCoat = this.clearCoat;
		if ( this.clearCoatRoughness !== undefined ) data.clearCoatRoughness = this.clearCoatRoughness;

		if ( this.map && this.map.isTexture ) data.map = this.map.toJSON( meta ).uuid;
		if ( this.alphaMap && this.alphaMap.isTexture ) data.alphaMap = this.alphaMap.toJSON( meta ).uuid;
		if ( this.lightMap && this.lightMap.isTexture ) data.lightMap = this.lightMap.toJSON( meta ).uuid;
		if ( this.bumpMap && this.bumpMap.isTexture ) {

			data.bumpMap = this.bumpMap.toJSON( meta ).uuid;
			data.bumpScale = this.bumpScale;

		}
		if ( this.normalMap && this.normalMap.isTexture ) {

			data.normalMap = this.normalMap.toJSON( meta ).uuid;
			data.normalScale = this.normalScale.toArray();

		}
		if ( this.displacementMap && this.displacementMap.isTexture ) {

			data.displacementMap = this.displacementMap.toJSON( meta ).uuid;
			data.displacementScale = this.displacementScale;
			data.displacementBias = this.displacementBias;

		}
		if ( this.roughnessMap && this.roughnessMap.isTexture ) data.roughnessMap = this.roughnessMap.toJSON( meta ).uuid;
		if ( this.metalnessMap && this.metalnessMap.isTexture ) data.metalnessMap = this.metalnessMap.toJSON( meta ).uuid;

		if ( this.emissiveMap && this.emissiveMap.isTexture ) data.emissiveMap = this.emissiveMap.toJSON( meta ).uuid;
		if ( this.specularMap && this.specularMap.isTexture ) data.specularMap = this.specularMap.toJSON( meta ).uuid;

		if ( this.envMap && this.envMap.isTexture ) {

			data.envMap = this.envMap.toJSON( meta ).uuid;
			data.reflectivity = this.reflectivity; // Scale behind envMap

		}

		if ( this.gradientMap && this.gradientMap.isTexture ) {

			data.gradientMap = this.gradientMap.toJSON( meta ).uuid;

		}

		if ( this.size !== undefined ) data.size = this.size;
		if ( this.sizeAttenuation !== undefined ) data.sizeAttenuation = this.sizeAttenuation;

		if ( this.blending !== NormalBlending ) data.blending = this.blending;
		if ( this.shading !== SmoothShading ) data.shading = this.shading;
		if ( this.side !== FrontSide ) data.side = this.side;
		if ( this.vertexColors !== NoColors ) data.vertexColors = this.vertexColors;

		if ( this.opacity < 1 ) data.opacity = this.opacity;
		if ( this.transparent === true ) data.transparent = this.transparent;

		data.depthFunc = this.depthFunc;
		data.depthTest = this.depthTest;
		data.depthWrite = this.depthWrite;

		if ( this.alphaTest > 0 ) data.alphaTest = this.alphaTest;
		if ( this.premultipliedAlpha === true ) data.premultipliedAlpha = this.premultipliedAlpha;
		if ( this.wireframe === true ) data.wireframe = this.wireframe;
		if ( this.wireframeLinewidth > 1 ) data.wireframeLinewidth = this.wireframeLinewidth;
		if ( this.wireframeLinecap !== 'round' ) data.wireframeLinecap = this.wireframeLinecap;
		if ( this.wireframeLinejoin !== 'round' ) data.wireframeLinejoin = this.wireframeLinejoin;

		data.skinning = this.skinning;
		data.morphTargets = this.morphTargets;

		data.dithering = this.dithering;

		// TODO: Copied from Object3D.toJSON

		function extractFromCache( cache ) {

			var values = [];

			for ( var key in cache ) {

				var data = cache[ key ];
				delete data.metadata;
				values.push( data );

			}

			return values;

		}

		if ( isRoot ) {

			var textures = extractFromCache( meta.textures );
			var images = extractFromCache( meta.images );

			if ( textures.length > 0 ) data.textures = textures;
			if ( images.length > 0 ) data.images = images;

		}

		return data;

	},

	clone: function () {

		return new this.constructor().copy( this );

	},

	copy: function ( source ) {

		this.name = source.name;

		this.fog = source.fog;
		this.lights = source.lights;

		this.blending = source.blending;
		this.side = source.side;
		this.shading = source.shading;
		this.vertexColors = source.vertexColors;

		this.opacity = source.opacity;
		this.transparent = source.transparent;

		this.blendSrc = source.blendSrc;
		this.blendDst = source.blendDst;
		this.blendEquation = source.blendEquation;
		this.blendSrcAlpha = source.blendSrcAlpha;
		this.blendDstAlpha = source.blendDstAlpha;
		this.blendEquationAlpha = source.blendEquationAlpha;

		this.depthFunc = source.depthFunc;
		this.depthTest = source.depthTest;
		this.depthWrite = source.depthWrite;

		this.colorWrite = source.colorWrite;

		this.precision = source.precision;

		this.polygonOffset = source.polygonOffset;
		this.polygonOffsetFactor = source.polygonOffsetFactor;
		this.polygonOffsetUnits = source.polygonOffsetUnits;

		this.dithering = source.dithering;

		this.alphaTest = source.alphaTest;

		this.premultipliedAlpha = source.premultipliedAlpha;

		this.overdraw = source.overdraw;

		this.visible = source.visible;
		this.clipShadows = source.clipShadows;
		this.clipIntersection = source.clipIntersection;

		var srcPlanes = source.clippingPlanes,
			dstPlanes = null;

		if ( srcPlanes !== null ) {

			var n = srcPlanes.length;
			dstPlanes = new Array( n );

			for ( var i = 0; i !== n; ++ i )
				dstPlanes[ i ] = srcPlanes[ i ].clone();

		}

		this.clippingPlanes = dstPlanes;

		return this;

	},

	dispose: function () {

		this.dispatchEvent( { type: 'dispose' } );

	}

} );

/**
 * @author alteredq / http://alteredqualia.com/
 *
 * parameters = {
 *  defines: { "label" : "value" },
 *  uniforms: { "parameter1": { value: 1.0 }, "parameter2": { value2: 2 } },
 *
 *  fragmentShader: <string>,
 *  vertexShader: <string>,
 *
 *  wireframe: <boolean>,
 *  wireframeLinewidth: <float>,
 *
 *  lights: <bool>,
 *
 *  skinning: <bool>,
 *  morphTargets: <bool>,
 *  morphNormals: <bool>
 * }
 */

function ShaderMaterial( parameters ) {

	Material.call( this );

	this.type = 'ShaderMaterial';

	this.defines = {};
	this.uniforms = {};

	this.vertexShader = 'void main() {\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}';
	this.fragmentShader = 'void main() {\n\tgl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );\n}';

	this.linewidth = 1;

	this.wireframe = false;
	this.wireframeLinewidth = 1;

	this.fog = false; // set to use scene fog
	this.lights = false; // set to use scene lights
	this.clipping = false; // set to use user-defined clipping planes

	this.skinning = false; // set to use skinning attribute streams
	this.morphTargets = false; // set to use morph targets
	this.morphNormals = false; // set to use morph normals

	this.extensions = {
		derivatives: false, // set to use derivatives
		fragDepth: false, // set to use fragment depth values
		drawBuffers: false, // set to use draw buffers
		shaderTextureLOD: false // set to use shader texture LOD
	};

	// When rendered geometry doesn't include these attributes but the material does,
	// use these default values in WebGL. This avoids errors when buffer data is missing.
	this.defaultAttributeValues = {
		'color': [ 1, 1, 1 ],
		'uv': [ 0, 0 ],
		'uv2': [ 0, 0 ]
	};

	this.index0AttributeName = undefined;

	if ( parameters !== undefined ) {

		if ( parameters.attributes !== undefined ) {

			console.error( 'THREE.ShaderMaterial: attributes should now be defined in THREE.BufferGeometry instead.' );

		}

		this.setValues( parameters );

	}

}

ShaderMaterial.prototype = Object.create( Material.prototype );
ShaderMaterial.prototype.constructor = ShaderMaterial;

ShaderMaterial.prototype.isShaderMaterial = true;

ShaderMaterial.prototype.copy = function ( source ) {

	Material.prototype.copy.call( this, source );

	this.fragmentShader = source.fragmentShader;
	this.vertexShader = source.vertexShader;

	this.uniforms = UniformsUtils.clone( source.uniforms );

	this.defines = source.defines;

	this.wireframe = source.wireframe;
	this.wireframeLinewidth = source.wireframeLinewidth;

	this.lights = source.lights;
	this.clipping = source.clipping;

	this.skinning = source.skinning;

	this.morphTargets = source.morphTargets;
	this.morphNormals = source.morphNormals;

	this.extensions = source.extensions;

	return this;

};

ShaderMaterial.prototype.toJSON = function ( meta ) {

	var data = Material.prototype.toJSON.call( this, meta );

	data.uniforms = this.uniforms;
	data.vertexShader = this.vertexShader;
	data.fragmentShader = this.fragmentShader;

	return data;

};

/**
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author bhouston / http://clara.io
 * @author tschw
 */

function Matrix3() {

	this.elements = [

		1, 0, 0,
		0, 1, 0,
		0, 0, 1

	];

	if ( arguments.length > 0 ) {

		console.error( 'THREE.Matrix3: the constructor no longer reads arguments. use .set() instead.' );

	}

}

Object.assign( Matrix3.prototype, {

	isMatrix3: true,

	set: function ( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

		var te = this.elements;

		te[ 0 ] = n11; te[ 1 ] = n21; te[ 2 ] = n31;
		te[ 3 ] = n12; te[ 4 ] = n22; te[ 5 ] = n32;
		te[ 6 ] = n13; te[ 7 ] = n23; te[ 8 ] = n33;

		return this;

	},

	identity: function () {

		this.set(

			1, 0, 0,
			0, 1, 0,
			0, 0, 1

		);

		return this;

	},

	clone: function () {

		return new this.constructor().fromArray( this.elements );

	},

	copy: function ( m ) {

		var te = this.elements;
		var me = m.elements;

		te[ 0 ] = me[ 0 ]; te[ 1 ] = me[ 1 ]; te[ 2 ] = me[ 2 ];
		te[ 3 ] = me[ 3 ]; te[ 4 ] = me[ 4 ]; te[ 5 ] = me[ 5 ];
		te[ 6 ] = me[ 6 ]; te[ 7 ] = me[ 7 ]; te[ 8 ] = me[ 8 ];

		return this;

	},

	setFromMatrix4: function ( m ) {

		var me = m.elements;

		this.set(

			me[ 0 ], me[ 4 ], me[  8 ],
			me[ 1 ], me[ 5 ], me[  9 ],
			me[ 2 ], me[ 6 ], me[ 10 ]

		);

		return this;

	},

	applyToBufferAttribute: function () {

		var v1 = new Vector3();

		return function applyToBufferAttribute( attribute ) {

			for ( var i = 0, l = attribute.count; i < l; i ++ ) {

				v1.x = attribute.getX( i );
				v1.y = attribute.getY( i );
				v1.z = attribute.getZ( i );

				v1.applyMatrix3( this );

				attribute.setXYZ( i, v1.x, v1.y, v1.z );

			}

			return attribute;

		};

	}(),

	multiply: function ( m ) {

		return this.multiplyMatrices( this, m );

	},

	premultiply: function ( m ) {

		return this.multiplyMatrices( m, this );

	},

	multiplyMatrices: function ( a, b ) {

		var ae = a.elements;
		var be = b.elements;
		var te = this.elements;

		var a11 = ae[ 0 ], a12 = ae[ 3 ], a13 = ae[ 6 ];
		var a21 = ae[ 1 ], a22 = ae[ 4 ], a23 = ae[ 7 ];
		var a31 = ae[ 2 ], a32 = ae[ 5 ], a33 = ae[ 8 ];

		var b11 = be[ 0 ], b12 = be[ 3 ], b13 = be[ 6 ];
		var b21 = be[ 1 ], b22 = be[ 4 ], b23 = be[ 7 ];
		var b31 = be[ 2 ], b32 = be[ 5 ], b33 = be[ 8 ];

		te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31;
		te[ 3 ] = a11 * b12 + a12 * b22 + a13 * b32;
		te[ 6 ] = a11 * b13 + a12 * b23 + a13 * b33;

		te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31;
		te[ 4 ] = a21 * b12 + a22 * b22 + a23 * b32;
		te[ 7 ] = a21 * b13 + a22 * b23 + a23 * b33;

		te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31;
		te[ 5 ] = a31 * b12 + a32 * b22 + a33 * b32;
		te[ 8 ] = a31 * b13 + a32 * b23 + a33 * b33;

		return this;

	},

	multiplyScalar: function ( s ) {

		var te = this.elements;

		te[ 0 ] *= s; te[ 3 ] *= s; te[ 6 ] *= s;
		te[ 1 ] *= s; te[ 4 ] *= s; te[ 7 ] *= s;
		te[ 2 ] *= s; te[ 5 ] *= s; te[ 8 ] *= s;

		return this;

	},

	determinant: function () {

		var te = this.elements;

		var a = te[ 0 ], b = te[ 1 ], c = te[ 2 ],
			d = te[ 3 ], e = te[ 4 ], f = te[ 5 ],
			g = te[ 6 ], h = te[ 7 ], i = te[ 8 ];

		return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;

	},

	getInverse: function ( matrix, throwOnDegenerate ) {

		if ( matrix && matrix.isMatrix4 ) {

			console.error( "THREE.Matrix3.getInverse no longer takes a Matrix4 argument." );

		}

		var me = matrix.elements,
			te = this.elements,

			n11 = me[ 0 ], n21 = me[ 1 ], n31 = me[ 2 ],
			n12 = me[ 3 ], n22 = me[ 4 ], n32 = me[ 5 ],
			n13 = me[ 6 ], n23 = me[ 7 ], n33 = me[ 8 ],

			t11 = n33 * n22 - n32 * n23,
			t12 = n32 * n13 - n33 * n12,
			t13 = n23 * n12 - n22 * n13,

			det = n11 * t11 + n21 * t12 + n31 * t13;

		if ( det === 0 ) {

			var msg = "THREE.Matrix3.getInverse(): can't invert matrix, determinant is 0";

			if ( throwOnDegenerate === true ) {

				throw new Error( msg );

			} else {

				console.warn( msg );

			}

			return this.identity();

		}

		var detInv = 1 / det;

		te[ 0 ] = t11 * detInv;
		te[ 1 ] = ( n31 * n23 - n33 * n21 ) * detInv;
		te[ 2 ] = ( n32 * n21 - n31 * n22 ) * detInv;

		te[ 3 ] = t12 * detInv;
		te[ 4 ] = ( n33 * n11 - n31 * n13 ) * detInv;
		te[ 5 ] = ( n31 * n12 - n32 * n11 ) * detInv;

		te[ 6 ] = t13 * detInv;
		te[ 7 ] = ( n21 * n13 - n23 * n11 ) * detInv;
		te[ 8 ] = ( n22 * n11 - n21 * n12 ) * detInv;

		return this;

	},

	transpose: function () {

		var tmp, m = this.elements;

		tmp = m[ 1 ]; m[ 1 ] = m[ 3 ]; m[ 3 ] = tmp;
		tmp = m[ 2 ]; m[ 2 ] = m[ 6 ]; m[ 6 ] = tmp;
		tmp = m[ 5 ]; m[ 5 ] = m[ 7 ]; m[ 7 ] = tmp;

		return this;

	},

	getNormalMatrix: function ( matrix4 ) {

		return this.setFromMatrix4( matrix4 ).getInverse( this ).transpose();

	},

	transposeIntoArray: function ( r ) {

		var m = this.elements;

		r[ 0 ] = m[ 0 ];
		r[ 1 ] = m[ 3 ];
		r[ 2 ] = m[ 6 ];
		r[ 3 ] = m[ 1 ];
		r[ 4 ] = m[ 4 ];
		r[ 5 ] = m[ 7 ];
		r[ 6 ] = m[ 2 ];
		r[ 7 ] = m[ 5 ];
		r[ 8 ] = m[ 8 ];

		return this;

	},

	equals: function ( matrix ) {

		var te = this.elements;
		var me = matrix.elements;

		for ( var i = 0; i < 9; i ++ ) {

			if ( te[ i ] !== me[ i ] ) return false;

		}

		return true;

	},

	fromArray: function ( array, offset ) {

		if ( offset === undefined ) offset = 0;

		for ( var i = 0; i < 9; i ++ ) {

			this.elements[ i ] = array[ i + offset ];

		}

		return this;

	},

	toArray: function ( array, offset ) {

		if ( array === undefined ) array = [];
		if ( offset === undefined ) offset = 0;

		var te = this.elements;

		array[ offset ] = te[ 0 ];
		array[ offset + 1 ] = te[ 1 ];
		array[ offset + 2 ] = te[ 2 ];

		array[ offset + 3 ] = te[ 3 ];
		array[ offset + 4 ] = te[ 4 ];
		array[ offset + 5 ] = te[ 5 ];

		array[ offset + 6 ] = te[ 6 ];
		array[ offset + 7 ] = te[ 7 ];
		array[ offset + 8 ] = te[ 8 ];

		return array;

	}

} );

/**
 * @author bhouston / http://clara.io
 */

function Plane( normal, constant ) {

	this.normal = ( normal !== undefined ) ? normal : new Vector3( 1, 0, 0 );
	this.constant = ( constant !== undefined ) ? constant : 0;

}

Object.assign( Plane.prototype, {

	set: function ( normal, constant ) {

		this.normal.copy( normal );
		this.constant = constant;

		return this;

	},

	setComponents: function ( x, y, z, w ) {

		this.normal.set( x, y, z );
		this.constant = w;

		return this;

	},

	setFromNormalAndCoplanarPoint: function ( normal, point ) {

		this.normal.copy( normal );
		this.constant = - point.dot( this.normal );	// must be this.normal, not normal, as this.normal is normalized

		return this;

	},

	setFromCoplanarPoints: function () {

		var v1 = new Vector3();
		var v2 = new Vector3();

		return function setFromCoplanarPoints( a, b, c ) {

			var normal = v1.subVectors( c, b ).cross( v2.subVectors( a, b ) ).normalize();

			// Q: should an error be thrown if normal is zero (e.g. degenerate plane)?

			this.setFromNormalAndCoplanarPoint( normal, a );

			return this;

		};

	}(),

	clone: function () {

		return new this.constructor().copy( this );

	},

	copy: function ( plane ) {

		this.normal.copy( plane.normal );
		this.constant = plane.constant;

		return this;

	},

	normalize: function () {

		// Note: will lead to a divide by zero if the plane is invalid.

		var inverseNormalLength = 1.0 / this.normal.length();
		this.normal.multiplyScalar( inverseNormalLength );
		this.constant *= inverseNormalLength;

		return this;

	},

	negate: function () {

		this.constant *= - 1;
		this.normal.negate();

		return this;

	},

	distanceToPoint: function ( point ) {

		return this.normal.dot( point ) + this.constant;

	},

	distanceToSphere: function ( sphere ) {

		return this.distanceToPoint( sphere.center ) - sphere.radius;

	},

	projectPoint: function ( point, optionalTarget ) {

		return this.orthoPoint( point, optionalTarget ).sub( point ).negate();

	},

	orthoPoint: function ( point, optionalTarget ) {

		var perpendicularMagnitude = this.distanceToPoint( point );

		var result = optionalTarget || new Vector3();
		return result.copy( this.normal ).multiplyScalar( perpendicularMagnitude );

	},

	intersectLine: function () {

		var v1 = new Vector3();

		return function intersectLine( line, optionalTarget ) {

			var result = optionalTarget || new Vector3();

			var direction = line.delta( v1 );

			var denominator = this.normal.dot( direction );

			if ( denominator === 0 ) {

				// line is coplanar, return origin
				if ( this.distanceToPoint( line.start ) === 0 ) {

					return result.copy( line.start );

				}

				// Unsure if this is the correct method to handle this case.
				return undefined;

			}

			var t = - ( line.start.dot( this.normal ) + this.constant ) / denominator;

			if ( t < 0 || t > 1 ) {

				return undefined;

			}

			return result.copy( direction ).multiplyScalar( t ).add( line.start );

		};

	}(),

	intersectsLine: function ( line ) {

		// Note: this tests if a line intersects the plane, not whether it (or its end-points) are coplanar with it.

		var startSign = this.distanceToPoint( line.start );
		var endSign = this.distanceToPoint( line.end );

		return ( startSign < 0 && endSign > 0 ) || ( endSign < 0 && startSign > 0 );

	},

	intersectsBox: function ( box ) {

		return box.intersectsPlane( this );

	},

	intersectsSphere: function ( sphere ) {

		return sphere.intersectsPlane( this );

	},

	coplanarPoint: function ( optionalTarget ) {

		var result = optionalTarget || new Vector3();
		return result.copy( this.normal ).multiplyScalar( - this.constant );

	},

	applyMatrix4: function () {

		var v1 = new Vector3();
		var m1 = new Matrix3();

		return function applyMatrix4( matrix, optionalNormalMatrix ) {

			var referencePoint = this.coplanarPoint( v1 ).applyMatrix4( matrix );

			// transform normal based on theory here:
			// http://www.songho.ca/opengl/gl_normaltransform.html
			var normalMatrix = optionalNormalMatrix || m1.getNormalMatrix( matrix );
			var normal = this.normal.applyMatrix3( normalMatrix ).normalize();

			// recalculate constant (like in setFromNormalAndCoplanarPoint)
			this.constant = - referencePoint.dot( normal );

			return this;

		};

	}(),

	translate: function ( offset ) {

		this.constant = this.constant - offset.dot( this.normal );

		return this;

	},

	equals: function ( plane ) {

		return plane.normal.equals( this.normal ) && ( plane.constant === this.constant );

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author bhouston / http://clara.io
 */

function Frustum( p0, p1, p2, p3, p4, p5 ) {

	this.planes = [

		( p0 !== undefined ) ? p0 : new Plane(),
		( p1 !== undefined ) ? p1 : new Plane(),
		( p2 !== undefined ) ? p2 : new Plane(),
		( p3 !== undefined ) ? p3 : new Plane(),
		( p4 !== undefined ) ? p4 : new Plane(),
		( p5 !== undefined ) ? p5 : new Plane()

	];

}

Object.assign( Frustum.prototype, {

	set: function ( p0, p1, p2, p3, p4, p5 ) {

		var planes = this.planes;

		planes[ 0 ].copy( p0 );
		planes[ 1 ].copy( p1 );
		planes[ 2 ].copy( p2 );
		planes[ 3 ].copy( p3 );
		planes[ 4 ].copy( p4 );
		planes[ 5 ].copy( p5 );

		return this;

	},

	clone: function () {

		return new this.constructor().copy( this );

	},

	copy: function ( frustum ) {

		var planes = this.planes;

		for ( var i = 0; i < 6; i ++ ) {

			planes[ i ].copy( frustum.planes[ i ] );

		}

		return this;

	},

	setFromMatrix: function ( m ) {

		var planes = this.planes;
		var me = m.elements;
		var me0 = me[ 0 ], me1 = me[ 1 ], me2 = me[ 2 ], me3 = me[ 3 ];
		var me4 = me[ 4 ], me5 = me[ 5 ], me6 = me[ 6 ], me7 = me[ 7 ];
		var me8 = me[ 8 ], me9 = me[ 9 ], me10 = me[ 10 ], me11 = me[ 11 ];
		var me12 = me[ 12 ], me13 = me[ 13 ], me14 = me[ 14 ], me15 = me[ 15 ];

		planes[ 0 ].setComponents( me3 - me0, me7 - me4, me11 - me8, me15 - me12 ).normalize();
		planes[ 1 ].setComponents( me3 + me0, me7 + me4, me11 + me8, me15 + me12 ).normalize();
		planes[ 2 ].setComponents( me3 + me1, me7 + me5, me11 + me9, me15 + me13 ).normalize();
		planes[ 3 ].setComponents( me3 - me1, me7 - me5, me11 - me9, me15 - me13 ).normalize();
		planes[ 4 ].setComponents( me3 - me2, me7 - me6, me11 - me10, me15 - me14 ).normalize();
		planes[ 5 ].setComponents( me3 + me2, me7 + me6, me11 + me10, me15 + me14 ).normalize();

		return this;

	},

	intersectsObject: function () {

		var sphere = new Sphere();

		return function intersectsObject( object ) {

			var geometry = object.geometry;

			if ( geometry.boundingSphere === null )
				geometry.computeBoundingSphere();

			sphere.copy( geometry.boundingSphere )
				.applyMatrix4( object.matrixWorld );

			return this.intersectsSphere( sphere );

		};

	}(),

	intersectsSprite: function () {

		var sphere = new Sphere();

		return function intersectsSprite( sprite ) {

			sphere.center.set( 0, 0, 0 );
			sphere.radius = 0.7071067811865476;
			sphere.applyMatrix4( sprite.matrixWorld );

			return this.intersectsSphere( sphere );

		};

	}(),

	intersectsSphere: function ( sphere ) {

		var planes = this.planes;
		var center = sphere.center;
		var negRadius = - sphere.radius;

		for ( var i = 0; i < 6; i ++ ) {

			var distance = planes[ i ].distanceToPoint( center );

			if ( distance < negRadius ) {

				return false;

			}

		}

		return true;

	},

	intersectsBox: function () {

		var p1 = new Vector3(),
			p2 = new Vector3();

		return function intersectsBox( box ) {

			var planes = this.planes;

			for ( var i = 0; i < 6; i ++ ) {

				var plane = planes[ i ];

				p1.x = plane.normal.x > 0 ? box.min.x : box.max.x;
				p2.x = plane.normal.x > 0 ? box.max.x : box.min.x;
				p1.y = plane.normal.y > 0 ? box.min.y : box.max.y;
				p2.y = plane.normal.y > 0 ? box.max.y : box.min.y;
				p1.z = plane.normal.z > 0 ? box.min.z : box.max.z;
				p2.z = plane.normal.z > 0 ? box.max.z : box.min.z;

				var d1 = plane.distanceToPoint( p1 );
				var d2 = plane.distanceToPoint( p2 );

				// if both outside plane, no intersection

				if ( d1 < 0 && d2 < 0 ) {

					return false;

				}

			}

			return true;

		};

	}(),

	containsPoint: function ( point ) {

		var planes = this.planes;

		for ( var i = 0; i < 6; i ++ ) {

			if ( planes[ i ].distanceToPoint( point ) < 0 ) {

				return false;

			}

		}

		return true;

	}

} );

/**
 * @author alteredq / http://alteredqualia.com/
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * @author mrdoob / http://mrdoob.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author bhouston / http://clara.io
 */

function Euler( x, y, z, order ) {

	this._x = x || 0;
	this._y = y || 0;
	this._z = z || 0;
	this._order = order || Euler.DefaultOrder;

}

Euler.RotationOrders = [ 'XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX' ];

Euler.DefaultOrder = 'XYZ';

Object.defineProperties( Euler.prototype, {

	x: {

		get: function () {

			return this._x;

		},

		set: function ( value ) {

			this._x = value;
			this.onChangeCallback();

		}

	},

	y: {

		get: function () {

			return this._y;

		},

		set: function ( value ) {

			this._y = value;
			this.onChangeCallback();

		}

	},

	z: {

		get: function () {

			return this._z;

		},

		set: function ( value ) {

			this._z = value;
			this.onChangeCallback();

		}

	},

	order: {

		get: function () {

			return this._order;

		},

		set: function ( value ) {

			this._order = value;
			this.onChangeCallback();

		}

	}

} );

Object.assign( Euler.prototype, {

	isEuler: true,

	set: function ( x, y, z, order ) {

		this._x = x;
		this._y = y;
		this._z = z;
		this._order = order || this._order;

		this.onChangeCallback();

		return this;

	},

	clone: function () {

		return new this.constructor( this._x, this._y, this._z, this._order );

	},

	copy: function ( euler ) {

		this._x = euler._x;
		this._y = euler._y;
		this._z = euler._z;
		this._order = euler._order;

		this.onChangeCallback();

		return this;

	},

	setFromRotationMatrix: function ( m, order, update ) {

		var clamp = _Math.clamp;

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		var te = m.elements;
		var m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ];
		var m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ];
		var m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ];

		order = order || this._order;

		if ( order === 'XYZ' ) {

			this._y = Math.asin( clamp( m13, - 1, 1 ) );

			if ( Math.abs( m13 ) < 0.99999 ) {

				this._x = Math.atan2( - m23, m33 );
				this._z = Math.atan2( - m12, m11 );

			} else {

				this._x = Math.atan2( m32, m22 );
				this._z = 0;

			}

		} else if ( order === 'YXZ' ) {

			this._x = Math.asin( - clamp( m23, - 1, 1 ) );

			if ( Math.abs( m23 ) < 0.99999 ) {

				this._y = Math.atan2( m13, m33 );
				this._z = Math.atan2( m21, m22 );

			} else {

				this._y = Math.atan2( - m31, m11 );
				this._z = 0;

			}

		} else if ( order === 'ZXY' ) {

			this._x = Math.asin( clamp( m32, - 1, 1 ) );

			if ( Math.abs( m32 ) < 0.99999 ) {

				this._y = Math.atan2( - m31, m33 );
				this._z = Math.atan2( - m12, m22 );

			} else {

				this._y = 0;
				this._z = Math.atan2( m21, m11 );

			}

		} else if ( order === 'ZYX' ) {

			this._y = Math.asin( - clamp( m31, - 1, 1 ) );

			if ( Math.abs( m31 ) < 0.99999 ) {

				this._x = Math.atan2( m32, m33 );
				this._z = Math.atan2( m21, m11 );

			} else {

				this._x = 0;
				this._z = Math.atan2( - m12, m22 );

			}

		} else if ( order === 'YZX' ) {

			this._z = Math.asin( clamp( m21, - 1, 1 ) );

			if ( Math.abs( m21 ) < 0.99999 ) {

				this._x = Math.atan2( - m23, m22 );
				this._y = Math.atan2( - m31, m11 );

			} else {

				this._x = 0;
				this._y = Math.atan2( m13, m33 );

			}

		} else if ( order === 'XZY' ) {

			this._z = Math.asin( - clamp( m12, - 1, 1 ) );

			if ( Math.abs( m12 ) < 0.99999 ) {

				this._x = Math.atan2( m32, m22 );
				this._y = Math.atan2( m13, m11 );

			} else {

				this._x = Math.atan2( - m23, m33 );
				this._y = 0;

			}

		} else {

			console.warn( 'THREE.Euler: .setFromRotationMatrix() given unsupported order: ' + order );

		}

		this._order = order;

		if ( update !== false ) this.onChangeCallback();

		return this;

	},

	setFromQuaternion: function () {

		var matrix = new Matrix4();

		return function setFromQuaternion( q, order, update ) {

			matrix.makeRotationFromQuaternion( q );

			return this.setFromRotationMatrix( matrix, order, update );

		};

	}(),

	setFromVector3: function ( v, order ) {

		return this.set( v.x, v.y, v.z, order || this._order );

	},

	reorder: function () {

		// WARNING: this discards revolution information -bhouston

		var q = new Quaternion();

		return function reorder( newOrder ) {

			q.setFromEuler( this );

			return this.setFromQuaternion( q, newOrder );

		};

	}(),

	equals: function ( euler ) {

		return ( euler._x === this._x ) && ( euler._y === this._y ) && ( euler._z === this._z ) && ( euler._order === this._order );

	},

	fromArray: function ( array ) {

		this._x = array[ 0 ];
		this._y = array[ 1 ];
		this._z = array[ 2 ];
		if ( array[ 3 ] !== undefined ) this._order = array[ 3 ];

		this.onChangeCallback();

		return this;

	},

	toArray: function ( array, offset ) {

		if ( array === undefined ) array = [];
		if ( offset === undefined ) offset = 0;

		array[ offset ] = this._x;
		array[ offset + 1 ] = this._y;
		array[ offset + 2 ] = this._z;
		array[ offset + 3 ] = this._order;

		return array;

	},

	toVector3: function ( optionalResult ) {

		if ( optionalResult ) {

			return optionalResult.set( this._x, this._y, this._z );

		} else {

			return new Vector3( this._x, this._y, this._z );

		}

	},

	onChange: function ( callback ) {

		this.onChangeCallback = callback;

		return this;

	},

	onChangeCallback: function () {}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 */

function Layers() {

	this.mask = 1 | 0;

}

Object.assign( Layers.prototype, {

	set: function ( channel ) {

		this.mask = 1 << channel | 0;

	},

	enable: function ( channel ) {

		this.mask |= 1 << channel | 0;

	},

	toggle: function ( channel ) {

		this.mask ^= 1 << channel | 0;

	},

	disable: function ( channel ) {

		this.mask &= ~ ( 1 << channel | 0 );

	},

	test: function ( layers ) {

		return ( this.mask & layers.mask ) !== 0;

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author mikael emtinger / http://gomo.se/
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author elephantatwork / www.elephantatwork.ch
 */

var object3DId = 0;

function Object3D() {

	Object.defineProperty( this, 'id', { value: object3DId ++ } );

	this.uuid = _Math.generateUUID();

	this.name = '';
	this.type = 'Object3D';

	this.parent = null;
	this.children = [];

	this.up = Object3D.DefaultUp.clone();

	var position = new Vector3();
	var rotation = new Euler();
	var quaternion = new Quaternion();
	var scale = new Vector3( 1, 1, 1 );

	function onRotationChange() {

		quaternion.setFromEuler( rotation, false );

	}

	function onQuaternionChange() {

		rotation.setFromQuaternion( quaternion, undefined, false );

	}

	rotation.onChange( onRotationChange );
	quaternion.onChange( onQuaternionChange );

	Object.defineProperties( this, {
		position: {
			enumerable: true,
			value: position
		},
		rotation: {
			enumerable: true,
			value: rotation
		},
		quaternion: {
			enumerable: true,
			value: quaternion
		},
		scale: {
			enumerable: true,
			value: scale
		},
		modelViewMatrix: {
			value: new Matrix4()
		},
		normalMatrix: {
			value: new Matrix3()
		}
	} );

	this.matrix = new Matrix4();
	this.matrixWorld = new Matrix4();

	this.matrixAutoUpdate = Object3D.DefaultMatrixAutoUpdate;
	this.matrixWorldNeedsUpdate = false;

	this.layers = new Layers();
	this.visible = true;

	this.castShadow = false;
	this.receiveShadow = false;

	this.frustumCulled = true;
	this.renderOrder = 0;

	this.userData = {};
}

Object3D.DefaultUp = new Vector3( 0, 1, 0 );
Object3D.DefaultMatrixAutoUpdate = true;

Object.assign( Object3D.prototype, EventDispatcher.prototype, {

	isObject3D: true,

	onBeforeRender: function () {},
	onAfterRender: function () {},

	applyMatrix: function ( matrix ) {

		this.matrix.multiplyMatrices( matrix, this.matrix );

		this.matrix.decompose( this.position, this.quaternion, this.scale );

	},

	applyQuaternion: function ( q ) {

		this.quaternion.premultiply( q );

		return this;

	},

	setRotationFromAxisAngle: function ( axis, angle ) {

		// assumes axis is normalized

		this.quaternion.setFromAxisAngle( axis, angle );

	},

	setRotationFromEuler: function ( euler ) {

		this.quaternion.setFromEuler( euler, true );

	},

	setRotationFromMatrix: function ( m ) {

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		this.quaternion.setFromRotationMatrix( m );

	},

	setRotationFromQuaternion: function ( q ) {

		// assumes q is normalized

		this.quaternion.copy( q );

	},

	rotateOnAxis: function () {

		// rotate object on axis in object space
		// axis is assumed to be normalized

		var q1 = new Quaternion();

		return function rotateOnAxis( axis, angle ) {

			q1.setFromAxisAngle( axis, angle );

			this.quaternion.multiply( q1 );

			return this;

		};

	}(),

	rotateX: function () {

		var v1 = new Vector3( 1, 0, 0 );

		return function rotateX( angle ) {

			return this.rotateOnAxis( v1, angle );

		};

	}(),

	rotateY: function () {

		var v1 = new Vector3( 0, 1, 0 );

		return function rotateY( angle ) {

			return this.rotateOnAxis( v1, angle );

		};

	}(),

	rotateZ: function () {

		var v1 = new Vector3( 0, 0, 1 );

		return function rotateZ( angle ) {

			return this.rotateOnAxis( v1, angle );

		};

	}(),

	translateOnAxis: function () {

		// translate object by distance along axis in object space
		// axis is assumed to be normalized

		var v1 = new Vector3();

		return function translateOnAxis( axis, distance ) {

			v1.copy( axis ).applyQuaternion( this.quaternion );

			this.position.add( v1.multiplyScalar( distance ) );

			return this;

		};

	}(),

	translateX: function () {

		var v1 = new Vector3( 1, 0, 0 );

		return function translateX( distance ) {

			return this.translateOnAxis( v1, distance );

		};

	}(),

	translateY: function () {

		var v1 = new Vector3( 0, 1, 0 );

		return function translateY( distance ) {

			return this.translateOnAxis( v1, distance );

		};

	}(),

	translateZ: function () {

		var v1 = new Vector3( 0, 0, 1 );

		return function translateZ( distance ) {

			return this.translateOnAxis( v1, distance );

		};

	}(),

	localToWorld: function ( vector ) {

		return vector.applyMatrix4( this.matrixWorld );

	},

	worldToLocal: function () {

		var m1 = new Matrix4();

		return function worldToLocal( vector ) {

			return vector.applyMatrix4( m1.getInverse( this.matrixWorld ) );

		};

	}(),

	lookAt: function () {

		// This method does not support objects with rotated and/or translated parent(s)

		var m1 = new Matrix4();

		return function lookAt( vector ) {

			if ( this.isCamera ) {

				m1.lookAt( this.position, vector, this.up );

			} else {

				m1.lookAt( vector, this.position, this.up );

			}

			this.quaternion.setFromRotationMatrix( m1 );

		};

	}(),

	add: function ( object ) {

		if ( arguments.length > 1 ) {

			for ( var i = 0; i < arguments.length; i ++ ) {

				this.add( arguments[ i ] );

			}

			return this;

		}

		if ( object === this ) {

			console.error( "THREE.Object3D.add: object can't be added as a child of itself.", object );
			return this;

		}

		if ( ( object && object.isObject3D ) ) {

			if ( object.parent !== null ) {

				object.parent.remove( object );

			}

			object.parent = this;
			object.dispatchEvent( { type: 'added' } );

			this.children.push( object );

		} else {

			console.error( "THREE.Object3D.add: object not an instance of THREE.Object3D.", object );

		}

		return this;

	},

	remove: function ( object ) {

		if ( arguments.length > 1 ) {

			for ( var i = 0; i < arguments.length; i ++ ) {

				this.remove( arguments[ i ] );

			}

			return this;

		}

		var index = this.children.indexOf( object );

		if ( index !== - 1 ) {

			object.parent = null;

			object.dispatchEvent( { type: 'removed' } );

			this.children.splice( index, 1 );

		}

		return this;
		
	},

	getObjectById: function ( id ) {

		return this.getObjectByProperty( 'id', id );

	},

	getObjectByName: function ( name ) {

		return this.getObjectByProperty( 'name', name );

	},

	getObjectByProperty: function ( name, value ) {

		if ( this[ name ] === value ) return this;

		for ( var i = 0, l = this.children.length; i < l; i ++ ) {

			var child = this.children[ i ];
			var object = child.getObjectByProperty( name, value );

			if ( object !== undefined ) {

				return object;

			}

		}

		return undefined;

	},

	getWorldPosition: function ( optionalTarget ) {

		var result = optionalTarget || new Vector3();

		this.updateMatrixWorld( true );

		return result.setFromMatrixPosition( this.matrixWorld );

	},

	getWorldQuaternion: function () {

		var position = new Vector3();
		var scale = new Vector3();

		return function getWorldQuaternion( optionalTarget ) {

			var result = optionalTarget || new Quaternion();

			this.updateMatrixWorld( true );

			this.matrixWorld.decompose( position, result, scale );

			return result;

		};

	}(),

	getWorldRotation: function () {

		var quaternion = new Quaternion();

		return function getWorldRotation( optionalTarget ) {

			var result = optionalTarget || new Euler();

			this.getWorldQuaternion( quaternion );

			return result.setFromQuaternion( quaternion, this.rotation.order, false );

		};

	}(),

	getWorldScale: function () {

		var position = new Vector3();
		var quaternion = new Quaternion();

		return function getWorldScale( optionalTarget ) {

			var result = optionalTarget || new Vector3();

			this.updateMatrixWorld( true );

			this.matrixWorld.decompose( position, quaternion, result );

			return result;

		};

	}(),

	getWorldDirection: function () {

		var quaternion = new Quaternion();

		return function getWorldDirection( optionalTarget ) {

			var result = optionalTarget || new Vector3();

			this.getWorldQuaternion( quaternion );

			return result.set( 0, 0, 1 ).applyQuaternion( quaternion );

		};

	}(),

	raycast: function () {},

	traverse: function ( callback ) {

		callback( this );

		var children = this.children;

		for ( var i = 0, l = children.length; i < l; i ++ ) {

			children[ i ].traverse( callback );

		}

	},

	traverseVisible: function ( callback ) {

		if ( this.visible === false ) return;

		callback( this );

		var children = this.children;

		for ( var i = 0, l = children.length; i < l; i ++ ) {

			children[ i ].traverseVisible( callback );

		}

	},

	traverseAncestors: function ( callback ) {

		var parent = this.parent;

		if ( parent !== null ) {

			callback( parent );

			parent.traverseAncestors( callback );

		}

	},

	updateMatrix: function () {

		this.matrix.compose( this.position, this.quaternion, this.scale );

		this.matrixWorldNeedsUpdate = true;

	},

	updateMatrixWorld: function ( force ) {

		if ( this.matrixAutoUpdate ) this.updateMatrix();

		if ( this.matrixWorldNeedsUpdate || force ) {

			if ( this.parent === null ) {

				this.matrixWorld.copy( this.matrix );

			} else {

				this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

			}

			this.matrixWorldNeedsUpdate = false;

			force = true;

		}

		// update children

		var children = this.children;

		for ( var i = 0, l = children.length; i < l; i ++ ) {

			children[ i ].updateMatrixWorld( force );

		}

	},

	toJSON: function ( meta ) {

		// meta is '' when called from JSON.stringify
		var isRootObject = ( meta === undefined || meta === '' );

		var output = {};

		// meta is a hash used to collect geometries, materials.
		// not providing it implies that this is the root object
		// being serialized.
		if ( isRootObject ) {

			// initialize meta obj
			meta = {
				geometries: {},
				materials: {},
				textures: {},
				images: {}
			};

			output.metadata = {
				version: 4.5,
				type: 'Object',
				generator: 'Object3D.toJSON'
			};

		}

		// standard Object3D serialization

		var object = {};

		object.uuid = this.uuid;
		object.type = this.type;

		if ( this.name !== '' ) object.name = this.name;
		if ( JSON.stringify( this.userData ) !== '{}' ) object.userData = this.userData;
		if ( this.castShadow === true ) object.castShadow = true;
		if ( this.receiveShadow === true ) object.receiveShadow = true;
		if ( this.visible === false ) object.visible = false;

		object.matrix = this.matrix.toArray();

		//

		function serialize( library, element ) {

			if ( library[ element.uuid ] === undefined ) {

				library[ element.uuid ] = element.toJSON( meta );

			}

			return element.uuid;

		}

		if ( this.geometry !== undefined ) {

			object.geometry = serialize( meta.geometries, this.geometry );

		}

		if ( this.material !== undefined ) {

			if ( Array.isArray( this.material ) ) {

				var uuids = [];

				for ( var i = 0, l = this.material.length; i < l; i ++ ) {

					uuids.push( serialize( meta.materials, this.material[ i ] ) );

				}

				object.material = uuids;

			} else {

				object.material = serialize( meta.materials, this.material );

			}

		}

		//

		if ( this.children.length > 0 ) {

			object.children = [];

			for ( var i = 0; i < this.children.length; i ++ ) {

				object.children.push( this.children[ i ].toJSON( meta ).object );

			}

		}

		if ( isRootObject ) {

			var geometries = extractFromCache( meta.geometries );
			var materials = extractFromCache( meta.materials );
			var textures = extractFromCache( meta.textures );
			var images = extractFromCache( meta.images );

			if ( geometries.length > 0 ) output.geometries = geometries;
			if ( materials.length > 0 ) output.materials = materials;
			if ( textures.length > 0 ) output.textures = textures;
			if ( images.length > 0 ) output.images = images;

		}

		output.object = object;

		return output;

		// extract data from the cache hash
		// remove metadata on each item
		// and return as array
		function extractFromCache( cache ) {

			var values = [];
			for ( var key in cache ) {

				var data = cache[ key ];
				delete data.metadata;
				values.push( data );

			}
			return values;

		}

	},

	clone: function ( recursive ) {

		return new this.constructor().copy( this, recursive );

	},

	copy: function ( source, recursive ) {

		if ( recursive === undefined ) recursive = true;

		this.name = source.name;

		this.up.copy( source.up );

		this.position.copy( source.position );
		this.quaternion.copy( source.quaternion );
		this.scale.copy( source.scale );

		this.matrix.copy( source.matrix );
		this.matrixWorld.copy( source.matrixWorld );

		this.matrixAutoUpdate = source.matrixAutoUpdate;
		this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;

		this.layers.mask = source.layers.mask;
		this.visible = source.visible;

		this.castShadow = source.castShadow;
		this.receiveShadow = source.receiveShadow;

		this.frustumCulled = source.frustumCulled;
		this.renderOrder = source.renderOrder;

		this.userData = JSON.parse( JSON.stringify( source.userData ) );

		if ( recursive === true ) {

			for ( var i = 0; i < source.children.length; i ++ ) {

				var child = source.children[ i ];
				this.add( child.clone() );

			}

		}

		return this;

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author mikael emtinger / http://gomo.se/
 * @author WestLangley / http://github.com/WestLangley
*/

function Camera() {

	Object3D.call( this );

	this.type = 'Camera';

	this.matrixWorldInverse = new Matrix4();
	this.projectionMatrix = new Matrix4();

}

Camera.prototype = Object.assign( Object.create( Object3D.prototype ), {

	constructor: Camera,

	isCamera: true,

	copy: function ( source, recursive ) {

		Object3D.prototype.copy.call( this, source, recursive );

		this.matrixWorldInverse.copy( source.matrixWorldInverse );
		this.projectionMatrix.copy( source.projectionMatrix );

		return this;

	},

	getWorldDirection: function () {

		var quaternion = new Quaternion();

		return function getWorldDirection( optionalTarget ) {

			var result = optionalTarget || new Vector3();

			this.getWorldQuaternion( quaternion );

			return result.set( 0, 0, - 1 ).applyQuaternion( quaternion );

		};

	}(),

	updateMatrixWorld: function ( force ) {

		Object3D.prototype.updateMatrixWorld.call( this, force );

		this.matrixWorldInverse.getInverse( this.matrixWorld );

	},

	clone: function () {

		return new this.constructor().copy( this );

	}

} );

/**
 * @author alteredq / http://alteredqualia.com/
 * @author arose / http://github.com/arose
 */

function OrthographicCamera( left, right, top, bottom, near, far ) {

	Camera.call( this );

	this.type = 'OrthographicCamera';

	this.zoom = 1;
	this.view = null;

	this.left = left;
	this.right = right;
	this.top = top;
	this.bottom = bottom;

	this.near = ( near !== undefined ) ? near : 0.1;
	this.far = ( far !== undefined ) ? far : 2000;

	this.updateProjectionMatrix();

}

OrthographicCamera.prototype = Object.assign( Object.create( Camera.prototype ), {

	constructor: OrthographicCamera,

	isOrthographicCamera: true,

	copy: function ( source, recursive ) {

		Camera.prototype.copy.call( this, source, recursive );

		this.left = source.left;
		this.right = source.right;
		this.top = source.top;
		this.bottom = source.bottom;
		this.near = source.near;
		this.far = source.far;

		this.zoom = source.zoom;
		this.view = source.view === null ? null : Object.assign( {}, source.view );

		return this;

	},

	setViewOffset: function( fullWidth, fullHeight, x, y, width, height ) {

		this.view = {
			fullWidth: fullWidth,
			fullHeight: fullHeight,
			offsetX: x,
			offsetY: y,
			width: width,
			height: height
		};

		this.updateProjectionMatrix();

	},

	clearViewOffset: function() {

		this.view = null;
		this.updateProjectionMatrix();

	},

	updateProjectionMatrix: function () {

		var dx = ( this.right - this.left ) / ( 2 * this.zoom );
		var dy = ( this.top - this.bottom ) / ( 2 * this.zoom );
		var cx = ( this.right + this.left ) / 2;
		var cy = ( this.top + this.bottom ) / 2;

		var left = cx - dx;
		var right = cx + dx;
		var top = cy + dy;
		var bottom = cy - dy;

		if ( this.view !== null ) {

			var zoomW = this.zoom / ( this.view.width / this.view.fullWidth );
			var zoomH = this.zoom / ( this.view.height / this.view.fullHeight );
			var scaleW = ( this.right - this.left ) / this.view.width;
			var scaleH = ( this.top - this.bottom ) / this.view.height;

			left += scaleW * ( this.view.offsetX / zoomW );
			right = left + scaleW * ( this.view.width / zoomW );
			top -= scaleH * ( this.view.offsetY / zoomH );
			bottom = top - scaleH * ( this.view.height / zoomH );

		}

		this.projectionMatrix.makeOrthographic( left, right, top, bottom, this.near, this.far );

	},

	toJSON: function ( meta ) {

		var data = Object3D.prototype.toJSON.call( this, meta );

		data.object.zoom = this.zoom;
		data.object.left = this.left;
		data.object.right = this.right;
		data.object.top = this.top;
		data.object.bottom = this.bottom;
		data.object.near = this.near;
		data.object.far = this.far;

		if ( this.view !== null ) data.object.view = Object.assign( {}, this.view );

		return data;

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author greggman / http://games.greggman.com/
 * @author zz85 / http://www.lab4games.net/zz85/blog
 * @author tschw
 */

function PerspectiveCamera( fov, aspect, near, far ) {

	Camera.call( this );

	this.type = 'PerspectiveCamera';

	this.fov = fov !== undefined ? fov : 50;
	this.zoom = 1;

	this.near = near !== undefined ? near : 0.1;
	this.far = far !== undefined ? far : 2000;
	this.focus = 10;

	this.aspect = aspect !== undefined ? aspect : 1;
	this.view = null;

	this.filmGauge = 35;	// width of the film (default in millimeters)
	this.filmOffset = 0;	// horizontal film offset (same unit as gauge)

	this.updateProjectionMatrix();

}

PerspectiveCamera.prototype = Object.assign( Object.create( Camera.prototype ), {

	constructor: PerspectiveCamera,

	isPerspectiveCamera: true,

	copy: function ( source, recursive ) {

		Camera.prototype.copy.call( this, source, recursive );

		this.fov = source.fov;
		this.zoom = source.zoom;

		this.near = source.near;
		this.far = source.far;
		this.focus = source.focus;

		this.aspect = source.aspect;
		this.view = source.view === null ? null : Object.assign( {}, source.view );

		this.filmGauge = source.filmGauge;
		this.filmOffset = source.filmOffset;

		return this;

	},

	/**
	 * Sets the FOV by focal length in respect to the current .filmGauge.
	 *
	 * The default film gauge is 35, so that the focal length can be specified for
	 * a 35mm (full frame) camera.
	 *
	 * Values for focal length and film gauge must have the same unit.
	 */
	setFocalLength: function ( focalLength ) {

		// see http://www.bobatkins.com/photography/technical/field_of_view.html
		var vExtentSlope = 0.5 * this.getFilmHeight() / focalLength;

		this.fov = _Math.RAD2DEG * 2 * Math.atan( vExtentSlope );
		this.updateProjectionMatrix();

	},

	/**
	 * Calculates the focal length from the current .fov and .filmGauge.
	 */
	getFocalLength: function () {

		var vExtentSlope = Math.tan( _Math.DEG2RAD * 0.5 * this.fov );

		return 0.5 * this.getFilmHeight() / vExtentSlope;

	},

	getEffectiveFOV: function () {

		return _Math.RAD2DEG * 2 * Math.atan(
				Math.tan( _Math.DEG2RAD * 0.5 * this.fov ) / this.zoom );

	},

	getFilmWidth: function () {

		// film not completely covered in portrait format (aspect < 1)
		return this.filmGauge * Math.min( this.aspect, 1 );

	},

	getFilmHeight: function () {

		// film not completely covered in landscape format (aspect > 1)
		return this.filmGauge / Math.max( this.aspect, 1 );

	},

	/**
	 * Sets an offset in a larger frustum. This is useful for multi-window or
	 * multi-monitor/multi-machine setups.
	 *
	 * For example, if you have 3x2 monitors and each monitor is 1920x1080 and
	 * the monitors are in grid like this
	 *
	 *   +---+---+---+
	 *   | A | B | C |
	 *   +---+---+---+
	 *   | D | E | F |
	 *   +---+---+---+
	 *
	 * then for each monitor you would call it like this
	 *
	 *   var w = 1920;
	 *   var h = 1080;
	 *   var fullWidth = w * 3;
	 *   var fullHeight = h * 2;
	 *
	 *   --A--
	 *   camera.setOffset( fullWidth, fullHeight, w * 0, h * 0, w, h );
	 *   --B--
	 *   camera.setOffset( fullWidth, fullHeight, w * 1, h * 0, w, h );
	 *   --C--
	 *   camera.setOffset( fullWidth, fullHeight, w * 2, h * 0, w, h );
	 *   --D--
	 *   camera.setOffset( fullWidth, fullHeight, w * 0, h * 1, w, h );
	 *   --E--
	 *   camera.setOffset( fullWidth, fullHeight, w * 1, h * 1, w, h );
	 *   --F--
	 *   camera.setOffset( fullWidth, fullHeight, w * 2, h * 1, w, h );
	 *
	 *   Note there is no reason monitors have to be the same size or in a grid.
	 */
	setViewOffset: function ( fullWidth, fullHeight, x, y, width, height ) {

		this.aspect = fullWidth / fullHeight;

		this.view = {
			fullWidth: fullWidth,
			fullHeight: fullHeight,
			offsetX: x,
			offsetY: y,
			width: width,
			height: height
		};

		this.updateProjectionMatrix();

	},

	clearViewOffset: function () {

		this.view = null;
		this.updateProjectionMatrix();

	},

	updateProjectionMatrix: function () {

		var near = this.near,
			top = near * Math.tan(
					_Math.DEG2RAD * 0.5 * this.fov ) / this.zoom,
			height = 2 * top,
			width = this.aspect * height,
			left = - 0.5 * width,
			view = this.view;

		if ( view !== null ) {

			var fullWidth = view.fullWidth,
				fullHeight = view.fullHeight;

			left += view.offsetX * width / fullWidth;
			top -= view.offsetY * height / fullHeight;
			width *= view.width / fullWidth;
			height *= view.height / fullHeight;

		}

		var skew = this.filmOffset;
		if ( skew !== 0 ) left += near * skew / this.getFilmWidth();

		this.projectionMatrix.makePerspective( left, left + width, top, top - height, near, this.far );

	},

	toJSON: function ( meta ) {

		var data = Object3D.prototype.toJSON.call( this, meta );

		data.object.fov = this.fov;
		data.object.zoom = this.zoom;

		data.object.near = this.near;
		data.object.far = this.far;
		data.object.focus = this.focus;

		data.object.aspect = this.aspect;

		if ( this.view !== null ) data.object.view = Object.assign( {}, this.view );

		data.object.filmGauge = this.filmGauge;
		data.object.filmOffset = this.filmOffset;

		return data;

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 */

function Face3( a, b, c, normal, color, materialIndex ) {

	this.a = a;
	this.b = b;
	this.c = c;

	this.normal = ( normal && normal.isVector3 ) ? normal : new Vector3();
	this.vertexNormals = Array.isArray( normal ) ? normal : [];

	this.color = ( color && color.isColor ) ? color : new Color();
	this.vertexColors = Array.isArray( color ) ? color : [];

	this.materialIndex = materialIndex !== undefined ? materialIndex : 0;

}

Object.assign( Face3.prototype, {

	clone: function () {

		return new this.constructor().copy( this );

	},

	copy: function ( source ) {

		this.a = source.a;
		this.b = source.b;
		this.c = source.c;

		this.normal.copy( source.normal );
		this.color.copy( source.color );

		this.materialIndex = source.materialIndex;

		for ( var i = 0, il = source.vertexNormals.length; i < il; i ++ ) {

			this.vertexNormals[ i ] = source.vertexNormals[ i ].clone();

		}

		for ( var i = 0, il = source.vertexColors.length; i < il; i ++ ) {

			this.vertexColors[ i ] = source.vertexColors[ i ].clone();

		}

		return this;

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author kile / http://kile.stravaganza.org/
 * @author alteredq / http://alteredqualia.com/
 * @author mikael emtinger / http://gomo.se/
 * @author zz85 / http://www.lab4games.net/zz85/blog
 * @author bhouston / http://clara.io
 */

var count = 0;
function GeometryIdCount() { return count++; }

function Geometry() {

	Object.defineProperty( this, 'id', { value: GeometryIdCount() } );

	this.uuid = _Math.generateUUID();

	this.name = '';
	this.type = 'Geometry';

	this.vertices = [];
	this.colors = [];
	this.faces = [];
	this.faceVertexUvs = [[]];

	this.morphTargets = [];
	this.morphNormals = [];

	this.skinWeights = [];
	this.skinIndices = [];

	this.lineDistances = [];

	this.boundingBox = null;
	this.boundingSphere = null;

	// update flags

	this.elementsNeedUpdate = false;
	this.verticesNeedUpdate = false;
	this.uvsNeedUpdate = false;
	this.normalsNeedUpdate = false;
	this.colorsNeedUpdate = false;
	this.lineDistancesNeedUpdate = false;
	this.groupsNeedUpdate = false;

}

Object.assign( Geometry.prototype, EventDispatcher.prototype, {

	isGeometry: true,

	applyMatrix: function ( matrix ) {

		var normalMatrix = new Matrix3().getNormalMatrix( matrix );

		for ( var i = 0, il = this.vertices.length; i < il; i ++ ) {

			var vertex = this.vertices[ i ];
			vertex.applyMatrix4( matrix );

		}

		for ( var i = 0, il = this.faces.length; i < il; i ++ ) {

			var face = this.faces[ i ];
			face.normal.applyMatrix3( normalMatrix ).normalize();

			for ( var j = 0, jl = face.vertexNormals.length; j < jl; j ++ ) {

				face.vertexNormals[ j ].applyMatrix3( normalMatrix ).normalize();

			}

		}

		if ( this.boundingBox !== null ) {

			this.computeBoundingBox();

		}

		if ( this.boundingSphere !== null ) {

			this.computeBoundingSphere();

		}

		this.verticesNeedUpdate = true;
		this.normalsNeedUpdate = true;

		return this;

	},

	rotateX: function () {

		// rotate geometry around world x-axis

		var m1 = new Matrix4();

		return function rotateX( angle ) {

			m1.makeRotationX( angle );

			this.applyMatrix( m1 );

			return this;

		};

	}(),

	rotateY: function () {

		// rotate geometry around world y-axis

		var m1 = new Matrix4();

		return function rotateY( angle ) {

			m1.makeRotationY( angle );

			this.applyMatrix( m1 );

			return this;

		};

	}(),

	rotateZ: function () {

		// rotate geometry around world z-axis

		var m1 = new Matrix4();

		return function rotateZ( angle ) {

			m1.makeRotationZ( angle );

			this.applyMatrix( m1 );

			return this;

		};

	}(),

	translate: function () {

		// translate geometry

		var m1 = new Matrix4();

		return function translate( x, y, z ) {

			m1.makeTranslation( x, y, z );

			this.applyMatrix( m1 );

			return this;

		};

	}(),

	scale: function () {

		// scale geometry

		var m1 = new Matrix4();

		return function scale( x, y, z ) {

			m1.makeScale( x, y, z );

			this.applyMatrix( m1 );

			return this;

		};

	}(),

	lookAt: function () {

		var obj = new Object3D();

		return function lookAt( vector ) {

			obj.lookAt( vector );

			obj.updateMatrix();

			this.applyMatrix( obj.matrix );

		};

	}(),

	fromBufferGeometry: function ( geometry ) {

		var scope = this;

		var indices = geometry.index !== null ? geometry.index.array : undefined;
		var attributes = geometry.attributes;

		var positions = attributes.position.array;
		var normals = attributes.normal !== undefined ? attributes.normal.array : undefined;
		var colors = attributes.color !== undefined ? attributes.color.array : undefined;
		var uvs = attributes.uv !== undefined ? attributes.uv.array : undefined;
		var uvs2 = attributes.uv2 !== undefined ? attributes.uv2.array : undefined;

		if ( uvs2 !== undefined ) this.faceVertexUvs[ 1 ] = [];

		var tempNormals = [];
		var tempUVs = [];
		var tempUVs2 = [];

		for ( var i = 0, j = 0; i < positions.length; i += 3, j += 2 ) {

			scope.vertices.push( new Vector3( positions[ i ], positions[ i + 1 ], positions[ i + 2 ] ) );

			if ( normals !== undefined ) {

				tempNormals.push( new Vector3( normals[ i ], normals[ i + 1 ], normals[ i + 2 ] ) );

			}

			if ( colors !== undefined ) {

				scope.colors.push( new Color( colors[ i ], colors[ i + 1 ], colors[ i + 2 ] ) );

			}

			if ( uvs !== undefined ) {

				tempUVs.push( new Vector2( uvs[ j ], uvs[ j + 1 ] ) );

			}

			if ( uvs2 !== undefined ) {

				tempUVs2.push( new Vector2( uvs2[ j ], uvs2[ j + 1 ] ) );

			}

		}

		function addFace( a, b, c, materialIndex ) {

			var vertexNormals = normals !== undefined ? [ tempNormals[ a ].clone(), tempNormals[ b ].clone(), tempNormals[ c ].clone() ] : [];
			var vertexColors = colors !== undefined ? [ scope.colors[ a ].clone(), scope.colors[ b ].clone(), scope.colors[ c ].clone() ] : [];

			var face = new Face3( a, b, c, vertexNormals, vertexColors, materialIndex );

			scope.faces.push( face );

			if ( uvs !== undefined ) {

				scope.faceVertexUvs[ 0 ].push( [ tempUVs[ a ].clone(), tempUVs[ b ].clone(), tempUVs[ c ].clone() ] );

			}

			if ( uvs2 !== undefined ) {

				scope.faceVertexUvs[ 1 ].push( [ tempUVs2[ a ].clone(), tempUVs2[ b ].clone(), tempUVs2[ c ].clone() ] );

			}

		}

		var groups = geometry.groups;

		if ( groups.length > 0 ) {

			for ( var i = 0; i < groups.length; i ++ ) {

				var group = groups[ i ];

				var start = group.start;
				var count = group.count;

				for ( var j = start, jl = start + count; j < jl; j += 3 ) {

					if ( indices !== undefined ) {

						addFace( indices[ j ], indices[ j + 1 ], indices[ j + 2 ], group.materialIndex );

					} else {

						addFace( j, j + 1, j + 2, group.materialIndex );

					}

				}

			}

		} else {

			if ( indices !== undefined ) {

				for ( var i = 0; i < indices.length; i += 3 ) {

					addFace( indices[ i ], indices[ i + 1 ], indices[ i + 2 ] );

				}

			} else {

				for ( var i = 0; i < positions.length / 3; i += 3 ) {

					addFace( i, i + 1, i + 2 );

				}

			}

		}

		this.computeFaceNormals();

		if ( geometry.boundingBox !== null ) {

			this.boundingBox = geometry.boundingBox.clone();

		}

		if ( geometry.boundingSphere !== null ) {

			this.boundingSphere = geometry.boundingSphere.clone();

		}

		return this;

	},

	center: function () {

		this.computeBoundingBox();

		var offset = this.boundingBox.getCenter().negate();

		this.translate( offset.x, offset.y, offset.z );

		return offset;

	},

	normalize: function () {

		this.computeBoundingSphere();

		var center = this.boundingSphere.center;
		var radius = this.boundingSphere.radius;

		var s = radius === 0 ? 1 : 1.0 / radius;

		var matrix = new Matrix4();
		matrix.set(
			s, 0, 0, - s * center.x,
			0, s, 0, - s * center.y,
			0, 0, s, - s * center.z,
			0, 0, 0, 1
		);

		this.applyMatrix( matrix );

		return this;

	},

	computeFaceNormals: function () {

		var cb = new Vector3(), ab = new Vector3();

		for ( var f = 0, fl = this.faces.length; f < fl; f ++ ) {

			var face = this.faces[ f ];

			var vA = this.vertices[ face.a ];
			var vB = this.vertices[ face.b ];
			var vC = this.vertices[ face.c ];

			cb.subVectors( vC, vB );
			ab.subVectors( vA, vB );
			cb.cross( ab );

			cb.normalize();

			face.normal.copy( cb );

		}

	},

	computeVertexNormals: function ( areaWeighted ) {

		if ( areaWeighted === undefined ) areaWeighted = true;

		var v, vl, f, fl, face, vertices;

		vertices = new Array( this.vertices.length );

		for ( v = 0, vl = this.vertices.length; v < vl; v ++ ) {

			vertices[ v ] = new Vector3();

		}

		if ( areaWeighted ) {

			// vertex normals weighted by triangle areas
			// http://www.iquilezles.org/www/articles/normals/normals.htm

			var vA, vB, vC;
			var cb = new Vector3(), ab = new Vector3();

			for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

				face = this.faces[ f ];

				vA = this.vertices[ face.a ];
				vB = this.vertices[ face.b ];
				vC = this.vertices[ face.c ];

				cb.subVectors( vC, vB );
				ab.subVectors( vA, vB );
				cb.cross( ab );

				vertices[ face.a ].add( cb );
				vertices[ face.b ].add( cb );
				vertices[ face.c ].add( cb );

			}

		} else {

			this.computeFaceNormals();

			for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

				face = this.faces[ f ];

				vertices[ face.a ].add( face.normal );
				vertices[ face.b ].add( face.normal );
				vertices[ face.c ].add( face.normal );

			}

		}

		for ( v = 0, vl = this.vertices.length; v < vl; v ++ ) {

			vertices[ v ].normalize();

		}

		for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

			face = this.faces[ f ];

			var vertexNormals = face.vertexNormals;

			if ( vertexNormals.length === 3 ) {

				vertexNormals[ 0 ].copy( vertices[ face.a ] );
				vertexNormals[ 1 ].copy( vertices[ face.b ] );
				vertexNormals[ 2 ].copy( vertices[ face.c ] );

			} else {

				vertexNormals[ 0 ] = vertices[ face.a ].clone();
				vertexNormals[ 1 ] = vertices[ face.b ].clone();
				vertexNormals[ 2 ] = vertices[ face.c ].clone();

			}

		}

		if ( this.faces.length > 0 ) {

			this.normalsNeedUpdate = true;

		}

	},

	computeFlatVertexNormals: function () {

		var f, fl, face;

		this.computeFaceNormals();

		for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

			face = this.faces[ f ];

			var vertexNormals = face.vertexNormals;

			if ( vertexNormals.length === 3 ) {

				vertexNormals[ 0 ].copy( face.normal );
				vertexNormals[ 1 ].copy( face.normal );
				vertexNormals[ 2 ].copy( face.normal );

			} else {

				vertexNormals[ 0 ] = face.normal.clone();
				vertexNormals[ 1 ] = face.normal.clone();
				vertexNormals[ 2 ] = face.normal.clone();

			}

		}

		if ( this.faces.length > 0 ) {

			this.normalsNeedUpdate = true;

		}

	},

	computeMorphNormals: function () {

		var i, il, f, fl, face;

		// save original normals
		// - create temp variables on first access
		//   otherwise just copy (for faster repeated calls)

		for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

			face = this.faces[ f ];

			if ( ! face.__originalFaceNormal ) {

				face.__originalFaceNormal = face.normal.clone();

			} else {

				face.__originalFaceNormal.copy( face.normal );

			}

			if ( ! face.__originalVertexNormals ) face.__originalVertexNormals = [];

			for ( i = 0, il = face.vertexNormals.length; i < il; i ++ ) {

				if ( ! face.__originalVertexNormals[ i ] ) {

					face.__originalVertexNormals[ i ] = face.vertexNormals[ i ].clone();

				} else {

					face.__originalVertexNormals[ i ].copy( face.vertexNormals[ i ] );

				}

			}

		}

		// use temp geometry to compute face and vertex normals for each morph

		var tmpGeo = new Geometry();
		tmpGeo.faces = this.faces;

		for ( i = 0, il = this.morphTargets.length; i < il; i ++ ) {

			// create on first access

			if ( ! this.morphNormals[ i ] ) {

				this.morphNormals[ i ] = {};
				this.morphNormals[ i ].faceNormals = [];
				this.morphNormals[ i ].vertexNormals = [];

				var dstNormalsFace = this.morphNormals[ i ].faceNormals;
				var dstNormalsVertex = this.morphNormals[ i ].vertexNormals;

				var faceNormal, vertexNormals;

				for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

					faceNormal = new Vector3();
					vertexNormals = { a: new Vector3(), b: new Vector3(), c: new Vector3() };

					dstNormalsFace.push( faceNormal );
					dstNormalsVertex.push( vertexNormals );

				}

			}

			var morphNormals = this.morphNormals[ i ];

			// set vertices to morph target

			tmpGeo.vertices = this.morphTargets[ i ].vertices;

			// compute morph normals

			tmpGeo.computeFaceNormals();
			tmpGeo.computeVertexNormals();

			// store morph normals

			var faceNormal, vertexNormals;

			for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

				face = this.faces[ f ];

				faceNormal = morphNormals.faceNormals[ f ];
				vertexNormals = morphNormals.vertexNormals[ f ];

				faceNormal.copy( face.normal );

				vertexNormals.a.copy( face.vertexNormals[ 0 ] );
				vertexNormals.b.copy( face.vertexNormals[ 1 ] );
				vertexNormals.c.copy( face.vertexNormals[ 2 ] );

			}

		}

		// restore original normals

		for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

			face = this.faces[ f ];

			face.normal = face.__originalFaceNormal;
			face.vertexNormals = face.__originalVertexNormals;

		}

	},

	computeLineDistances: function () {

		var d = 0;
		var vertices = this.vertices;

		for ( var i = 0, il = vertices.length; i < il; i ++ ) {

			if ( i > 0 ) {

				d += vertices[ i ].distanceTo( vertices[ i - 1 ] );

			}

			this.lineDistances[ i ] = d;

		}

	},

	computeBoundingBox: function () {

		if ( this.boundingBox === null ) {

			this.boundingBox = new Box3();

		}

		this.boundingBox.setFromPoints( this.vertices );

	},

	computeBoundingSphere: function () {

		if ( this.boundingSphere === null ) {

			this.boundingSphere = new Sphere();

		}

		this.boundingSphere.setFromPoints( this.vertices );

	},

	merge: function ( geometry, matrix, materialIndexOffset ) {

		if ( ! ( geometry && geometry.isGeometry ) ) {

			console.error( 'THREE.Geometry.merge(): geometry not an instance of THREE.Geometry.', geometry );
			return;

		}

		var normalMatrix,
			vertexOffset = this.vertices.length,
			vertices1 = this.vertices,
			vertices2 = geometry.vertices,
			faces1 = this.faces,
			faces2 = geometry.faces,
			uvs1 = this.faceVertexUvs[ 0 ],
			uvs2 = geometry.faceVertexUvs[ 0 ],
			colors1 = this.colors,
			colors2 = geometry.colors;

		if ( materialIndexOffset === undefined ) materialIndexOffset = 0;

		if ( matrix !== undefined ) {

			normalMatrix = new Matrix3().getNormalMatrix( matrix );

		}

		// vertices

		for ( var i = 0, il = vertices2.length; i < il; i ++ ) {

			var vertex = vertices2[ i ];

			var vertexCopy = vertex.clone();

			if ( matrix !== undefined ) vertexCopy.applyMatrix4( matrix );

			vertices1.push( vertexCopy );

		}

		// colors

		for ( var i = 0, il = colors2.length; i < il; i ++ ) {

			colors1.push( colors2[ i ].clone() );

		}

		// faces

		for ( i = 0, il = faces2.length; i < il; i ++ ) {

			var face = faces2[ i ], faceCopy, normal, color,
				faceVertexNormals = face.vertexNormals,
				faceVertexColors = face.vertexColors;

			faceCopy = new Face3( face.a + vertexOffset, face.b + vertexOffset, face.c + vertexOffset );
			faceCopy.normal.copy( face.normal );

			if ( normalMatrix !== undefined ) {

				faceCopy.normal.applyMatrix3( normalMatrix ).normalize();

			}

			for ( var j = 0, jl = faceVertexNormals.length; j < jl; j ++ ) {

				normal = faceVertexNormals[ j ].clone();

				if ( normalMatrix !== undefined ) {

					normal.applyMatrix3( normalMatrix ).normalize();

				}

				faceCopy.vertexNormals.push( normal );

			}

			faceCopy.color.copy( face.color );

			for ( var j = 0, jl = faceVertexColors.length; j < jl; j ++ ) {

				color = faceVertexColors[ j ];
				faceCopy.vertexColors.push( color.clone() );

			}

			faceCopy.materialIndex = face.materialIndex + materialIndexOffset;

			faces1.push( faceCopy );

		}

		// uvs

		for ( i = 0, il = uvs2.length; i < il; i ++ ) {

			var uv = uvs2[ i ], uvCopy = [];

			if ( uv === undefined ) {

				continue;

			}

			for ( var j = 0, jl = uv.length; j < jl; j ++ ) {

				uvCopy.push( uv[ j ].clone() );

			}

			uvs1.push( uvCopy );

		}

	},

	mergeMesh: function ( mesh ) {

		if ( ! ( mesh && mesh.isMesh ) ) {

			console.error( 'THREE.Geometry.mergeMesh(): mesh not an instance of THREE.Mesh.', mesh );
			return;

		}

		mesh.matrixAutoUpdate && mesh.updateMatrix();

		this.merge( mesh.geometry, mesh.matrix );

	},

	/*
	 * Checks for duplicate vertices with hashmap.
	 * Duplicated vertices are removed
	 * and faces' vertices are updated.
	 */

	mergeVertices: function () {

		var verticesMap = {}; // Hashmap for looking up vertices by position coordinates (and making sure they are unique)
		var unique = [], changes = [];

		var v, key;
		var precisionPoints = 4; // number of decimal points, e.g. 4 for epsilon of 0.0001
		var precision = Math.pow( 10, precisionPoints );
		var i, il, face;
		var indices, j, jl;

		for ( i = 0, il = this.vertices.length; i < il; i ++ ) {

			v = this.vertices[ i ];
			key = Math.round( v.x * precision ) + '_' + Math.round( v.y * precision ) + '_' + Math.round( v.z * precision );

			if ( verticesMap[ key ] === undefined ) {

				verticesMap[ key ] = i;
				unique.push( this.vertices[ i ] );
				changes[ i ] = unique.length - 1;

			} else {

				//console.log('Duplicate vertex found. ', i, ' could be using ', verticesMap[key]);
				changes[ i ] = changes[ verticesMap[ key ] ];

			}

		}


		// if faces are completely degenerate after merging vertices, we
		// have to remove them from the geometry.
		var faceIndicesToRemove = [];

		for ( i = 0, il = this.faces.length; i < il; i ++ ) {

			face = this.faces[ i ];

			face.a = changes[ face.a ];
			face.b = changes[ face.b ];
			face.c = changes[ face.c ];

			indices = [ face.a, face.b, face.c ];

			// if any duplicate vertices are found in a Face3
			// we have to remove the face as nothing can be saved
			for ( var n = 0; n < 3; n ++ ) {

				if ( indices[ n ] === indices[ ( n + 1 ) % 3 ] ) {

					faceIndicesToRemove.push( i );
					break;

				}

			}

		}

		for ( i = faceIndicesToRemove.length - 1; i >= 0; i -- ) {

			var idx = faceIndicesToRemove[ i ];

			this.faces.splice( idx, 1 );

			for ( j = 0, jl = this.faceVertexUvs.length; j < jl; j ++ ) {

				this.faceVertexUvs[ j ].splice( idx, 1 );

			}

		}

		// Use unique set of vertices

		var diff = this.vertices.length - unique.length;
		this.vertices = unique;
		return diff;

	},

	sortFacesByMaterialIndex: function () {

		var faces = this.faces;
		var length = faces.length;

		// tag faces

		for ( var i = 0; i < length; i ++ ) {

			faces[ i ]._id = i;

		}

		// sort faces

		function materialIndexSort( a, b ) {

			return a.materialIndex - b.materialIndex;

		}

		faces.sort( materialIndexSort );

		// sort uvs

		var uvs1 = this.faceVertexUvs[ 0 ];
		var uvs2 = this.faceVertexUvs[ 1 ];

		var newUvs1, newUvs2;

		if ( uvs1 && uvs1.length === length ) newUvs1 = [];
		if ( uvs2 && uvs2.length === length ) newUvs2 = [];

		for ( var i = 0; i < length; i ++ ) {

			var id = faces[ i ]._id;

			if ( newUvs1 ) newUvs1.push( uvs1[ id ] );
			if ( newUvs2 ) newUvs2.push( uvs2[ id ] );

		}

		if ( newUvs1 ) this.faceVertexUvs[ 0 ] = newUvs1;
		if ( newUvs2 ) this.faceVertexUvs[ 1 ] = newUvs2;

	},

	toJSON: function () {

		var data = {
			metadata: {
				version: 4.5,
				type: 'Geometry',
				generator: 'Geometry.toJSON'
			}
		};

		// standard Geometry serialization

		data.uuid = this.uuid;
		data.type = this.type;
		if ( this.name !== '' ) data.name = this.name;

		if ( this.parameters !== undefined ) {

			var parameters = this.parameters;

			for ( var key in parameters ) {

				if ( parameters[ key ] !== undefined ) data[ key ] = parameters[ key ];

			}

			return data;

		}

		var vertices = [];

		for ( var i = 0; i < this.vertices.length; i ++ ) {

			var vertex = this.vertices[ i ];
			vertices.push( vertex.x, vertex.y, vertex.z );

		}

		var faces = [];
		var normals = [];
		var normalsHash = {};
		var colors = [];
		var colorsHash = {};
		var uvs = [];
		var uvsHash = {};

		for ( var i = 0; i < this.faces.length; i ++ ) {

			var face = this.faces[ i ];

			var hasMaterial = true;
			var hasFaceUv = false; // deprecated
			var hasFaceVertexUv = this.faceVertexUvs[ 0 ][ i ] !== undefined;
			var hasFaceNormal = face.normal.length() > 0;
			var hasFaceVertexNormal = face.vertexNormals.length > 0;
			var hasFaceColor = face.color.r !== 1 || face.color.g !== 1 || face.color.b !== 1;
			var hasFaceVertexColor = face.vertexColors.length > 0;

			var faceType = 0;

			faceType = setBit( faceType, 0, 0 ); // isQuad
			faceType = setBit( faceType, 1, hasMaterial );
			faceType = setBit( faceType, 2, hasFaceUv );
			faceType = setBit( faceType, 3, hasFaceVertexUv );
			faceType = setBit( faceType, 4, hasFaceNormal );
			faceType = setBit( faceType, 5, hasFaceVertexNormal );
			faceType = setBit( faceType, 6, hasFaceColor );
			faceType = setBit( faceType, 7, hasFaceVertexColor );

			faces.push( faceType );
			faces.push( face.a, face.b, face.c );
			faces.push( face.materialIndex );

			if ( hasFaceVertexUv ) {

				var faceVertexUvs = this.faceVertexUvs[ 0 ][ i ];

				faces.push(
					getUvIndex( faceVertexUvs[ 0 ] ),
					getUvIndex( faceVertexUvs[ 1 ] ),
					getUvIndex( faceVertexUvs[ 2 ] )
				);

			}

			if ( hasFaceNormal ) {

				faces.push( getNormalIndex( face.normal ) );

			}

			if ( hasFaceVertexNormal ) {

				var vertexNormals = face.vertexNormals;

				faces.push(
					getNormalIndex( vertexNormals[ 0 ] ),
					getNormalIndex( vertexNormals[ 1 ] ),
					getNormalIndex( vertexNormals[ 2 ] )
				);

			}

			if ( hasFaceColor ) {

				faces.push( getColorIndex( face.color ) );

			}

			if ( hasFaceVertexColor ) {

				var vertexColors = face.vertexColors;

				faces.push(
					getColorIndex( vertexColors[ 0 ] ),
					getColorIndex( vertexColors[ 1 ] ),
					getColorIndex( vertexColors[ 2 ] )
				);

			}

		}

		function setBit( value, position, enabled ) {

			return enabled ? value | ( 1 << position ) : value & ( ~ ( 1 << position ) );

		}

		function getNormalIndex( normal ) {

			var hash = normal.x.toString() + normal.y.toString() + normal.z.toString();

			if ( normalsHash[ hash ] !== undefined ) {

				return normalsHash[ hash ];

			}

			normalsHash[ hash ] = normals.length / 3;
			normals.push( normal.x, normal.y, normal.z );

			return normalsHash[ hash ];

		}

		function getColorIndex( color ) {

			var hash = color.r.toString() + color.g.toString() + color.b.toString();

			if ( colorsHash[ hash ] !== undefined ) {

				return colorsHash[ hash ];

			}

			colorsHash[ hash ] = colors.length;
			colors.push( color.getHex() );

			return colorsHash[ hash ];

		}

		function getUvIndex( uv ) {

			var hash = uv.x.toString() + uv.y.toString();

			if ( uvsHash[ hash ] !== undefined ) {

				return uvsHash[ hash ];

			}

			uvsHash[ hash ] = uvs.length / 2;
			uvs.push( uv.x, uv.y );

			return uvsHash[ hash ];

		}

		data.data = {};

		data.data.vertices = vertices;
		data.data.normals = normals;
		if ( colors.length > 0 ) data.data.colors = colors;
		if ( uvs.length > 0 ) data.data.uvs = [ uvs ]; // temporal backward compatibility
		data.data.faces = faces;

		return data;

	},

	clone: function () {

		/*
		 // Handle primitives

		 var parameters = this.parameters;

		 if ( parameters !== undefined ) {

		 var values = [];

		 for ( var key in parameters ) {

		 values.push( parameters[ key ] );

		 }

		 var geometry = Object.create( this.constructor.prototype );
		 this.constructor.apply( geometry, values );
		 return geometry;

		 }

		 return new this.constructor().copy( this );
		 */

		return new Geometry().copy( this );

	},

	copy: function ( source ) {

		var i, il, j, jl, k, kl;

		// reset

		this.vertices = [];
		this.colors = [];
		this.faces = [];
		this.faceVertexUvs = [[]];
		this.morphTargets = [];
		this.morphNormals = [];
		this.skinWeights = [];
		this.skinIndices = [];
		this.lineDistances = [];
		this.boundingBox = null;
		this.boundingSphere = null;

		// name

		this.name = source.name;

		// vertices

		var vertices = source.vertices;

		for ( i = 0, il = vertices.length; i < il; i ++ ) {

			this.vertices.push( vertices[ i ].clone() );

		}

		// colors

		var colors = source.colors;

		for ( i = 0, il = colors.length; i < il; i ++ ) {

			this.colors.push( colors[ i ].clone() );

		}

		// faces

		var faces = source.faces;

		for ( i = 0, il = faces.length; i < il; i ++ ) {

			this.faces.push( faces[ i ].clone() );

		}

		// face vertex uvs

		for ( i = 0, il = source.faceVertexUvs.length; i < il; i ++ ) {

			var faceVertexUvs = source.faceVertexUvs[ i ];

			if ( this.faceVertexUvs[ i ] === undefined ) {

				this.faceVertexUvs[ i ] = [];

			}

			for ( j = 0, jl = faceVertexUvs.length; j < jl; j ++ ) {

				var uvs = faceVertexUvs[ j ], uvsCopy = [];

				for ( k = 0, kl = uvs.length; k < kl; k ++ ) {

					var uv = uvs[ k ];

					uvsCopy.push( uv.clone() );

				}

				this.faceVertexUvs[ i ].push( uvsCopy );

			}

		}

		// morph targets

		var morphTargets = source.morphTargets;

		for ( i = 0, il = morphTargets.length; i < il; i ++ ) {

			var morphTarget = {};
			morphTarget.name = morphTargets[ i ].name;

			// vertices

			if ( morphTargets[ i ].vertices !== undefined ) {

				morphTarget.vertices = [];

				for ( j = 0, jl = morphTargets[ i ].vertices.length; j < jl; j ++ ) {

					morphTarget.vertices.push( morphTargets[ i ].vertices[ j ].clone() );

				}

			}

			// normals

			if ( morphTargets[ i ].normals !== undefined ) {

				morphTarget.normals = [];

				for ( j = 0, jl = morphTargets[ i ].normals.length; j < jl; j ++ ) {

					morphTarget.normals.push( morphTargets[ i ].normals[ j ].clone() );

				}

			}

			this.morphTargets.push( morphTarget );

		}

		// morph normals

		var morphNormals = source.morphNormals;

		for ( i = 0, il = morphNormals.length; i < il; i ++ ) {

			var morphNormal = {};

			// vertex normals

			if ( morphNormals[ i ].vertexNormals !== undefined ) {

				morphNormal.vertexNormals = [];

				for ( j = 0, jl = morphNormals[ i ].vertexNormals.length; j < jl; j ++ ) {

					var srcVertexNormal = morphNormals[ i ].vertexNormals[ j ];
					var destVertexNormal = {};

					destVertexNormal.a = srcVertexNormal.a.clone();
					destVertexNormal.b = srcVertexNormal.b.clone();
					destVertexNormal.c = srcVertexNormal.c.clone();

					morphNormal.vertexNormals.push( destVertexNormal );

				}

			}

			// face normals

			if ( morphNormals[ i ].faceNormals !== undefined ) {

				morphNormal.faceNormals = [];

				for ( j = 0, jl = morphNormals[ i ].faceNormals.length; j < jl; j ++ ) {

					morphNormal.faceNormals.push( morphNormals[ i ].faceNormals[ j ].clone() );

				}

			}

			this.morphNormals.push( morphNormal );

		}

		// skin weights

		var skinWeights = source.skinWeights;

		for ( i = 0, il = skinWeights.length; i < il; i ++ ) {

			this.skinWeights.push( skinWeights[ i ].clone() );

		}

		// skin indices

		var skinIndices = source.skinIndices;

		for ( i = 0, il = skinIndices.length; i < il; i ++ ) {

			this.skinIndices.push( skinIndices[ i ].clone() );

		}

		// line distances

		var lineDistances = source.lineDistances;

		for ( i = 0, il = lineDistances.length; i < il; i ++ ) {

			this.lineDistances.push( lineDistances[ i ] );

		}

		// bounding box

		var boundingBox = source.boundingBox;

		if ( boundingBox !== null ) {

			this.boundingBox = boundingBox.clone();

		}

		// bounding sphere

		var boundingSphere = source.boundingSphere;

		if ( boundingSphere !== null ) {

			this.boundingSphere = boundingSphere.clone();

		}

		// update flags

		this.elementsNeedUpdate = source.elementsNeedUpdate;
		this.verticesNeedUpdate = source.verticesNeedUpdate;
		this.uvsNeedUpdate = source.uvsNeedUpdate;
		this.normalsNeedUpdate = source.normalsNeedUpdate;
		this.colorsNeedUpdate = source.colorsNeedUpdate;
		this.lineDistancesNeedUpdate = source.lineDistancesNeedUpdate;
		this.groupsNeedUpdate = source.groupsNeedUpdate;

		return this;

	},

	dispose: function () {

		this.dispatchEvent( { type: 'dispose' } );

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 */

function BufferAttribute( array, itemSize, normalized ) {

	if ( Array.isArray( array ) ) {

		throw new TypeError( 'THREE.BufferAttribute: array should be a Typed Array.' );

	}

	this.uuid = _Math.generateUUID();
	this.name = '';

	this.array = array;
	this.itemSize = itemSize;
	this.count = array !== undefined ? array.length / itemSize : 0;
	this.normalized = normalized === true;

	this.dynamic = false;
	this.updateRange = { offset: 0, count: - 1 };

	this.onUploadCallback = function () {};

	this.version = 0;

}

Object.defineProperty( BufferAttribute.prototype, 'needsUpdate', {

	set: function ( value ) {

		if ( value === true ) this.version ++;

	}

} );

Object.assign( BufferAttribute.prototype, {

	isBufferAttribute: true,

	setArray: function ( array ) {

		if ( Array.isArray( array ) ) {

			throw new TypeError( 'THREE.BufferAttribute: array should be a Typed Array.' );

		}

		this.count = array !== undefined ? array.length / this.itemSize : 0;
		this.array = array;

	},

	setDynamic: function ( value ) {

		this.dynamic = value;

		return this;

	},

	copy: function ( source ) {

		this.array = new source.array.constructor( source.array );
		this.itemSize = source.itemSize;
		this.count = source.count;
		this.normalized = source.normalized;

		this.dynamic = source.dynamic;

		return this;

	},

	copyAt: function ( index1, attribute, index2 ) {

		index1 *= this.itemSize;
		index2 *= attribute.itemSize;

		for ( var i = 0, l = this.itemSize; i < l; i ++ ) {

			this.array[ index1 + i ] = attribute.array[ index2 + i ];

		}

		return this;

	},

	copyArray: function ( array ) {

		this.array.set( array );

		return this;

	},

	copyColorsArray: function ( colors ) {

		var array = this.array, offset = 0;

		for ( var i = 0, l = colors.length; i < l; i ++ ) {

			var color = colors[ i ];

			if ( color === undefined ) {

				console.warn( 'THREE.BufferAttribute.copyColorsArray(): color is undefined', i );
				color = new Color();

			}

			array[ offset ++ ] = color.r;
			array[ offset ++ ] = color.g;
			array[ offset ++ ] = color.b;

		}

		return this;

	},

	copyIndicesArray: function ( indices ) {

		var array = this.array, offset = 0;

		for ( var i = 0, l = indices.length; i < l; i ++ ) {

			var index = indices[ i ];

			array[ offset ++ ] = index.a;
			array[ offset ++ ] = index.b;
			array[ offset ++ ] = index.c;

		}

		return this;

	},

	copyVector2sArray: function ( vectors ) {

		var array = this.array, offset = 0;

		for ( var i = 0, l = vectors.length; i < l; i ++ ) {

			var vector = vectors[ i ];

			if ( vector === undefined ) {

				console.warn( 'THREE.BufferAttribute.copyVector2sArray(): vector is undefined', i );
				vector = new Vector2();

			}

			array[ offset ++ ] = vector.x;
			array[ offset ++ ] = vector.y;

		}

		return this;

	},

	copyVector3sArray: function ( vectors ) {

		var array = this.array, offset = 0;

		for ( var i = 0, l = vectors.length; i < l; i ++ ) {

			var vector = vectors[ i ];

			if ( vector === undefined ) {

				console.warn( 'THREE.BufferAttribute.copyVector3sArray(): vector is undefined', i );
				vector = new Vector3();

			}

			array[ offset ++ ] = vector.x;
			array[ offset ++ ] = vector.y;
			array[ offset ++ ] = vector.z;

		}

		return this;

	},

	copyVector4sArray: function ( vectors ) {

		var array = this.array, offset = 0;

		for ( var i = 0, l = vectors.length; i < l; i ++ ) {

			var vector = vectors[ i ];

			if ( vector === undefined ) {

				console.warn( 'THREE.BufferAttribute.copyVector4sArray(): vector is undefined', i );
				vector = new Vector4();

			}

			array[ offset ++ ] = vector.x;
			array[ offset ++ ] = vector.y;
			array[ offset ++ ] = vector.z;
			array[ offset ++ ] = vector.w;

		}

		return this;

	},

	set: function ( value, offset ) {

		if ( offset === undefined ) offset = 0;

		this.array.set( value, offset );

		return this;

	},

	getX: function ( index ) {

		return this.array[ index * this.itemSize ];

	},

	setX: function ( index, x ) {

		this.array[ index * this.itemSize ] = x;

		return this;

	},

	getY: function ( index ) {

		return this.array[ index * this.itemSize + 1 ];

	},

	setY: function ( index, y ) {

		this.array[ index * this.itemSize + 1 ] = y;

		return this;

	},

	getZ: function ( index ) {

		return this.array[ index * this.itemSize + 2 ];

	},

	setZ: function ( index, z ) {

		this.array[ index * this.itemSize + 2 ] = z;

		return this;

	},

	getW: function ( index ) {

		return this.array[ index * this.itemSize + 3 ];

	},

	setW: function ( index, w ) {

		this.array[ index * this.itemSize + 3 ] = w;

		return this;

	},

	setXY: function ( index, x, y ) {

		index *= this.itemSize;

		this.array[ index + 0 ] = x;
		this.array[ index + 1 ] = y;

		return this;

	},

	setXYZ: function ( index, x, y, z ) {

		index *= this.itemSize;

		this.array[ index + 0 ] = x;
		this.array[ index + 1 ] = y;
		this.array[ index + 2 ] = z;

		return this;

	},

	setXYZW: function ( index, x, y, z, w ) {

		index *= this.itemSize;

		this.array[ index + 0 ] = x;
		this.array[ index + 1 ] = y;
		this.array[ index + 2 ] = z;
		this.array[ index + 3 ] = w;

		return this;

	},

	onUpload: function ( callback ) {

		this.onUploadCallback = callback;

		return this;

	},

	clone: function () {

		return new this.constructor( this.array, this.itemSize ).copy( this );

	}

} );

function Uint16BufferAttribute( array, itemSize ) {

	BufferAttribute.call( this, new Uint16Array( array ), itemSize );

}

Uint16BufferAttribute.prototype = Object.create( BufferAttribute.prototype );
Uint16BufferAttribute.prototype.constructor = Uint16BufferAttribute;


function Uint32BufferAttribute( array, itemSize ) {

	BufferAttribute.call( this, new Uint32Array( array ), itemSize );

}

Uint32BufferAttribute.prototype = Object.create( BufferAttribute.prototype );
Uint32BufferAttribute.prototype.constructor = Uint32BufferAttribute;


function Float32BufferAttribute( array, itemSize ) {

	BufferAttribute.call( this, new Float32Array( array ), itemSize );

}

Float32BufferAttribute.prototype = Object.create( BufferAttribute.prototype );
Float32BufferAttribute.prototype.constructor = Float32BufferAttribute;

/**
 * @author mrdoob / http://mrdoob.com/
 */

function DirectGeometry() {

	this.indices = [];
	this.vertices = [];
	this.normals = [];
	this.colors = [];
	this.uvs = [];
	this.uvs2 = [];

	this.groups = [];

	this.morphTargets = {};

	this.skinWeights = [];
	this.skinIndices = [];

	// this.lineDistances = [];

	this.boundingBox = null;
	this.boundingSphere = null;

	// update flags

	this.verticesNeedUpdate = false;
	this.normalsNeedUpdate = false;
	this.colorsNeedUpdate = false;
	this.uvsNeedUpdate = false;
	this.groupsNeedUpdate = false;

}

Object.assign( DirectGeometry.prototype, {

	computeGroups: function ( geometry ) {

		var group;
		var groups = [];
		var materialIndex = undefined;

		var faces = geometry.faces;

		for ( var i = 0; i < faces.length; i ++ ) {

			var face = faces[ i ];

			// materials

			if ( face.materialIndex !== materialIndex ) {

				materialIndex = face.materialIndex;

				if ( group !== undefined ) {

					group.count = ( i * 3 ) - group.start;
					groups.push( group );

				}

				group = {
					start: i * 3,
					materialIndex: materialIndex
				};

			}

		}

		if ( group !== undefined ) {

			group.count = ( i * 3 ) - group.start;
			groups.push( group );

		}

		this.groups = groups;

	},

	fromGeometry: function ( geometry ) {

		var faces = geometry.faces;
		var vertices = geometry.vertices;
		var faceVertexUvs = geometry.faceVertexUvs;

		var hasFaceVertexUv = faceVertexUvs[ 0 ] && faceVertexUvs[ 0 ].length > 0;
		var hasFaceVertexUv2 = faceVertexUvs[ 1 ] && faceVertexUvs[ 1 ].length > 0;

		// morphs

		var morphTargets = geometry.morphTargets;
		var morphTargetsLength = morphTargets.length;

		var morphTargetsPosition;

		if ( morphTargetsLength > 0 ) {

			morphTargetsPosition = [];

			for ( var i = 0; i < morphTargetsLength; i ++ ) {

				morphTargetsPosition[ i ] = [];

			}

			this.morphTargets.position = morphTargetsPosition;

		}

		var morphNormals = geometry.morphNormals;
		var morphNormalsLength = morphNormals.length;

		var morphTargetsNormal;

		if ( morphNormalsLength > 0 ) {

			morphTargetsNormal = [];

			for ( var i = 0; i < morphNormalsLength; i ++ ) {

				morphTargetsNormal[ i ] = [];

			}

			this.morphTargets.normal = morphTargetsNormal;

		}

		// skins

		var skinIndices = geometry.skinIndices;
		var skinWeights = geometry.skinWeights;

		var hasSkinIndices = skinIndices.length === vertices.length;
		var hasSkinWeights = skinWeights.length === vertices.length;

		//

		for ( var i = 0; i < faces.length; i ++ ) {

			var face = faces[ i ];

			this.vertices.push( vertices[ face.a ], vertices[ face.b ], vertices[ face.c ] );

			var vertexNormals = face.vertexNormals;

			if ( vertexNormals.length === 3 ) {

				this.normals.push( vertexNormals[ 0 ], vertexNormals[ 1 ], vertexNormals[ 2 ] );

			} else {

				var normal = face.normal;

				this.normals.push( normal, normal, normal );

			}

			var vertexColors = face.vertexColors;

			if ( vertexColors.length === 3 ) {

				this.colors.push( vertexColors[ 0 ], vertexColors[ 1 ], vertexColors[ 2 ] );

			} else {

				var color = face.color;

				this.colors.push( color, color, color );

			}

			if ( hasFaceVertexUv === true ) {

				var vertexUvs = faceVertexUvs[ 0 ][ i ];

				if ( vertexUvs !== undefined ) {

					this.uvs.push( vertexUvs[ 0 ], vertexUvs[ 1 ], vertexUvs[ 2 ] );

				} else {

					console.warn( 'THREE.DirectGeometry.fromGeometry(): Undefined vertexUv ', i );

					this.uvs.push( new Vector2(), new Vector2(), new Vector2() );

				}

			}

			if ( hasFaceVertexUv2 === true ) {

				var vertexUvs = faceVertexUvs[ 1 ][ i ];

				if ( vertexUvs !== undefined ) {

					this.uvs2.push( vertexUvs[ 0 ], vertexUvs[ 1 ], vertexUvs[ 2 ] );

				} else {

					console.warn( 'THREE.DirectGeometry.fromGeometry(): Undefined vertexUv2 ', i );

					this.uvs2.push( new Vector2(), new Vector2(), new Vector2() );

				}

			}

			// morphs

			for ( var j = 0; j < morphTargetsLength; j ++ ) {

				var morphTarget = morphTargets[ j ].vertices;

				morphTargetsPosition[ j ].push( morphTarget[ face.a ], morphTarget[ face.b ], morphTarget[ face.c ] );

			}

			for ( var j = 0; j < morphNormalsLength; j ++ ) {

				var morphNormal = morphNormals[ j ].vertexNormals[ i ];

				morphTargetsNormal[ j ].push( morphNormal.a, morphNormal.b, morphNormal.c );

			}

			// skins

			if ( hasSkinIndices ) {

				this.skinIndices.push( skinIndices[ face.a ], skinIndices[ face.b ], skinIndices[ face.c ] );

			}

			if ( hasSkinWeights ) {

				this.skinWeights.push( skinWeights[ face.a ], skinWeights[ face.b ], skinWeights[ face.c ] );

			}

		}

		this.computeGroups( geometry );

		this.verticesNeedUpdate = geometry.verticesNeedUpdate;
		this.normalsNeedUpdate = geometry.normalsNeedUpdate;
		this.colorsNeedUpdate = geometry.colorsNeedUpdate;
		this.uvsNeedUpdate = geometry.uvsNeedUpdate;
		this.groupsNeedUpdate = geometry.groupsNeedUpdate;

		return this;

	}

} );

function arrayMax( array ) {

	if ( array.length === 0 ) return - Infinity;

	var max = array[ 0 ];

	for ( var i = 1, l = array.length; i < l; ++ i ) {

		if ( array[ i ] > max ) max = array[ i ];

	}

	return max;

}

/**
 * @author alteredq / http://alteredqualia.com/
 * @author mrdoob / http://mrdoob.com/
 */

function BufferGeometry() {

	Object.defineProperty( this, 'id', { value: GeometryIdCount() } );

	this.uuid = _Math.generateUUID();

	this.name = '';
	this.type = 'BufferGeometry';

	this.index = null;
	this.attributes = {};

	this.morphAttributes = {};

	this.groups = [];

	this.boundingBox = null;
	this.boundingSphere = null;

	this.drawRange = { start: 0, count: Infinity };

}

BufferGeometry.MaxIndex = 65535;

Object.assign( BufferGeometry.prototype, EventDispatcher.prototype, {

	isBufferGeometry: true,

	getIndex: function () {

		return this.index;

	},

	setIndex: function ( index ) {

		if ( Array.isArray( index ) ) {

			this.index = new ( arrayMax( index ) > 65535 ? Uint32BufferAttribute : Uint16BufferAttribute )( index, 1 );

		} else {

			this.index = index;

		}

	},

	addAttribute: function ( name, attribute ) {

		if ( ! ( attribute && attribute.isBufferAttribute ) && ! ( attribute && attribute.isInterleavedBufferAttribute ) ) {

			console.warn( 'THREE.BufferGeometry: .addAttribute() now expects ( name, attribute ).' );

			this.addAttribute( name, new BufferAttribute( arguments[ 1 ], arguments[ 2 ] ) );

			return;

		}

		if ( name === 'index' ) {

			console.warn( 'THREE.BufferGeometry.addAttribute: Use .setIndex() for index attribute.' );
			this.setIndex( attribute );

			return;

		}

		this.attributes[ name ] = attribute;

		return this;

	},

	getAttribute: function ( name ) {

		return this.attributes[ name ];

	},

	removeAttribute: function ( name ) {

		delete this.attributes[ name ];

		return this;

	},

	addGroup: function ( start, count, materialIndex ) {

		this.groups.push( {

			start: start,
			count: count,
			materialIndex: materialIndex !== undefined ? materialIndex : 0

		} );

	},

	clearGroups: function () {

		this.groups = [];

	},

	setDrawRange: function ( start, count ) {

		this.drawRange.start = start;
		this.drawRange.count = count;

	},

	applyMatrix: function ( matrix ) {

		var position = this.attributes.position;

		if ( position !== undefined ) {

			matrix.applyToBufferAttribute( position );
			position.needsUpdate = true;

		}

		var normal = this.attributes.normal;

		if ( normal !== undefined ) {

			var normalMatrix = new Matrix3().getNormalMatrix( matrix );

			normalMatrix.applyToBufferAttribute( normal );
			normal.needsUpdate = true;

		}

		if ( this.boundingBox !== null ) {

			this.computeBoundingBox();

		}

		if ( this.boundingSphere !== null ) {

			this.computeBoundingSphere();

		}

		return this;

	},

	rotateX: function () {

		// rotate geometry around world x-axis

		var m1 = new Matrix4();

		return function rotateX( angle ) {

			m1.makeRotationX( angle );

			this.applyMatrix( m1 );

			return this;

		};

	}(),

	rotateY: function () {

		// rotate geometry around world y-axis

		var m1 = new Matrix4();

		return function rotateY( angle ) {

			m1.makeRotationY( angle );

			this.applyMatrix( m1 );

			return this;

		};

	}(),

	rotateZ: function () {

		// rotate geometry around world z-axis

		var m1 = new Matrix4();

		return function rotateZ( angle ) {

			m1.makeRotationZ( angle );

			this.applyMatrix( m1 );

			return this;

		};

	}(),

	translate: function () {

		// translate geometry

		var m1 = new Matrix4();

		return function translate( x, y, z ) {

			m1.makeTranslation( x, y, z );

			this.applyMatrix( m1 );

			return this;

		};

	}(),

	scale: function () {

		// scale geometry

		var m1 = new Matrix4();

		return function scale( x, y, z ) {

			m1.makeScale( x, y, z );

			this.applyMatrix( m1 );

			return this;

		};

	}(),

	lookAt: function () {

		var obj = new Object3D();

		return function lookAt( vector ) {

			obj.lookAt( vector );

			obj.updateMatrix();

			this.applyMatrix( obj.matrix );

		};

	}(),

	center: function () {

		this.computeBoundingBox();

		var offset = this.boundingBox.getCenter().negate();

		this.translate( offset.x, offset.y, offset.z );

		return offset;

	},

	setFromObject: function ( object ) {

		// console.log( 'THREE.BufferGeometry.setFromObject(). Converting', object, this );

		var geometry = object.geometry;

		if ( object.isPoints || object.isLine ) {

			var positions = new Float32BufferAttribute( geometry.vertices.length * 3, 3 );
			var colors = new Float32BufferAttribute( geometry.colors.length * 3, 3 );

			this.addAttribute( 'position', positions.copyVector3sArray( geometry.vertices ) );
			this.addAttribute( 'color', colors.copyColorsArray( geometry.colors ) );

			if ( geometry.lineDistances && geometry.lineDistances.length === geometry.vertices.length ) {

				var lineDistances = new Float32BufferAttribute( geometry.lineDistances.length, 1 );

				this.addAttribute( 'lineDistance', lineDistances.copyArray( geometry.lineDistances ) );

			}

			if ( geometry.boundingSphere !== null ) {

				this.boundingSphere = geometry.boundingSphere.clone();

			}

			if ( geometry.boundingBox !== null ) {

				this.boundingBox = geometry.boundingBox.clone();

			}

		} else if ( object.isMesh ) {

			if ( geometry && geometry.isGeometry ) {

				this.fromGeometry( geometry );

			}

		}

		return this;

	},

	updateFromObject: function ( object ) {

		var geometry = object.geometry;

		if ( object.isMesh ) {

			var direct = geometry.__directGeometry;

			if ( geometry.elementsNeedUpdate === true ) {

				direct = undefined;
				geometry.elementsNeedUpdate = false;

			}

			if ( direct === undefined ) {

				return this.fromGeometry( geometry );

			}

			direct.verticesNeedUpdate = geometry.verticesNeedUpdate;
			direct.normalsNeedUpdate = geometry.normalsNeedUpdate;
			direct.colorsNeedUpdate = geometry.colorsNeedUpdate;
			direct.uvsNeedUpdate = geometry.uvsNeedUpdate;
			direct.groupsNeedUpdate = geometry.groupsNeedUpdate;

			geometry.verticesNeedUpdate = false;
			geometry.normalsNeedUpdate = false;
			geometry.colorsNeedUpdate = false;
			geometry.uvsNeedUpdate = false;
			geometry.groupsNeedUpdate = false;

			geometry = direct;

		}

		var attribute;

		if ( geometry.verticesNeedUpdate === true ) {

			attribute = this.attributes.position;

			if ( attribute !== undefined ) {

				attribute.copyVector3sArray( geometry.vertices );
				attribute.needsUpdate = true;

			}

			geometry.verticesNeedUpdate = false;

		}

		if ( geometry.normalsNeedUpdate === true ) {

			attribute = this.attributes.normal;

			if ( attribute !== undefined ) {

				attribute.copyVector3sArray( geometry.normals );
				attribute.needsUpdate = true;

			}

			geometry.normalsNeedUpdate = false;

		}

		if ( geometry.colorsNeedUpdate === true ) {

			attribute = this.attributes.color;

			if ( attribute !== undefined ) {

				attribute.copyColorsArray( geometry.colors );
				attribute.needsUpdate = true;

			}

			geometry.colorsNeedUpdate = false;

		}

		if ( geometry.uvsNeedUpdate ) {

			attribute = this.attributes.uv;

			if ( attribute !== undefined ) {

				attribute.copyVector2sArray( geometry.uvs );
				attribute.needsUpdate = true;

			}

			geometry.uvsNeedUpdate = false;

		}

		if ( geometry.lineDistancesNeedUpdate ) {

			attribute = this.attributes.lineDistance;

			if ( attribute !== undefined ) {

				attribute.copyArray( geometry.lineDistances );
				attribute.needsUpdate = true;

			}

			geometry.lineDistancesNeedUpdate = false;

		}

		if ( geometry.groupsNeedUpdate ) {

			geometry.computeGroups( object.geometry );
			this.groups = geometry.groups;

			geometry.groupsNeedUpdate = false;

		}

		return this;

	},

	fromGeometry: function ( geometry ) {

		geometry.__directGeometry = new DirectGeometry().fromGeometry( geometry );

		return this.fromDirectGeometry( geometry.__directGeometry );

	},

	fromDirectGeometry: function ( geometry ) {

		var positions = new Float32Array( geometry.vertices.length * 3 );
		this.addAttribute( 'position', new BufferAttribute( positions, 3 ).copyVector3sArray( geometry.vertices ) );

		if ( geometry.normals.length > 0 ) {

			var normals = new Float32Array( geometry.normals.length * 3 );
			this.addAttribute( 'normal', new BufferAttribute( normals, 3 ).copyVector3sArray( geometry.normals ) );

		}

		if ( geometry.colors.length > 0 ) {

			var colors = new Float32Array( geometry.colors.length * 3 );
			this.addAttribute( 'color', new BufferAttribute( colors, 3 ).copyColorsArray( geometry.colors ) );

		}

		if ( geometry.uvs.length > 0 ) {

			var uvs = new Float32Array( geometry.uvs.length * 2 );
			this.addAttribute( 'uv', new BufferAttribute( uvs, 2 ).copyVector2sArray( geometry.uvs ) );

		}

		if ( geometry.uvs2.length > 0 ) {

			var uvs2 = new Float32Array( geometry.uvs2.length * 2 );
			this.addAttribute( 'uv2', new BufferAttribute( uvs2, 2 ).copyVector2sArray( geometry.uvs2 ) );

		}

		if ( geometry.indices.length > 0 ) {

			var TypeArray = arrayMax( geometry.indices ) > 65535 ? Uint32Array : Uint16Array;
			var indices = new TypeArray( geometry.indices.length * 3 );
			this.setIndex( new BufferAttribute( indices, 1 ).copyIndicesArray( geometry.indices ) );

		}

		// groups

		this.groups = geometry.groups;

		// morphs

		for ( var name in geometry.morphTargets ) {

			var array = [];
			var morphTargets = geometry.morphTargets[ name ];

			for ( var i = 0, l = morphTargets.length; i < l; i ++ ) {

				var morphTarget = morphTargets[ i ];

				var attribute = new Float32BufferAttribute( morphTarget.length * 3, 3 );

				array.push( attribute.copyVector3sArray( morphTarget ) );

			}

			this.morphAttributes[ name ] = array;

		}

		// skinning

		if ( geometry.skinIndices.length > 0 ) {

			var skinIndices = new Float32BufferAttribute( geometry.skinIndices.length * 4, 4 );
			this.addAttribute( 'skinIndex', skinIndices.copyVector4sArray( geometry.skinIndices ) );

		}

		if ( geometry.skinWeights.length > 0 ) {

			var skinWeights = new Float32BufferAttribute( geometry.skinWeights.length * 4, 4 );
			this.addAttribute( 'skinWeight', skinWeights.copyVector4sArray( geometry.skinWeights ) );

		}

		//

		if ( geometry.boundingSphere !== null ) {

			this.boundingSphere = geometry.boundingSphere.clone();

		}

		if ( geometry.boundingBox !== null ) {

			this.boundingBox = geometry.boundingBox.clone();

		}

		return this;

	},

	computeBoundingBox: function () {

		if ( this.boundingBox === null ) {

			this.boundingBox = new Box3();

		}

		var position = this.attributes.position;

		if ( position !== undefined ) {

			this.boundingBox.setFromBufferAttribute( position );

		} else {

			this.boundingBox.makeEmpty();

		}

		if ( isNaN( this.boundingBox.min.x ) || isNaN( this.boundingBox.min.y ) || isNaN( this.boundingBox.min.z ) ) {

			console.error( 'THREE.BufferGeometry.computeBoundingBox: Computed min/max have NaN values. The "position" attribute is likely to have NaN values.', this );

		}

	},

	computeBoundingSphere: function () {

		var box = new Box3();
		var vector = new Vector3();

		return function computeBoundingSphere() {

			if ( this.boundingSphere === null ) {

				this.boundingSphere = new Sphere();

			}

			var position = this.attributes.position;

			if ( position ) {

				var center = this.boundingSphere.center;

				box.setFromBufferAttribute( position );
				box.getCenter( center );

				// hoping to find a boundingSphere with a radius smaller than the
				// boundingSphere of the boundingBox: sqrt(3) smaller in the best case

				var maxRadiusSq = 0;

				for ( var i = 0, il = position.count; i < il; i ++ ) {

					vector.x = position.getX( i );
					vector.y = position.getY( i );
					vector.z = position.getZ( i );
					maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( vector ) );

				}

				this.boundingSphere.radius = Math.sqrt( maxRadiusSq );

				if ( isNaN( this.boundingSphere.radius ) ) {

					console.error( 'THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.', this );

				}

			}

		};

	}(),

	computeFaceNormals: function () {

		// backwards compatibility

	},

	computeVertexNormals: function () {

		var index = this.index;
		var attributes = this.attributes;
		var groups = this.groups;

		if ( attributes.position ) {

			var positions = attributes.position.array;

			if ( attributes.normal === undefined ) {

				this.addAttribute( 'normal', new BufferAttribute( new Float32Array( positions.length ), 3 ) );

			} else {

				// reset existing normals to zero

				var array = attributes.normal.array;

				for ( var i = 0, il = array.length; i < il; i ++ ) {

					array[ i ] = 0;

				}

			}

			var normals = attributes.normal.array;

			var vA, vB, vC;
			var pA = new Vector3(), pB = new Vector3(), pC = new Vector3();
			var cb = new Vector3(), ab = new Vector3();

			// indexed elements

			if ( index ) {

				var indices = index.array;

				if ( groups.length === 0 ) {

					this.addGroup( 0, indices.length );

				}

				for ( var j = 0, jl = groups.length; j < jl; ++ j ) {

					var group = groups[ j ];

					var start = group.start;
					var count = group.count;

					for ( var i = start, il = start + count; i < il; i += 3 ) {

						vA = indices[ i + 0 ] * 3;
						vB = indices[ i + 1 ] * 3;
						vC = indices[ i + 2 ] * 3;

						pA.fromArray( positions, vA );
						pB.fromArray( positions, vB );
						pC.fromArray( positions, vC );

						cb.subVectors( pC, pB );
						ab.subVectors( pA, pB );
						cb.cross( ab );

						normals[ vA ] += cb.x;
						normals[ vA + 1 ] += cb.y;
						normals[ vA + 2 ] += cb.z;

						normals[ vB ] += cb.x;
						normals[ vB + 1 ] += cb.y;
						normals[ vB + 2 ] += cb.z;

						normals[ vC ] += cb.x;
						normals[ vC + 1 ] += cb.y;
						normals[ vC + 2 ] += cb.z;

					}

				}

			} else {

				// non-indexed elements (unconnected triangle soup)

				for ( var i = 0, il = positions.length; i < il; i += 9 ) {

					pA.fromArray( positions, i );
					pB.fromArray( positions, i + 3 );
					pC.fromArray( positions, i + 6 );

					cb.subVectors( pC, pB );
					ab.subVectors( pA, pB );
					cb.cross( ab );

					normals[ i ] = cb.x;
					normals[ i + 1 ] = cb.y;
					normals[ i + 2 ] = cb.z;

					normals[ i + 3 ] = cb.x;
					normals[ i + 4 ] = cb.y;
					normals[ i + 5 ] = cb.z;

					normals[ i + 6 ] = cb.x;
					normals[ i + 7 ] = cb.y;
					normals[ i + 8 ] = cb.z;

				}

			}

			this.normalizeNormals();

			attributes.normal.needsUpdate = true;

		}

	},

	merge: function ( geometry, offset ) {

		if ( ! ( geometry && geometry.isBufferGeometry ) ) {

			console.error( 'THREE.BufferGeometry.merge(): geometry not an instance of THREE.BufferGeometry.', geometry );
			return;

		}

		if ( offset === undefined ) offset = 0;

		var attributes = this.attributes;

		for ( var key in attributes ) {

			if ( geometry.attributes[ key ] === undefined ) continue;

			var attribute1 = attributes[ key ];
			var attributeArray1 = attribute1.array;

			var attribute2 = geometry.attributes[ key ];
			var attributeArray2 = attribute2.array;

			var attributeSize = attribute2.itemSize;

			for ( var i = 0, j = attributeSize * offset; i < attributeArray2.length; i ++, j ++ ) {

				attributeArray1[ j ] = attributeArray2[ i ];

			}

		}

		return this;

	},

	normalizeNormals: function () {

		var normals = this.attributes.normal;

		var x, y, z, n;

		for ( var i = 0, il = normals.count; i < il; i ++ ) {

			x = normals.getX( i );
			y = normals.getY( i );
			z = normals.getZ( i );

			n = 1.0 / Math.sqrt( x * x + y * y + z * z );

			normals.setXYZ( i, x * n, y * n, z * n );

		}

	},

	toNonIndexed: function () {

		if ( this.index === null ) {

			console.warn( 'THREE.BufferGeometry.toNonIndexed(): Geometry is already non-indexed.' );
			return this;

		}

		var geometry2 = new BufferGeometry();

		var indices = this.index.array;
		var attributes = this.attributes;

		for ( var name in attributes ) {

			var attribute = attributes[ name ];

			var array = attribute.array;
			var itemSize = attribute.itemSize;

			var array2 = new array.constructor( indices.length * itemSize );

			var index = 0, index2 = 0;

			for ( var i = 0, l = indices.length; i < l; i ++ ) {

				index = indices[ i ] * itemSize;

				for ( var j = 0; j < itemSize; j ++ ) {

					array2[ index2 ++ ] = array[ index ++ ];

				}

			}

			geometry2.addAttribute( name, new BufferAttribute( array2, itemSize ) );

		}

		return geometry2;

	},

	toJSON: function () {

		var data = {
			metadata: {
				version: 4.5,
				type: 'BufferGeometry',
				generator: 'BufferGeometry.toJSON'
			}
		};

		// standard BufferGeometry serialization

		data.uuid = this.uuid;
		data.type = this.type;
		if ( this.name !== '' ) data.name = this.name;

		if ( this.parameters !== undefined ) {

			var parameters = this.parameters;

			for ( var key in parameters ) {

				if ( parameters[ key ] !== undefined ) data[ key ] = parameters[ key ];

			}

			return data;

		}

		data.data = { attributes: {} };

		var index = this.index;

		if ( index !== null ) {

			var array = Array.prototype.slice.call( index.array );

			data.data.index = {
				type: index.array.constructor.name,
				array: array
			};

		}

		var attributes = this.attributes;

		for ( var key in attributes ) {

			var attribute = attributes[ key ];

			var array = Array.prototype.slice.call( attribute.array );

			data.data.attributes[ key ] = {
				itemSize: attribute.itemSize,
				type: attribute.array.constructor.name,
				array: array,
				normalized: attribute.normalized
			};

		}

		var groups = this.groups;

		if ( groups.length > 0 ) {

			data.data.groups = JSON.parse( JSON.stringify( groups ) );

		}

		var boundingSphere = this.boundingSphere;

		if ( boundingSphere !== null ) {

			data.data.boundingSphere = {
				center: boundingSphere.center.toArray(),
				radius: boundingSphere.radius
			};

		}

		return data;

	},

	clone: function () {

		/*
		 // Handle primitives

		 var parameters = this.parameters;

		 if ( parameters !== undefined ) {

		 var values = [];

		 for ( var key in parameters ) {

		 values.push( parameters[ key ] );

		 }

		 var geometry = Object.create( this.constructor.prototype );
		 this.constructor.apply( geometry, values );
		 return geometry;

		 }

		 return new this.constructor().copy( this );
		 */

		return new BufferGeometry().copy( this );

	},

	copy: function ( source ) {

		var name, i, l;

		// reset

		this.index = null;
		this.attributes = {};
		this.morphAttributes = {};
		this.groups = [];
		this.boundingBox = null;
		this.boundingSphere = null;

		// name

		this.name = source.name;

		// index

		var index = source.index;

		if ( index !== null ) {

			this.setIndex( index.clone() );

		}

		// attributes

		var attributes = source.attributes;

		for ( name in attributes ) {

			var attribute = attributes[ name ];
			this.addAttribute( name, attribute.clone() );

		}

		// morph attributes

		var morphAttributes = source.morphAttributes;

		for ( name in morphAttributes ) {

			var array = [];
			var morphAttribute = morphAttributes[ name ]; // morphAttribute: array of Float32BufferAttributes

			for ( i = 0, l = morphAttribute.length; i < l; i ++ ) {

				array.push( morphAttribute[ i ].clone() );

			}

			this.morphAttributes[ name ] = array;

		}

		// groups

		var groups = source.groups;

		for ( i = 0, l = groups.length; i < l; i ++ ) {

			var group = groups[ i ];
			this.addGroup( group.start, group.count, group.materialIndex );

		}

		// bounding box

		var boundingBox = source.boundingBox;

		if ( boundingBox !== null ) {

			this.boundingBox = boundingBox.clone();

		}

		// bounding sphere

		var boundingSphere = source.boundingSphere;

		if ( boundingSphere !== null ) {

			this.boundingSphere = boundingSphere.clone();

		}

		// draw range

		this.drawRange.start = source.drawRange.start;
		this.drawRange.count = source.drawRange.count;

		return this;

	},

	dispose: function () {

		this.dispatchEvent( { type: 'dispose' } );

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 */

/**
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 */

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 *
 * parameters = {
 *  color: <hex>,
 *  opacity: <float>,
 *  map: new THREE.Texture( <Image> ),
 *
 *  lightMap: new THREE.Texture( <Image> ),
 *  lightMapIntensity: <float>
 *
 *  aoMap: new THREE.Texture( <Image> ),
 *  aoMapIntensity: <float>
 *
 *  specularMap: new THREE.Texture( <Image> ),
 *
 *  alphaMap: new THREE.Texture( <Image> ),
 *
 *  envMap: new THREE.TextureCube( [posx, negx, posy, negy, posz, negz] ),
 *  combine: THREE.Multiply,
 *  reflectivity: <float>,
 *  refractionRatio: <float>,
 *
 *  shading: THREE.SmoothShading,
 *  depthTest: <bool>,
 *  depthWrite: <bool>,
 *
 *  wireframe: <boolean>,
 *  wireframeLinewidth: <float>,
 *
 *  skinning: <bool>,
 *  morphTargets: <bool>
 * }
 */

function MeshBasicMaterial( parameters ) {

	Material.call( this );

	this.type = 'MeshBasicMaterial';

	this.color = new Color( 0xffffff ); // emissive

	this.map = null;

	this.lightMap = null;
	this.lightMapIntensity = 1.0;

	this.aoMap = null;
	this.aoMapIntensity = 1.0;

	this.specularMap = null;

	this.alphaMap = null;

	this.envMap = null;
	this.combine = MultiplyOperation;
	this.reflectivity = 1;
	this.refractionRatio = 0.98;

	this.wireframe = false;
	this.wireframeLinewidth = 1;
	this.wireframeLinecap = 'round';
	this.wireframeLinejoin = 'round';

	this.skinning = false;
	this.morphTargets = false;

	this.lights = false;

	this.setValues( parameters );

}

MeshBasicMaterial.prototype = Object.create( Material.prototype );
MeshBasicMaterial.prototype.constructor = MeshBasicMaterial;

MeshBasicMaterial.prototype.isMeshBasicMaterial = true;

MeshBasicMaterial.prototype.copy = function ( source ) {

	Material.prototype.copy.call( this, source );

	this.color.copy( source.color );

	this.map = source.map;

	this.lightMap = source.lightMap;
	this.lightMapIntensity = source.lightMapIntensity;

	this.aoMap = source.aoMap;
	this.aoMapIntensity = source.aoMapIntensity;

	this.specularMap = source.specularMap;

	this.alphaMap = source.alphaMap;

	this.envMap = source.envMap;
	this.combine = source.combine;
	this.reflectivity = source.reflectivity;
	this.refractionRatio = source.refractionRatio;

	this.wireframe = source.wireframe;
	this.wireframeLinewidth = source.wireframeLinewidth;
	this.wireframeLinecap = source.wireframeLinecap;
	this.wireframeLinejoin = source.wireframeLinejoin;

	this.skinning = source.skinning;
	this.morphTargets = source.morphTargets;

	return this;

};

/**
 * @author bhouston / http://clara.io
 */

function Ray( origin, direction ) {

	this.origin = ( origin !== undefined ) ? origin : new Vector3();
	this.direction = ( direction !== undefined ) ? direction : new Vector3();

}

Object.assign( Ray.prototype, {

	set: function ( origin, direction ) {

		this.origin.copy( origin );
		this.direction.copy( direction );

		return this;

	},

	clone: function () {

		return new this.constructor().copy( this );

	},

	copy: function ( ray ) {

		this.origin.copy( ray.origin );
		this.direction.copy( ray.direction );

		return this;

	},

	at: function ( t, optionalTarget ) {

		var result = optionalTarget || new Vector3();

		return result.copy( this.direction ).multiplyScalar( t ).add( this.origin );

	},

	lookAt: function ( v ) {

		this.direction.copy( v ).sub( this.origin ).normalize();

		return this;

	},

	recast: function () {

		var v1 = new Vector3();

		return function recast( t ) {

			this.origin.copy( this.at( t, v1 ) );

			return this;

		};

	}(),

	closestPointToPoint: function ( point, optionalTarget ) {

		var result = optionalTarget || new Vector3();
		result.subVectors( point, this.origin );
		var directionDistance = result.dot( this.direction );

		if ( directionDistance < 0 ) {

			return result.copy( this.origin );

		}

		return result.copy( this.direction ).multiplyScalar( directionDistance ).add( this.origin );

	},

	distanceToPoint: function ( point ) {

		return Math.sqrt( this.distanceSqToPoint( point ) );

	},

	distanceSqToPoint: function () {

		var v1 = new Vector3();

		return function distanceSqToPoint( point ) {

			var directionDistance = v1.subVectors( point, this.origin ).dot( this.direction );

			// point behind the ray

			if ( directionDistance < 0 ) {

				return this.origin.distanceToSquared( point );

			}

			v1.copy( this.direction ).multiplyScalar( directionDistance ).add( this.origin );

			return v1.distanceToSquared( point );

		};

	}(),

	distanceSqToSegment: function () {

		var segCenter = new Vector3();
		var segDir = new Vector3();
		var diff = new Vector3();

		return function distanceSqToSegment( v0, v1, optionalPointOnRay, optionalPointOnSegment ) {

			// from http://www.geometrictools.com/GTEngine/Include/Mathematics/GteDistRaySegment.h
			// It returns the min distance between the ray and the segment
			// defined by v0 and v1
			// It can also set two optional targets :
			// - The closest point on the ray
			// - The closest point on the segment

			segCenter.copy( v0 ).add( v1 ).multiplyScalar( 0.5 );
			segDir.copy( v1 ).sub( v0 ).normalize();
			diff.copy( this.origin ).sub( segCenter );

			var segExtent = v0.distanceTo( v1 ) * 0.5;
			var a01 = - this.direction.dot( segDir );
			var b0 = diff.dot( this.direction );
			var b1 = - diff.dot( segDir );
			var c = diff.lengthSq();
			var det = Math.abs( 1 - a01 * a01 );
			var s0, s1, sqrDist, extDet;

			if ( det > 0 ) {

				// The ray and segment are not parallel.

				s0 = a01 * b1 - b0;
				s1 = a01 * b0 - b1;
				extDet = segExtent * det;

				if ( s0 >= 0 ) {

					if ( s1 >= - extDet ) {

						if ( s1 <= extDet ) {

							// region 0
							// Minimum at interior points of ray and segment.

							var invDet = 1 / det;
							s0 *= invDet;
							s1 *= invDet;
							sqrDist = s0 * ( s0 + a01 * s1 + 2 * b0 ) + s1 * ( a01 * s0 + s1 + 2 * b1 ) + c;

						} else {

							// region 1

							s1 = segExtent;
							s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
							sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

						}

					} else {

						// region 5

						s1 = - segExtent;
						s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
						sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

					}

				} else {

					if ( s1 <= - extDet ) {

						// region 4

						s0 = Math.max( 0, - ( - a01 * segExtent + b0 ) );
						s1 = ( s0 > 0 ) ? - segExtent : Math.min( Math.max( - segExtent, - b1 ), segExtent );
						sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

					} else if ( s1 <= extDet ) {

						// region 3

						s0 = 0;
						s1 = Math.min( Math.max( - segExtent, - b1 ), segExtent );
						sqrDist = s1 * ( s1 + 2 * b1 ) + c;

					} else {

						// region 2

						s0 = Math.max( 0, - ( a01 * segExtent + b0 ) );
						s1 = ( s0 > 0 ) ? segExtent : Math.min( Math.max( - segExtent, - b1 ), segExtent );
						sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

					}

				}

			} else {

				// Ray and segment are parallel.

				s1 = ( a01 > 0 ) ? - segExtent : segExtent;
				s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
				sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

			}

			if ( optionalPointOnRay ) {

				optionalPointOnRay.copy( this.direction ).multiplyScalar( s0 ).add( this.origin );

			}

			if ( optionalPointOnSegment ) {

				optionalPointOnSegment.copy( segDir ).multiplyScalar( s1 ).add( segCenter );

			}

			return sqrDist;

		};

	}(),

	intersectSphere: function () {

		var v1 = new Vector3();

		return function intersectSphere( sphere, optionalTarget ) {

			v1.subVectors( sphere.center, this.origin );
			var tca = v1.dot( this.direction );
			var d2 = v1.dot( v1 ) - tca * tca;
			var radius2 = sphere.radius * sphere.radius;

			if ( d2 > radius2 ) return null;

			var thc = Math.sqrt( radius2 - d2 );

			// t0 = first intersect point - entrance on front of sphere
			var t0 = tca - thc;

			// t1 = second intersect point - exit point on back of sphere
			var t1 = tca + thc;

			// test to see if both t0 and t1 are behind the ray - if so, return null
			if ( t0 < 0 && t1 < 0 ) return null;

			// test to see if t0 is behind the ray:
			// if it is, the ray is inside the sphere, so return the second exit point scaled by t1,
			// in order to always return an intersect point that is in front of the ray.
			if ( t0 < 0 ) return this.at( t1, optionalTarget );

			// else t0 is in front of the ray, so return the first collision point scaled by t0
			return this.at( t0, optionalTarget );

		};

	}(),

	intersectsSphere: function ( sphere ) {

		return this.distanceToPoint( sphere.center ) <= sphere.radius;

	},

	distanceToPlane: function ( plane ) {

		var denominator = plane.normal.dot( this.direction );

		if ( denominator === 0 ) {

			// line is coplanar, return origin
			if ( plane.distanceToPoint( this.origin ) === 0 ) {

				return 0;

			}

			// Null is preferable to undefined since undefined means.... it is undefined

			return null;

		}

		var t = - ( this.origin.dot( plane.normal ) + plane.constant ) / denominator;

		// Return if the ray never intersects the plane

		return t >= 0 ? t :  null;

	},

	intersectPlane: function ( plane, optionalTarget ) {

		var t = this.distanceToPlane( plane );

		if ( t === null ) {

			return null;

		}

		return this.at( t, optionalTarget );

	},

	intersectsPlane: function ( plane ) {

		// check if the ray lies on the plane first

		var distToPoint = plane.distanceToPoint( this.origin );

		if ( distToPoint === 0 ) {

			return true;

		}

		var denominator = plane.normal.dot( this.direction );

		if ( denominator * distToPoint < 0 ) {

			return true;

		}

		// ray origin is behind the plane (and is pointing behind it)

		return false;

	},

	intersectBox: function ( box, optionalTarget ) {

		var tmin, tmax, tymin, tymax, tzmin, tzmax;

		var invdirx = 1 / this.direction.x,
			invdiry = 1 / this.direction.y,
			invdirz = 1 / this.direction.z;

		var origin = this.origin;

		if ( invdirx >= 0 ) {

			tmin = ( box.min.x - origin.x ) * invdirx;
			tmax = ( box.max.x - origin.x ) * invdirx;

		} else {

			tmin = ( box.max.x - origin.x ) * invdirx;
			tmax = ( box.min.x - origin.x ) * invdirx;

		}

		if ( invdiry >= 0 ) {

			tymin = ( box.min.y - origin.y ) * invdiry;
			tymax = ( box.max.y - origin.y ) * invdiry;

		} else {

			tymin = ( box.max.y - origin.y ) * invdiry;
			tymax = ( box.min.y - origin.y ) * invdiry;

		}

		if ( ( tmin > tymax ) || ( tymin > tmax ) ) return null;

		// These lines also handle the case where tmin or tmax is NaN
		// (result of 0 * Infinity). x !== x returns true if x is NaN

		if ( tymin > tmin || tmin !== tmin ) tmin = tymin;

		if ( tymax < tmax || tmax !== tmax ) tmax = tymax;

		if ( invdirz >= 0 ) {

			tzmin = ( box.min.z - origin.z ) * invdirz;
			tzmax = ( box.max.z - origin.z ) * invdirz;

		} else {

			tzmin = ( box.max.z - origin.z ) * invdirz;
			tzmax = ( box.min.z - origin.z ) * invdirz;

		}

		if ( ( tmin > tzmax ) || ( tzmin > tmax ) ) return null;

		if ( tzmin > tmin || tmin !== tmin ) tmin = tzmin;

		if ( tzmax < tmax || tmax !== tmax ) tmax = tzmax;

		//return point closest to the ray (positive side)

		if ( tmax < 0 ) return null;

		return this.at( tmin >= 0 ? tmin : tmax, optionalTarget );

	},

	intersectsBox: ( function () {

		var v = new Vector3();

		return function intersectsBox( box ) {

			return this.intersectBox( box, v ) !== null;

		};

	} )(),

	intersectTriangle: function () {

		// Compute the offset origin, edges, and normal.
		var diff = new Vector3();
		var edge1 = new Vector3();
		var edge2 = new Vector3();
		var normal = new Vector3();

		return function intersectTriangle( a, b, c, backfaceCulling, optionalTarget ) {

			// from http://www.geometrictools.com/GTEngine/Include/Mathematics/GteIntrRay3Triangle3.h

			edge1.subVectors( b, a );
			edge2.subVectors( c, a );
			normal.crossVectors( edge1, edge2 );

			// Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
			// E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
			//   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
			//   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
			//   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
			var DdN = this.direction.dot( normal );
			var sign;

			if ( DdN > 0 ) {

				if ( backfaceCulling ) return null;
				sign = 1;

			} else if ( DdN < 0 ) {

				sign = - 1;
				DdN = - DdN;

			} else {

				return null;

			}

			diff.subVectors( this.origin, a );
			var DdQxE2 = sign * this.direction.dot( edge2.crossVectors( diff, edge2 ) );

			// b1 < 0, no intersection
			if ( DdQxE2 < 0 ) {

				return null;

			}

			var DdE1xQ = sign * this.direction.dot( edge1.cross( diff ) );

			// b2 < 0, no intersection
			if ( DdE1xQ < 0 ) {

				return null;

			}

			// b1+b2 > 1, no intersection
			if ( DdQxE2 + DdE1xQ > DdN ) {

				return null;

			}

			// Line intersects triangle, check if ray does.
			var QdN = - sign * diff.dot( normal );

			// t < 0, no intersection
			if ( QdN < 0 ) {

				return null;

			}

			// Ray intersects triangle.
			return this.at( QdN / DdN, optionalTarget );

		};

	}(),

	applyMatrix4: function ( matrix4 ) {

		this.origin.applyMatrix4( matrix4 );
		this.direction.transformDirection( matrix4 );

		return this;

	},

	equals: function ( ray ) {

		return ray.origin.equals( this.origin ) && ray.direction.equals( this.direction );

	}

} );

/**
 * @author bhouston / http://clara.io
 */

function Line3( start, end ) {

	this.start = ( start !== undefined ) ? start : new Vector3();
	this.end = ( end !== undefined ) ? end : new Vector3();

}

Object.assign( Line3.prototype, {

	set: function ( start, end ) {

		this.start.copy( start );
		this.end.copy( end );

		return this;

	},

	clone: function () {

		return new this.constructor().copy( this );

	},

	copy: function ( line ) {

		this.start.copy( line.start );
		this.end.copy( line.end );

		return this;

	},

	getCenter: function ( optionalTarget ) {

		var result = optionalTarget || new Vector3();
		return result.addVectors( this.start, this.end ).multiplyScalar( 0.5 );

	},

	delta: function ( optionalTarget ) {

		var result = optionalTarget || new Vector3();
		return result.subVectors( this.end, this.start );

	},

	distanceSq: function () {

		return this.start.distanceToSquared( this.end );

	},

	distance: function () {

		return this.start.distanceTo( this.end );

	},

	at: function ( t, optionalTarget ) {

		var result = optionalTarget || new Vector3();

		return this.delta( result ).multiplyScalar( t ).add( this.start );

	},

	closestPointToPointParameter: function () {

		var startP = new Vector3();
		var startEnd = new Vector3();

		return function closestPointToPointParameter( point, clampToLine ) {

			startP.subVectors( point, this.start );
			startEnd.subVectors( this.end, this.start );

			var startEnd2 = startEnd.dot( startEnd );
			var startEnd_startP = startEnd.dot( startP );

			var t = startEnd_startP / startEnd2;

			if ( clampToLine ) {

				t = _Math.clamp( t, 0, 1 );

			}

			return t;

		};

	}(),

	closestPointToPoint: function ( point, clampToLine, optionalTarget ) {

		var t = this.closestPointToPointParameter( point, clampToLine );

		var result = optionalTarget || new Vector3();

		return this.delta( result ).multiplyScalar( t ).add( this.start );

	},

	applyMatrix4: function ( matrix ) {

		this.start.applyMatrix4( matrix );
		this.end.applyMatrix4( matrix );

		return this;

	},

	equals: function ( line ) {

		return line.start.equals( this.start ) && line.end.equals( this.end );

	}

} );

/**
 * @author bhouston / http://clara.io
 * @author mrdoob / http://mrdoob.com/
 */

function Triangle( a, b, c ) {

	this.a = ( a !== undefined ) ? a : new Vector3();
	this.b = ( b !== undefined ) ? b : new Vector3();
	this.c = ( c !== undefined ) ? c : new Vector3();

}

Object.assign( Triangle, {

	normal: function () {

		var v0 = new Vector3();

		return function normal( a, b, c, optionalTarget ) {

			var result = optionalTarget || new Vector3();

			result.subVectors( c, b );
			v0.subVectors( a, b );
			result.cross( v0 );

			var resultLengthSq = result.lengthSq();
			if ( resultLengthSq > 0 ) {

				return result.multiplyScalar( 1 / Math.sqrt( resultLengthSq ) );

			}

			return result.set( 0, 0, 0 );

		};

	}(),

	// static/instance method to calculate barycentric coordinates
	// based on: http://www.blackpawn.com/texts/pointinpoly/default.html
	barycoordFromPoint: function () {

		var v0 = new Vector3();
		var v1 = new Vector3();
		var v2 = new Vector3();

		return function barycoordFromPoint( point, a, b, c, optionalTarget ) {

			v0.subVectors( c, a );
			v1.subVectors( b, a );
			v2.subVectors( point, a );

			var dot00 = v0.dot( v0 );
			var dot01 = v0.dot( v1 );
			var dot02 = v0.dot( v2 );
			var dot11 = v1.dot( v1 );
			var dot12 = v1.dot( v2 );

			var denom = ( dot00 * dot11 - dot01 * dot01 );

			var result = optionalTarget || new Vector3();

			// collinear or singular triangle
			if ( denom === 0 ) {

				// arbitrary location outside of triangle?
				// not sure if this is the best idea, maybe should be returning undefined
				return result.set( - 2, - 1, - 1 );

			}

			var invDenom = 1 / denom;
			var u = ( dot11 * dot02 - dot01 * dot12 ) * invDenom;
			var v = ( dot00 * dot12 - dot01 * dot02 ) * invDenom;

			// barycentric coordinates must always sum to 1
			return result.set( 1 - u - v, v, u );

		};

	}(),

	containsPoint: function () {

		var v1 = new Vector3();

		return function containsPoint( point, a, b, c ) {

			var result = Triangle.barycoordFromPoint( point, a, b, c, v1 );

			return ( result.x >= 0 ) && ( result.y >= 0 ) && ( ( result.x + result.y ) <= 1 );

		};

	}()

} );

Object.assign( Triangle.prototype, {

	set: function ( a, b, c ) {

		this.a.copy( a );
		this.b.copy( b );
		this.c.copy( c );

		return this;

	},

	setFromPointsAndIndices: function ( points, i0, i1, i2 ) {

		this.a.copy( points[ i0 ] );
		this.b.copy( points[ i1 ] );
		this.c.copy( points[ i2 ] );

		return this;

	},

	clone: function () {

		return new this.constructor().copy( this );

	},

	copy: function ( triangle ) {

		this.a.copy( triangle.a );
		this.b.copy( triangle.b );
		this.c.copy( triangle.c );

		return this;

	},

	area: function () {

		var v0 = new Vector3();
		var v1 = new Vector3();

		return function area() {

			v0.subVectors( this.c, this.b );
			v1.subVectors( this.a, this.b );

			return v0.cross( v1 ).length() * 0.5;

		};

	}(),

	midpoint: function ( optionalTarget ) {

		var result = optionalTarget || new Vector3();
		return result.addVectors( this.a, this.b ).add( this.c ).multiplyScalar( 1 / 3 );

	},

	normal: function ( optionalTarget ) {

		return Triangle.normal( this.a, this.b, this.c, optionalTarget );

	},

	plane: function ( optionalTarget ) {

		var result = optionalTarget || new Plane();

		return result.setFromCoplanarPoints( this.a, this.b, this.c );

	},

	barycoordFromPoint: function ( point, optionalTarget ) {

		return Triangle.barycoordFromPoint( point, this.a, this.b, this.c, optionalTarget );

	},

	containsPoint: function ( point ) {

		return Triangle.containsPoint( point, this.a, this.b, this.c );

	},

	closestPointToPoint: function () {

		var plane = new Plane();
		var edgeList = [ new Line3(), new Line3(), new Line3() ];
		var projectedPoint = new Vector3();
		var closestPoint = new Vector3();

		return function closestPointToPoint( point, optionalTarget ) {

			var result = optionalTarget || new Vector3();
			var minDistance = Infinity;

			// project the point onto the plane of the triangle

			plane.setFromCoplanarPoints( this.a, this.b, this.c );
			plane.projectPoint( point, projectedPoint );

			// check if the projection lies within the triangle

			if( this.containsPoint( projectedPoint ) === true ) {

				// if so, this is the closest point

				result.copy( projectedPoint );

			} else {

				// if not, the point falls outside the triangle. the result is the closest point to the triangle's edges or vertices

				edgeList[ 0 ].set( this.a, this.b );
				edgeList[ 1 ].set( this.b, this.c );
				edgeList[ 2 ].set( this.c, this.a );

				for( var i = 0; i < edgeList.length; i ++ ) {

					edgeList[ i ].closestPointToPoint( projectedPoint, true, closestPoint );

					var distance = projectedPoint.distanceToSquared( closestPoint );

					if( distance < minDistance ) {

						minDistance = distance;

						result.copy( closestPoint );

					}

				}

			}

			return result;

		};

	}(),

	equals: function ( triangle ) {

		return triangle.a.equals( this.a ) && triangle.b.equals( this.b ) && triangle.c.equals( this.c );

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author mikael emtinger / http://gomo.se/
 * @author jonobr1 / http://jonobr1.com/
 */

function Mesh( geometry, material ) {

	Object3D.call( this );

	this.type = 'Mesh';

	this.geometry = geometry !== undefined ? geometry : new BufferGeometry();
	this.material = material !== undefined ? material : new MeshBasicMaterial( { color: Math.random() * 0xffffff } );

	this.drawMode = TrianglesDrawMode;

	this.updateMorphTargets();

}

Mesh.prototype = Object.assign( Object.create( Object3D.prototype ), {

	constructor: Mesh,

	isMesh: true,

	setDrawMode: function ( value ) {

		this.drawMode = value;

	},

	copy: function ( source ) {

		Object3D.prototype.copy.call( this, source );

		this.drawMode = source.drawMode;

		return this;

	},

	updateMorphTargets: function () {

		var geometry = this.geometry;
		var m, ml, name;

		if ( geometry.isBufferGeometry ) {

			var morphAttributes = geometry.morphAttributes;
			var keys = Object.keys( morphAttributes );

			if ( keys.length > 0 ) {

				var morphAttribute = morphAttributes[ keys[ 0 ] ];

				if ( morphAttribute !== undefined ) {

					this.morphTargetInfluences = [];
					this.morphTargetDictionary = {};

					for ( m = 0, ml = morphAttribute.length; m < ml; m ++ ) {

						name = morphAttribute[ m ].name || String( m );

						this.morphTargetInfluences.push( 0 );
						this.morphTargetDictionary[ name ] = m;

					}

				}

			}

		} else {

			var morphTargets = geometry.morphTargets;

			if ( morphTargets !== undefined && morphTargets.length > 0 ) {

				this.morphTargetInfluences = [];
				this.morphTargetDictionary = {};

				for ( m = 0, ml = morphTargets.length; m < ml; m ++ ) {

					name = morphTargets[ m ].name || String( m );

					this.morphTargetInfluences.push( 0 );
					this.morphTargetDictionary[ name ] = m;

				}

			}

		}

	},

	raycast: ( function () {

		var inverseMatrix = new Matrix4();
		var ray = new Ray();
		var sphere = new Sphere();

		var vA = new Vector3();
		var vB = new Vector3();
		var vC = new Vector3();

		var tempA = new Vector3();
		var tempB = new Vector3();
		var tempC = new Vector3();

		var uvA = new Vector2();
		var uvB = new Vector2();
		var uvC = new Vector2();

		var barycoord = new Vector3();

		var intersectionPoint = new Vector3();
		var intersectionPointWorld = new Vector3();

		function uvIntersection( point, p1, p2, p3, uv1, uv2, uv3 ) {

			Triangle.barycoordFromPoint( point, p1, p2, p3, barycoord );

			uv1.multiplyScalar( barycoord.x );
			uv2.multiplyScalar( barycoord.y );
			uv3.multiplyScalar( barycoord.z );

			uv1.add( uv2 ).add( uv3 );

			return uv1.clone();

		}

		function checkIntersection( object, raycaster, ray, pA, pB, pC, point ) {

			var intersect;
			var material = object.material;

			if ( material.side === BackSide ) {

				intersect = ray.intersectTriangle( pC, pB, pA, true, point );

			} else {

				intersect = ray.intersectTriangle( pA, pB, pC, material.side !== DoubleSide, point );

			}

			if ( intersect === null ) return null;

			intersectionPointWorld.copy( point );
			intersectionPointWorld.applyMatrix4( object.matrixWorld );

			var distance = raycaster.ray.origin.distanceTo( intersectionPointWorld );

			if ( distance < raycaster.near || distance > raycaster.far ) return null;

			return {
				distance: distance,
				point: intersectionPointWorld.clone(),
				object: object
			};

		}

		function checkBufferGeometryIntersection( object, raycaster, ray, position, uv, a, b, c ) {

			vA.fromBufferAttribute( position, a );
			vB.fromBufferAttribute( position, b );
			vC.fromBufferAttribute( position, c );

			var intersection = checkIntersection( object, raycaster, ray, vA, vB, vC, intersectionPoint );

			if ( intersection ) {

				if ( uv ) {

					uvA.fromBufferAttribute( uv, a );
					uvB.fromBufferAttribute( uv, b );
					uvC.fromBufferAttribute( uv, c );

					intersection.uv = uvIntersection( intersectionPoint, vA, vB, vC, uvA, uvB, uvC );

				}

				intersection.face = new Face3( a, b, c, Triangle.normal( vA, vB, vC ) );
				intersection.faceIndex = a;

			}

			return intersection;

		}

		return function raycast( raycaster, intersects ) {

			var geometry = this.geometry;
			var material = this.material;
			var matrixWorld = this.matrixWorld;

			if ( material === undefined ) return;

			// Checking boundingSphere distance to ray

			if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();

			sphere.copy( geometry.boundingSphere );
			sphere.applyMatrix4( matrixWorld );

			if ( raycaster.ray.intersectsSphere( sphere ) === false ) return;

			//

			inverseMatrix.getInverse( matrixWorld );
			ray.copy( raycaster.ray ).applyMatrix4( inverseMatrix );

			// Check boundingBox before continuing

			if ( geometry.boundingBox !== null ) {

				if ( ray.intersectsBox( geometry.boundingBox ) === false ) return;

			}

			var intersection;

			if ( geometry.isBufferGeometry ) {

				var a, b, c;
				var index = geometry.index;
				var position = geometry.attributes.position;
				var uv = geometry.attributes.uv;
				var i, l;

				if ( index !== null ) {

					// indexed buffer geometry

					for ( i = 0, l = index.count; i < l; i += 3 ) {

						a = index.getX( i );
						b = index.getX( i + 1 );
						c = index.getX( i + 2 );

						intersection = checkBufferGeometryIntersection( this, raycaster, ray, position, uv, a, b, c );

						if ( intersection ) {

							intersection.faceIndex = Math.floor( i / 3 ); // triangle number in indices buffer semantics
							intersects.push( intersection );

						}

					}

				} else {

					// non-indexed buffer geometry

					for ( i = 0, l = position.count; i < l; i += 3 ) {

						a = i;
						b = i + 1;
						c = i + 2;

						intersection = checkBufferGeometryIntersection( this, raycaster, ray, position, uv, a, b, c );

						if ( intersection ) {

							intersection.index = a; // triangle number in positions buffer semantics
							intersects.push( intersection );

						}

					}

				}

			} else if ( geometry.isGeometry ) {

				var fvA, fvB, fvC;
				var isMultiMaterial = Array.isArray( material );

				var vertices = geometry.vertices;
				var faces = geometry.faces;
				var uvs;

				var faceVertexUvs = geometry.faceVertexUvs[ 0 ];
				if ( faceVertexUvs.length > 0 ) uvs = faceVertexUvs;

				for ( var f = 0, fl = faces.length; f < fl; f ++ ) {

					var face = faces[ f ];
					var faceMaterial = isMultiMaterial ? material[ face.materialIndex ] : material;

					if ( faceMaterial === undefined ) continue;

					fvA = vertices[ face.a ];
					fvB = vertices[ face.b ];
					fvC = vertices[ face.c ];

					if ( faceMaterial.morphTargets === true ) {

						var morphTargets = geometry.morphTargets;
						var morphInfluences = this.morphTargetInfluences;

						vA.set( 0, 0, 0 );
						vB.set( 0, 0, 0 );
						vC.set( 0, 0, 0 );

						for ( var t = 0, tl = morphTargets.length; t < tl; t ++ ) {

							var influence = morphInfluences[ t ];

							if ( influence === 0 ) continue;

							var targets = morphTargets[ t ].vertices;

							vA.addScaledVector( tempA.subVectors( targets[ face.a ], fvA ), influence );
							vB.addScaledVector( tempB.subVectors( targets[ face.b ], fvB ), influence );
							vC.addScaledVector( tempC.subVectors( targets[ face.c ], fvC ), influence );

						}

						vA.add( fvA );
						vB.add( fvB );
						vC.add( fvC );

						fvA = vA;
						fvB = vB;
						fvC = vC;

					}

					intersection = checkIntersection( this, raycaster, ray, fvA, fvB, fvC, intersectionPoint );

					if ( intersection ) {

						if ( uvs && uvs[ f ] ) {

							var uvs_f = uvs[ f ];
							uvA.copy( uvs_f[ 0 ] );
							uvB.copy( uvs_f[ 1 ] );
							uvC.copy( uvs_f[ 2 ] );

							intersection.uv = uvIntersection( intersectionPoint, fvA, fvB, fvC, uvA, uvB, uvC );

						}

						intersection.face = face;
						intersection.faceIndex = f;
						intersects.push( intersection );

					}

				}

			}

		};

	}() ),

	clone: function () {

		return new this.constructor( this.geometry, this.material ).copy( this );

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * @author mrdoob / http://mrdoob.com/
 */

function addLineNumbers( string ) {

	var lines = string.split( '\n' );

	for ( var i = 0; i < lines.length; i ++ ) {

		lines[ i ] = ( i + 1 ) + ': ' + lines[ i ];

	}

	return lines.join( '\n' );

}

function WebGLShader( gl, type, string ) {

	var shader = gl.createShader( type );

	gl.shaderSource( shader, string );
	gl.compileShader( shader );

	if ( gl.getShaderParameter( shader, gl.COMPILE_STATUS ) === false ) {

		console.error( 'THREE.WebGLShader: Shader couldn\'t compile.' );

	}

	if ( gl.getShaderInfoLog( shader ) !== '' ) {

		console.warn( 'THREE.WebGLShader: gl.getShaderInfoLog()', type === gl.VERTEX_SHADER ? 'vertex' : 'fragment', gl.getShaderInfoLog( shader ), addLineNumbers( string ) );

	}

	// --enable-privileged-webgl-extension
	// console.log( type, gl.getExtension( 'WEBGL_debug_shaders' ).getTranslatedShaderSource( shader ) );

	return shader;

}

/**
 * @author mrdoob / http://mrdoob.com/
 */

var programIdCount = 0;

function getEncodingComponents( encoding ) {

	switch ( encoding ) {

		case LinearEncoding:
			return [ 'Linear','( value )' ];
		case sRGBEncoding:
			return [ 'sRGB','( value )' ];
		case RGBEEncoding:
			return [ 'RGBE','( value )' ];
		case RGBM7Encoding:
			return [ 'RGBM','( value, 7.0 )' ];
		case RGBM16Encoding:
			return [ 'RGBM','( value, 16.0 )' ];
		case RGBDEncoding:
			return [ 'RGBD','( value, 256.0 )' ];
		case GammaEncoding:
			return [ 'Gamma','( value, float( GAMMA_FACTOR ) )' ];
		default:
			throw new Error( 'unsupported encoding: ' + encoding );

	}

}

function getTexelDecodingFunction( functionName, encoding ) {

	var components = getEncodingComponents( encoding );
	return "vec4 " + functionName + "( vec4 value ) { return " + components[ 0 ] + "ToLinear" + components[ 1 ] + "; }";

}

function getTexelEncodingFunction( functionName, encoding ) {

	var components = getEncodingComponents( encoding );
	return "vec4 " + functionName + "( vec4 value ) { return LinearTo" + components[ 0 ] + components[ 1 ] + "; }";

}

function getToneMappingFunction( functionName, toneMapping ) {

	var toneMappingName;

	switch ( toneMapping ) {

		case LinearToneMapping:
			toneMappingName = "Linear";
			break;

		case ReinhardToneMapping:
			toneMappingName = "Reinhard";
			break;

		case Uncharted2ToneMapping:
			toneMappingName = "Uncharted2";
			break;

		case CineonToneMapping:
			toneMappingName = "OptimizedCineon";
			break;

		default:
			throw new Error( 'unsupported toneMapping: ' + toneMapping );

	}

	return "vec3 " + functionName + "( vec3 color ) { return " + toneMappingName + "ToneMapping( color ); }";

}

function generateExtensions( extensions, parameters, rendererExtensions ) {

	extensions = extensions || {};

	var chunks = [
		( extensions.derivatives || parameters.envMapCubeUV || parameters.bumpMap || parameters.normalMap || parameters.flatShading ) ? '#extension GL_OES_standard_derivatives : enable' : '',
		( extensions.fragDepth || parameters.logarithmicDepthBuffer ) && rendererExtensions.get( 'EXT_frag_depth' ) ? '#extension GL_EXT_frag_depth : enable' : '',
		( extensions.drawBuffers ) && rendererExtensions.get( 'WEBGL_draw_buffers' ) ? '#extension GL_EXT_draw_buffers : require' : '',
		( extensions.shaderTextureLOD || parameters.envMap ) && rendererExtensions.get( 'EXT_shader_texture_lod' ) ? '#extension GL_EXT_shader_texture_lod : enable' : ''
	];

	return chunks.filter( filterEmptyLine ).join( '\n' );

}

function generateDefines( defines ) {

	var chunks = [];

	for ( var name in defines ) {

		var value = defines[ name ];

		if ( value === false ) continue;

		chunks.push( '#define ' + name + ' ' + value );

	}

	return chunks.join( '\n' );

}

function fetchAttributeLocations( gl, program, identifiers ) {

	var attributes = {};

	var n = gl.getProgramParameter( program, gl.ACTIVE_ATTRIBUTES );

	for ( var i = 0; i < n; i ++ ) {

		var info = gl.getActiveAttrib( program, i );
		var name = info.name;

		// console.log("THREE.WebGLProgram: ACTIVE VERTEX ATTRIBUTE:", name, i );

		attributes[ name ] = gl.getAttribLocation( program, name );

	}

	return attributes;

}

function filterEmptyLine( string ) {

	return string !== '';

}

function replaceLightNums( string, parameters ) {

	return string
		.replace( /NUM_DIR_LIGHTS/g, parameters.numDirLights )
		.replace( /NUM_SPOT_LIGHTS/g, parameters.numSpotLights )
		.replace( /NUM_RECT_AREA_LIGHTS/g, parameters.numRectAreaLights )
		.replace( /NUM_POINT_LIGHTS/g, parameters.numPointLights )
		.replace( /NUM_HEMI_LIGHTS/g, parameters.numHemiLights );

}

function parseIncludes( string ) {

	var pattern = /^[ \t]*#include +<([\w\d.]+)>/gm;

	function replace( match, include ) {

		var replace = ShaderChunk[ include ];

		if ( replace === undefined ) {

			throw new Error( 'Can not resolve #include <' + include + '>' );

		}

		return parseIncludes( replace );

	}

	return string.replace( pattern, replace );

}

function unrollLoops( string ) {

	var pattern = /for \( int i \= (\d+)\; i < (\d+)\; i \+\+ \) \{([\s\S]+?)(?=\})\}/g;

	function replace( match, start, end, snippet ) {

		var unroll = '';

		for ( var i = parseInt( start ); i < parseInt( end ); i ++ ) {

			unroll += snippet.replace( /\[ i \]/g, '[ ' + i + ' ]' );

		}

		return unroll;

	}

	return string.replace( pattern, replace );

}

function WebGLProgram( renderer, code, material, shader, parameters ) {

	var gl = renderer.context;

	var extensions = material.extensions;
	var defines = material.defines;

	var vertexShader = shader.vertexShader;
	var fragmentShader = shader.fragmentShader;

	var shadowMapTypeDefine = 'SHADOWMAP_TYPE_BASIC';

	if ( parameters.shadowMapType === PCFShadowMap ) {

		shadowMapTypeDefine = 'SHADOWMAP_TYPE_PCF';

	} else if ( parameters.shadowMapType === PCFSoftShadowMap ) {

		shadowMapTypeDefine = 'SHADOWMAP_TYPE_PCF_SOFT';

	}

	var envMapTypeDefine = 'ENVMAP_TYPE_CUBE';
	var envMapModeDefine = 'ENVMAP_MODE_REFLECTION';
	var envMapBlendingDefine = 'ENVMAP_BLENDING_MULTIPLY';

	if ( parameters.envMap ) {

		switch ( material.envMap.mapping ) {

			case CubeReflectionMapping:
			case CubeRefractionMapping:
				envMapTypeDefine = 'ENVMAP_TYPE_CUBE';
				break;

			case CubeUVReflectionMapping:
			case CubeUVRefractionMapping:
				envMapTypeDefine = 'ENVMAP_TYPE_CUBE_UV';
				break;

			case EquirectangularReflectionMapping:
			case EquirectangularRefractionMapping:
				envMapTypeDefine = 'ENVMAP_TYPE_EQUIREC';
				break;

			case SphericalReflectionMapping:
				envMapTypeDefine = 'ENVMAP_TYPE_SPHERE';
				break;

		}

		switch ( material.envMap.mapping ) {

			case CubeRefractionMapping:
			case EquirectangularRefractionMapping:
				envMapModeDefine = 'ENVMAP_MODE_REFRACTION';
				break;

		}

		switch ( material.combine ) {

			case MultiplyOperation:
				envMapBlendingDefine = 'ENVMAP_BLENDING_MULTIPLY';
				break;

			case MixOperation:
				envMapBlendingDefine = 'ENVMAP_BLENDING_MIX';
				break;

			case AddOperation:
				envMapBlendingDefine = 'ENVMAP_BLENDING_ADD';
				break;

		}

	}

	var gammaFactorDefine = ( renderer.gammaFactor > 0 ) ? renderer.gammaFactor : 1.0;

	// console.log( 'building new program ' );

	//

	var customExtensions = generateExtensions( extensions, parameters, renderer.extensions );

	var customDefines = generateDefines( defines );

	//

	var program = gl.createProgram();

	var prefixVertex, prefixFragment;

	if ( material.isRawShaderMaterial ) {

		prefixVertex = [

			customDefines,

			'\n'

		].filter( filterEmptyLine ).join( '\n' );

		prefixFragment = [

			customExtensions,
			customDefines,

			'\n'

		].filter( filterEmptyLine ).join( '\n' );

	} else {

		prefixVertex = [

			'precision ' + parameters.precision + ' float;',
			'precision ' + parameters.precision + ' int;',

			'#define SHADER_NAME ' + shader.name,

			customDefines,

			parameters.supportsVertexTextures ? '#define VERTEX_TEXTURES' : '',

			'#define GAMMA_FACTOR ' + gammaFactorDefine,

			'#define MAX_BONES ' + parameters.maxBones,
			( parameters.useFog && parameters.fog ) ? '#define USE_FOG' : '',
			( parameters.useFog && parameters.fogExp ) ? '#define FOG_EXP2' : '',

			parameters.map ? '#define USE_MAP' : '',
			parameters.envMap ? '#define USE_ENVMAP' : '',
			parameters.envMap ? '#define ' + envMapModeDefine : '',
			parameters.lightMap ? '#define USE_LIGHTMAP' : '',
			parameters.aoMap ? '#define USE_AOMAP' : '',
			parameters.emissiveMap ? '#define USE_EMISSIVEMAP' : '',
			parameters.bumpMap ? '#define USE_BUMPMAP' : '',
			parameters.normalMap ? '#define USE_NORMALMAP' : '',
			parameters.displacementMap && parameters.supportsVertexTextures ? '#define USE_DISPLACEMENTMAP' : '',
			parameters.specularMap ? '#define USE_SPECULARMAP' : '',
			parameters.roughnessMap ? '#define USE_ROUGHNESSMAP' : '',
			parameters.metalnessMap ? '#define USE_METALNESSMAP' : '',
			parameters.alphaMap ? '#define USE_ALPHAMAP' : '',
			parameters.vertexColors ? '#define USE_COLOR' : '',

			parameters.flatShading ? '#define FLAT_SHADED' : '',

			parameters.skinning ? '#define USE_SKINNING' : '',
			parameters.useVertexTexture ? '#define BONE_TEXTURE' : '',

			parameters.morphTargets ? '#define USE_MORPHTARGETS' : '',
			parameters.morphNormals && parameters.flatShading === false ? '#define USE_MORPHNORMALS' : '',
			parameters.doubleSided ? '#define DOUBLE_SIDED' : '',
			parameters.flipSided ? '#define FLIP_SIDED' : '',

			'#define NUM_CLIPPING_PLANES ' + parameters.numClippingPlanes,

			parameters.shadowMapEnabled ? '#define USE_SHADOWMAP' : '',
			parameters.shadowMapEnabled ? '#define ' + shadowMapTypeDefine : '',

			parameters.sizeAttenuation ? '#define USE_SIZEATTENUATION' : '',

			parameters.logarithmicDepthBuffer ? '#define USE_LOGDEPTHBUF' : '',
			parameters.logarithmicDepthBuffer && renderer.extensions.get( 'EXT_frag_depth' ) ? '#define USE_LOGDEPTHBUF_EXT' : '',

			'uniform mat4 modelMatrix;',
			'uniform mat4 modelViewMatrix;',
			'uniform mat4 projectionMatrix;',
			'uniform mat4 viewMatrix;',
			'uniform mat3 normalMatrix;',
			'uniform vec3 cameraPosition;',

			'attribute vec3 position;',
			'attribute vec3 normal;',
			'attribute vec2 uv;',

			'#ifdef USE_COLOR',

			'	attribute vec3 color;',

			'#endif',

			'#ifdef USE_MORPHTARGETS',

			'	attribute vec3 morphTarget0;',
			'	attribute vec3 morphTarget1;',
			'	attribute vec3 morphTarget2;',
			'	attribute vec3 morphTarget3;',

			'	#ifdef USE_MORPHNORMALS',

			'		attribute vec3 morphNormal0;',
			'		attribute vec3 morphNormal1;',
			'		attribute vec3 morphNormal2;',
			'		attribute vec3 morphNormal3;',

			'	#else',

			'		attribute vec3 morphTarget4;',
			'		attribute vec3 morphTarget5;',
			'		attribute vec3 morphTarget6;',
			'		attribute vec3 morphTarget7;',

			'	#endif',

			'#endif',

			'#ifdef USE_SKINNING',

			'	attribute vec4 skinIndex;',
			'	attribute vec4 skinWeight;',

			'#endif',

			'\n'

		].filter( filterEmptyLine ).join( '\n' );

		prefixFragment = [

			customExtensions,

			'precision ' + parameters.precision + ' float;',
			'precision ' + parameters.precision + ' int;',

			'#define SHADER_NAME ' + shader.name,

			customDefines,

			parameters.alphaTest ? '#define ALPHATEST ' + parameters.alphaTest : '',

			'#define GAMMA_FACTOR ' + gammaFactorDefine,

			( parameters.useFog && parameters.fog ) ? '#define USE_FOG' : '',
			( parameters.useFog && parameters.fogExp ) ? '#define FOG_EXP2' : '',

			parameters.map ? '#define USE_MAP' : '',
			parameters.envMap ? '#define USE_ENVMAP' : '',
			parameters.envMap ? '#define ' + envMapTypeDefine : '',
			parameters.envMap ? '#define ' + envMapModeDefine : '',
			parameters.envMap ? '#define ' + envMapBlendingDefine : '',
			parameters.lightMap ? '#define USE_LIGHTMAP' : '',
			parameters.aoMap ? '#define USE_AOMAP' : '',
			parameters.emissiveMap ? '#define USE_EMISSIVEMAP' : '',
			parameters.bumpMap ? '#define USE_BUMPMAP' : '',
			parameters.normalMap ? '#define USE_NORMALMAP' : '',
			parameters.specularMap ? '#define USE_SPECULARMAP' : '',
			parameters.roughnessMap ? '#define USE_ROUGHNESSMAP' : '',
			parameters.metalnessMap ? '#define USE_METALNESSMAP' : '',
			parameters.alphaMap ? '#define USE_ALPHAMAP' : '',
			parameters.vertexColors ? '#define USE_COLOR' : '',

			parameters.gradientMap ? '#define USE_GRADIENTMAP' : '',

			parameters.flatShading ? '#define FLAT_SHADED' : '',

			parameters.doubleSided ? '#define DOUBLE_SIDED' : '',
			parameters.flipSided ? '#define FLIP_SIDED' : '',

			'#define NUM_CLIPPING_PLANES ' + parameters.numClippingPlanes,
			'#define UNION_CLIPPING_PLANES ' + (parameters.numClippingPlanes - parameters.numClipIntersection),

			parameters.shadowMapEnabled ? '#define USE_SHADOWMAP' : '',
			parameters.shadowMapEnabled ? '#define ' + shadowMapTypeDefine : '',

			parameters.premultipliedAlpha ? "#define PREMULTIPLIED_ALPHA" : '',

			parameters.physicallyCorrectLights ? "#define PHYSICALLY_CORRECT_LIGHTS" : '',

			parameters.logarithmicDepthBuffer ? '#define USE_LOGDEPTHBUF' : '',
			parameters.logarithmicDepthBuffer && renderer.extensions.get( 'EXT_frag_depth' ) ? '#define USE_LOGDEPTHBUF_EXT' : '',

			parameters.envMap && renderer.extensions.get( 'EXT_shader_texture_lod' ) ? '#define TEXTURE_LOD_EXT' : '',

			'uniform mat4 viewMatrix;',
			'uniform vec3 cameraPosition;',

			( parameters.toneMapping !== NoToneMapping ) ? "#define TONE_MAPPING" : '',
			( parameters.toneMapping !== NoToneMapping ) ? ShaderChunk[ 'tonemapping_pars_fragment' ] : '',  // this code is required here because it is used by the toneMapping() function defined below
			( parameters.toneMapping !== NoToneMapping ) ? getToneMappingFunction( "toneMapping", parameters.toneMapping ) : '',

			parameters.dithering ? '#define DITHERING' : '',

			( parameters.outputEncoding || parameters.mapEncoding || parameters.envMapEncoding || parameters.emissiveMapEncoding ) ? ShaderChunk[ 'encodings_pars_fragment' ] : '', // this code is required here because it is used by the various encoding/decoding function defined below
			parameters.mapEncoding ? getTexelDecodingFunction( 'mapTexelToLinear', parameters.mapEncoding ) : '',
			parameters.envMapEncoding ? getTexelDecodingFunction( 'envMapTexelToLinear', parameters.envMapEncoding ) : '',
			parameters.emissiveMapEncoding ? getTexelDecodingFunction( 'emissiveMapTexelToLinear', parameters.emissiveMapEncoding ) : '',
			parameters.outputEncoding ? getTexelEncodingFunction( "linearToOutputTexel", parameters.outputEncoding ) : '',

			parameters.depthPacking ? "#define DEPTH_PACKING " + material.depthPacking : '',

			'\n'

		].filter( filterEmptyLine ).join( '\n' );

	}

	vertexShader = parseIncludes( vertexShader );
	vertexShader = replaceLightNums( vertexShader, parameters );

	fragmentShader = parseIncludes( fragmentShader );
	fragmentShader = replaceLightNums( fragmentShader, parameters );

	if ( ! material.isShaderMaterial ) {

		vertexShader = unrollLoops( vertexShader );
		fragmentShader = unrollLoops( fragmentShader );

	}

	var vertexGlsl = prefixVertex + vertexShader;
	var fragmentGlsl = prefixFragment + fragmentShader;

	// console.log( '*VERTEX*', vertexGlsl );
	// console.log( '*FRAGMENT*', fragmentGlsl );

	var glVertexShader = WebGLShader( gl, gl.VERTEX_SHADER, vertexGlsl );
	var glFragmentShader = WebGLShader( gl, gl.FRAGMENT_SHADER, fragmentGlsl );

	gl.attachShader( program, glVertexShader );
	gl.attachShader( program, glFragmentShader );

	// Force a particular attribute to index 0.

	if ( material.index0AttributeName !== undefined ) {

		gl.bindAttribLocation( program, 0, material.index0AttributeName );

	} else if ( parameters.morphTargets === true ) {

		// programs with morphTargets displace position out of attribute 0
		gl.bindAttribLocation( program, 0, 'position' );

	}

	gl.linkProgram( program );

	var programLog = gl.getProgramInfoLog( program );
	var vertexLog = gl.getShaderInfoLog( glVertexShader );
	var fragmentLog = gl.getShaderInfoLog( glFragmentShader );

	var runnable = true;
	var haveDiagnostics = true;

	// console.log( '**VERTEX**', gl.getExtension( 'WEBGL_debug_shaders' ).getTranslatedShaderSource( glVertexShader ) );
	// console.log( '**FRAGMENT**', gl.getExtension( 'WEBGL_debug_shaders' ).getTranslatedShaderSource( glFragmentShader ) );

	if ( gl.getProgramParameter( program, gl.LINK_STATUS ) === false ) {

		runnable = false;

		console.error( 'THREE.WebGLProgram: shader error: ', gl.getError(), 'gl.VALIDATE_STATUS', gl.getProgramParameter( program, gl.VALIDATE_STATUS ), 'gl.getProgramInfoLog', programLog, vertexLog, fragmentLog );

	} else if ( programLog !== '' ) {

		console.warn( 'THREE.WebGLProgram: gl.getProgramInfoLog()', programLog );

	} else if ( vertexLog === '' || fragmentLog === '' ) {

		haveDiagnostics = false;

	}

	if ( haveDiagnostics ) {

		this.diagnostics = {

			runnable: runnable,
			material: material,

			programLog: programLog,

			vertexShader: {

				log: vertexLog,
				prefix: prefixVertex

			},

			fragmentShader: {

				log: fragmentLog,
				prefix: prefixFragment

			}

		};

	}

	// clean up

	gl.deleteShader( glVertexShader );
	gl.deleteShader( glFragmentShader );

	// set up caching for uniform locations

	var cachedUniforms;

	this.getUniforms = function() {

		if ( cachedUniforms === undefined ) {

			cachedUniforms =
				new WebGLUniforms( gl, program, renderer );

		}

		return cachedUniforms;

	};

	// set up caching for attribute locations

	var cachedAttributes;

	this.getAttributes = function() {

		if ( cachedAttributes === undefined ) {

			cachedAttributes = fetchAttributeLocations( gl, program );

		}

		return cachedAttributes;

	};

	// free resource

	this.destroy = function() {

		gl.deleteProgram( program );
		this.program = undefined;

	};

	// DEPRECATED

	Object.defineProperties( this, {

		uniforms: {
			get: function() {

				console.warn( 'THREE.WebGLProgram: .uniforms is now .getUniforms().' );
				return this.getUniforms();

			}
		},

		attributes: {
			get: function() {

				console.warn( 'THREE.WebGLProgram: .attributes is now .getAttributes().' );
				return this.getAttributes();

			}
		}

	} );


	//

	this.id = programIdCount ++;
	this.code = code;
	this.usedTimes = 1;
	this.program = program;
	this.vertexShader = glVertexShader;
	this.fragmentShader = glFragmentShader;

	return this;

}

/**
 * @author mrdoob / http://mrdoob.com/
 */

function WebGLPrograms( renderer, capabilities ) {

	var programs = [];

	var shaderIDs = {
		MeshDepthMaterial: 'depth',
		MeshNormalMaterial: 'normal',
		MeshBasicMaterial: 'basic',
		MeshLambertMaterial: 'lambert',
		MeshPhongMaterial: 'phong',
		MeshToonMaterial: 'phong',
		MeshStandardMaterial: 'physical',
		MeshPhysicalMaterial: 'physical',
		LineBasicMaterial: 'basic',
		LineDashedMaterial: 'dashed',
		PointsMaterial: 'points'
	};

	var parameterNames = [
		"precision", "supportsVertexTextures", "map", "mapEncoding", "envMap", "envMapMode", "envMapEncoding",
		"lightMap", "aoMap", "emissiveMap", "emissiveMapEncoding", "bumpMap", "normalMap", "displacementMap", "specularMap",
		"roughnessMap", "metalnessMap", "gradientMap",
		"alphaMap", "combine", "vertexColors", "fog", "useFog", "fogExp",
		"flatShading", "sizeAttenuation", "logarithmicDepthBuffer", "skinning",
		"maxBones", "useVertexTexture", "morphTargets", "morphNormals",
		"maxMorphTargets", "maxMorphNormals", "premultipliedAlpha",
		"numDirLights", "numPointLights", "numSpotLights", "numHemiLights", "numRectAreaLights",
		"shadowMapEnabled", "shadowMapType", "toneMapping", 'physicallyCorrectLights',
		"alphaTest", "doubleSided", "flipSided", "numClippingPlanes", "numClipIntersection", "depthPacking", "dithering"
	];


	function allocateBones( object ) {

		var skeleton = object.skeleton;
		var bones = skeleton.bones;

		if ( capabilities.floatVertexTextures ) {

			return 1024;

		} else {

			// default for when object is not specified
			// ( for example when prebuilding shader to be used with multiple objects )
			//
			//  - leave some extra space for other uniforms
			//  - limit here is ANGLE's 254 max uniform vectors
			//    (up to 54 should be safe)

			var nVertexUniforms = capabilities.maxVertexUniforms;
			var nVertexMatrices = Math.floor( ( nVertexUniforms - 20 ) / 4 );

			var maxBones = Math.min( nVertexMatrices, bones.length );

			if ( maxBones < bones.length ) {

				console.warn( 'THREE.WebGLRenderer: Skeleton has ' + bones.length + ' bones. This GPU supports ' + maxBones + '.' );
				return 0;

			}

			return maxBones;

		}

	}

	function getTextureEncodingFromMap( map, gammaOverrideLinear ) {

		var encoding;

		if ( ! map ) {

			encoding = LinearEncoding;

		} else if ( map.isTexture ) {

			encoding = map.encoding;

		} else if ( map.isWebGLRenderTarget ) {

			console.warn( "THREE.WebGLPrograms.getTextureEncodingFromMap: don't use render targets as textures. Use their .texture property instead." );
			encoding = map.texture.encoding;

		}

		// add backwards compatibility for WebGLRenderer.gammaInput/gammaOutput parameter, should probably be removed at some point.
		if ( encoding === LinearEncoding && gammaOverrideLinear ) {

			encoding = GammaEncoding;

		}

		return encoding;

	}

	this.getParameters = function ( material, lights, fog, nClipPlanes, nClipIntersection, object ) {

		var shaderID = shaderIDs[ material.type ];

		// heuristics to create shader parameters according to lights in the scene
		// (not to blow over maxLights budget)

		var maxBones = object.isSkinnedMesh ? allocateBones( object ) : 0;
		var precision = renderer.getPrecision();

		if ( material.precision !== null ) {

			precision = capabilities.getMaxPrecision( material.precision );

			if ( precision !== material.precision ) {

				console.warn( 'THREE.WebGLProgram.getParameters:', material.precision, 'not supported, using', precision, 'instead.' );

			}

		}

		var currentRenderTarget = renderer.getRenderTarget();

		var parameters = {

			shaderID: shaderID,

			precision: precision,
			supportsVertexTextures: capabilities.vertexTextures,
			outputEncoding: getTextureEncodingFromMap( ( ! currentRenderTarget ) ? null : currentRenderTarget.texture, renderer.gammaOutput ),
			map: !! material.map,
			mapEncoding: getTextureEncodingFromMap( material.map, renderer.gammaInput ),
			envMap: !! material.envMap,
			envMapMode: material.envMap && material.envMap.mapping,
			envMapEncoding: getTextureEncodingFromMap( material.envMap, renderer.gammaInput ),
			envMapCubeUV: ( !! material.envMap ) && ( ( material.envMap.mapping === CubeUVReflectionMapping ) || ( material.envMap.mapping === CubeUVRefractionMapping ) ),
			lightMap: !! material.lightMap,
			aoMap: !! material.aoMap,
			emissiveMap: !! material.emissiveMap,
			emissiveMapEncoding: getTextureEncodingFromMap( material.emissiveMap, renderer.gammaInput ),
			bumpMap: !! material.bumpMap,
			normalMap: !! material.normalMap,
			displacementMap: !! material.displacementMap,
			roughnessMap: !! material.roughnessMap,
			metalnessMap: !! material.metalnessMap,
			specularMap: !! material.specularMap,
			alphaMap: !! material.alphaMap,

			gradientMap: !! material.gradientMap,

			combine: material.combine,

			vertexColors: material.vertexColors,

			fog: !! fog,
			useFog: material.fog,
			fogExp: ( fog && fog.isFogExp2 ),

			flatShading: material.shading === FlatShading,

			sizeAttenuation: material.sizeAttenuation,
			logarithmicDepthBuffer: capabilities.logarithmicDepthBuffer,

			skinning: material.skinning && maxBones > 0,
			maxBones: maxBones,
			useVertexTexture: capabilities.floatVertexTextures,

			morphTargets: material.morphTargets,
			morphNormals: material.morphNormals,
			maxMorphTargets: renderer.maxMorphTargets,
			maxMorphNormals: renderer.maxMorphNormals,

			numDirLights: lights.directional.length,
			numPointLights: lights.point.length,
			numSpotLights: lights.spot.length,
			numRectAreaLights: lights.rectArea.length,
			numHemiLights: lights.hemi.length,

			numClippingPlanes: nClipPlanes,
			numClipIntersection: nClipIntersection,

			dithering: material.dithering,

			shadowMapEnabled: renderer.shadowMap.enabled && object.receiveShadow && lights.shadows.length > 0,
			shadowMapType: renderer.shadowMap.type,

			toneMapping: renderer.toneMapping,
			physicallyCorrectLights: renderer.physicallyCorrectLights,

			premultipliedAlpha: material.premultipliedAlpha,

			alphaTest: material.alphaTest,
			doubleSided: material.side === DoubleSide,
			flipSided: material.side === BackSide,

			depthPacking: ( material.depthPacking !== undefined ) ? material.depthPacking : false

		};

		return parameters;

	};

	this.getProgramCode = function ( material, parameters ) {

		var array = [];

		if ( parameters.shaderID ) {

			array.push( parameters.shaderID );

		} else {

			array.push( material.fragmentShader );
			array.push( material.vertexShader );

		}

		if ( material.defines !== undefined ) {

			for ( var name in material.defines ) {

				array.push( name );
				array.push( material.defines[ name ] );

			}

		}

		for ( var i = 0; i < parameterNames.length; i ++ ) {

			array.push( parameters[ parameterNames[ i ] ] );

		}

		array.push( material.onBeforeCompile.toString() );

		array.push( renderer.gammaOutput );

		return array.join();

	};

	this.acquireProgram = function ( material, shader, parameters, code ) {

		var program;

		// Check if code has been already compiled
		for ( var p = 0, pl = programs.length; p < pl; p ++ ) {

			var programInfo = programs[ p ];

			if ( programInfo.code === code ) {

				program = programInfo;
				++ program.usedTimes;

				break;

			}

		}

		if ( program === undefined ) {

			program = new WebGLProgram( renderer, code, material, shader, parameters );
			programs.push( program );

		}

		return program;

	};

	this.releaseProgram = function ( program ) {

		if ( -- program.usedTimes === 0 ) {

			// Remove from unordered set
			var i = programs.indexOf( program );
			programs[ i ] = programs[ programs.length - 1 ];
			programs.pop();

			// Free WebGL resources
			program.destroy();

		}

	};

	// Exposed for resource monitoring & error feedback via renderer.info:
	this.programs = programs;

}

/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * @author fordacious / fordacious.github.io
 */

function WebGLProperties() {

	var properties = {};

	function get( object ) {

		var uuid = object.uuid;
		var map = properties[ uuid ];

		if ( map === undefined ) {

			map = {};
			properties[ uuid ] = map;

		}

		return map;

	}

	function remove( object ) {

		delete properties[ object.uuid ];

	}

	function clear() {

		properties = {};

	}

	return {
		get: get,
		remove: remove,
		clear: clear
	};

}

/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * @author mrdoob / http://mrdoob.com/
 */

function WebGLCapabilities( gl, extensions, parameters ) {

	var maxAnisotropy;

	function getMaxAnisotropy() {

		if ( maxAnisotropy !== undefined ) return maxAnisotropy;

		var extension = extensions.get( 'EXT_texture_filter_anisotropic' );

		if ( extension !== null ) {

			maxAnisotropy = gl.getParameter( extension.MAX_TEXTURE_MAX_ANISOTROPY_EXT );

		} else {

			maxAnisotropy = 0;

		}

		return maxAnisotropy;

	}

	function getMaxPrecision( precision ) {

		if ( precision === 'highp' ) {

			if ( gl.getShaderPrecisionFormat( gl.VERTEX_SHADER, gl.HIGH_FLOAT ).precision > 0 &&
			     gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.HIGH_FLOAT ).precision > 0 ) {

				return 'highp';

			}

			precision = 'mediump';

		}

		if ( precision === 'mediump' ) {

			if ( gl.getShaderPrecisionFormat( gl.VERTEX_SHADER, gl.MEDIUM_FLOAT ).precision > 0 &&
			     gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT ).precision > 0 ) {

				return 'mediump';

			}

		}

		return 'lowp';

	}

	var precision = parameters.precision !== undefined ? parameters.precision : 'highp';
	var maxPrecision = getMaxPrecision( precision );

	if ( maxPrecision !== precision ) {

		console.warn( 'THREE.WebGLRenderer:', precision, 'not supported, using', maxPrecision, 'instead.' );
		precision = maxPrecision;

	}

	var logarithmicDepthBuffer = parameters.logarithmicDepthBuffer === true && !! extensions.get( 'EXT_frag_depth' );

	var maxTextures = gl.getParameter( gl.MAX_TEXTURE_IMAGE_UNITS );
	var maxVertexTextures = gl.getParameter( gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS );
	var maxTextureSize = gl.getParameter( gl.MAX_TEXTURE_SIZE );
	var maxCubemapSize = gl.getParameter( gl.MAX_CUBE_MAP_TEXTURE_SIZE );

	var maxAttributes = gl.getParameter( gl.MAX_VERTEX_ATTRIBS );
	var maxVertexUniforms = gl.getParameter( gl.MAX_VERTEX_UNIFORM_VECTORS );
	var maxVaryings = gl.getParameter( gl.MAX_VARYING_VECTORS );
	var maxFragmentUniforms = gl.getParameter( gl.MAX_FRAGMENT_UNIFORM_VECTORS );

	var vertexTextures = maxVertexTextures > 0;
	var floatFragmentTextures = !! extensions.get( 'OES_texture_float' );
	var floatVertexTextures = vertexTextures && floatFragmentTextures;

	return {

		getMaxAnisotropy: getMaxAnisotropy,
		getMaxPrecision: getMaxPrecision,

		precision: precision,
		logarithmicDepthBuffer: logarithmicDepthBuffer,

		maxTextures: maxTextures,
		maxVertexTextures: maxVertexTextures,
		maxTextureSize: maxTextureSize,
		maxCubemapSize: maxCubemapSize,

		maxAttributes: maxAttributes,
		maxVertexUniforms: maxVertexUniforms,
		maxVaryings: maxVaryings,
		maxFragmentUniforms: maxFragmentUniforms,

		vertexTextures: vertexTextures,
		floatFragmentTextures: floatFragmentTextures,
		floatVertexTextures: floatVertexTextures

	};

}

/**
 * @author mrdoob / http://mrdoob.com/
 */

function ArrayCamera( array ) {

	PerspectiveCamera.call( this );

	this.cameras = array || [];

}

ArrayCamera.prototype = Object.assign( Object.create( PerspectiveCamera.prototype ), {

	constructor: ArrayCamera,

	isArrayCamera: true

} );

/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * @author mrdoob / http://mrdoob.com/
 */

function WebGLExtensions( gl ) {

	var extensions = {};

	return {

		get: function ( name ) {

			if ( extensions[ name ] !== undefined ) {

				return extensions[ name ];

			}

			var extension;

			switch ( name ) {

				case 'WEBGL_depth_texture':
					extension = gl.getExtension( 'WEBGL_depth_texture' ) || gl.getExtension( 'MOZ_WEBGL_depth_texture' ) || gl.getExtension( 'WEBKIT_WEBGL_depth_texture' );
					break;

				case 'EXT_texture_filter_anisotropic':
					extension = gl.getExtension( 'EXT_texture_filter_anisotropic' ) || gl.getExtension( 'MOZ_EXT_texture_filter_anisotropic' ) || gl.getExtension( 'WEBKIT_EXT_texture_filter_anisotropic' );
					break;

				case 'WEBGL_compressed_texture_s3tc':
					extension = gl.getExtension( 'WEBGL_compressed_texture_s3tc' ) || gl.getExtension( 'MOZ_WEBGL_compressed_texture_s3tc' ) || gl.getExtension( 'WEBKIT_WEBGL_compressed_texture_s3tc' );
					break;

				case 'WEBGL_compressed_texture_pvrtc':
					extension = gl.getExtension( 'WEBGL_compressed_texture_pvrtc' ) || gl.getExtension( 'WEBKIT_WEBGL_compressed_texture_pvrtc' );
					break;

				case 'WEBGL_compressed_texture_etc1':
					extension = gl.getExtension( 'WEBGL_compressed_texture_etc1' );
					break;

				default:
					extension = gl.getExtension( name );

			}

			if ( extension === null ) {

				console.warn( 'THREE.WebGLRenderer: ' + name + ' extension not supported.' );

			}

			extensions[ name ] = extension;

			return extension;

		}

	};

}

/**
 * @author tschw
 */

function WebGLClipping() {

	var scope = this,

		globalState = null,
		numGlobalPlanes = 0,
		localClippingEnabled = false,
		renderingShadows = false,

		plane = new Plane(),
		viewNormalMatrix = new Matrix3(),

		uniform = { value: null, needsUpdate: false };

	this.uniform = uniform;
	this.numPlanes = 0;
	this.numIntersection = 0;

	this.init = function( planes, enableLocalClipping, camera ) {

		var enabled =
			planes.length !== 0 ||
			enableLocalClipping ||
			// enable state of previous frame - the clipping code has to
			// run another frame in order to reset the state:
			numGlobalPlanes !== 0 ||
			localClippingEnabled;

		localClippingEnabled = enableLocalClipping;

		globalState = projectPlanes( planes, camera, 0 );
		numGlobalPlanes = planes.length;

		return enabled;

	};

	this.beginShadows = function() {

		renderingShadows = true;
		projectPlanes( null );

	};

	this.endShadows = function() {

		renderingShadows = false;
		resetGlobalState();

	};

	this.setState = function( planes, clipIntersection, clipShadows, camera, cache, fromCache ) {

		if ( ! localClippingEnabled ||
				planes === null || planes.length === 0 ||
				renderingShadows && ! clipShadows ) {
			// there's no local clipping

			if ( renderingShadows ) {
				// there's no global clipping

				projectPlanes( null );

			} else {

				resetGlobalState();
			}

		} else {

			var nGlobal = renderingShadows ? 0 : numGlobalPlanes,
				lGlobal = nGlobal * 4,

				dstArray = cache.clippingState || null;

			uniform.value = dstArray; // ensure unique state

			dstArray = projectPlanes( planes, camera, lGlobal, fromCache );

			for ( var i = 0; i !== lGlobal; ++ i ) {

				dstArray[ i ] = globalState[ i ];

			}

			cache.clippingState = dstArray;
			this.numIntersection = clipIntersection ? this.numPlanes : 0;
			this.numPlanes += nGlobal;

		}


	};

	function resetGlobalState() {

		if ( uniform.value !== globalState ) {

			uniform.value = globalState;
			uniform.needsUpdate = numGlobalPlanes > 0;

		}

		scope.numPlanes = numGlobalPlanes;
		scope.numIntersection = 0;

	}

	function projectPlanes( planes, camera, dstOffset, skipTransform ) {

		var nPlanes = planes !== null ? planes.length : 0,
			dstArray = null;

		if ( nPlanes !== 0 ) {

			dstArray = uniform.value;

			if ( skipTransform !== true || dstArray === null ) {

				var flatSize = dstOffset + nPlanes * 4,
					viewMatrix = camera.matrixWorldInverse;

				viewNormalMatrix.getNormalMatrix( viewMatrix );

				if ( dstArray === null || dstArray.length < flatSize ) {

					dstArray = new Float32Array( flatSize );

				}

				for ( var i = 0, i4 = dstOffset;
									i !== nPlanes; ++ i, i4 += 4 ) {

					plane.copy( planes[ i ] ).
							applyMatrix4( viewMatrix, viewNormalMatrix );

					plane.normal.toArray( dstArray, i4 );
					dstArray[ i4 + 3 ] = plane.constant;

				}

			}

			uniform.value = dstArray;
			uniform.needsUpdate = true;

		}

		scope.numPlanes = nPlanes;
		
		return dstArray;

	}

}

// import { Sphere } from '../math/Sphere';

/**
 * @author mrdoob / http://mrdoob.com/
 */

function Scene () {

	Object3D.call( this );

	this.type = 'Scene';

	this.background = null;
	this.fog = null;
	this.overrideMaterial = null;

	this.autoUpdate = true; // checked by the renderer

}

Scene.prototype = Object.assign( Object.create( Object3D.prototype ), {

	constructor: Scene,

	copy: function ( source, recursive ) {

		Object3D.prototype.copy.call( this, source, recursive );

		if ( source.background !== null ) this.background = source.background.clone();
		if ( source.fog !== null ) this.fog = source.fog.clone();
		if ( source.overrideMaterial !== null ) this.overrideMaterial = source.overrideMaterial.clone();

		this.autoUpdate = source.autoUpdate;
		this.matrixAutoUpdate = source.matrixAutoUpdate;

		return this;

	},

	toJSON: function ( meta ) {

		var data = Object3D.prototype.toJSON.call( this, meta );

		if ( this.background !== null ) data.object.background = this.background.toJSON( meta );
		if ( this.fog !== null ) data.object.fog = this.fog.toJSON();

		return data;

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 *
 * parameters = {
 *  color: <hex>,
 *  opacity: <float>,
 *
 *  linewidth: <float>,
 *  linecap: "round",
 *  linejoin: "round"
 * }
 */

function LineBasicMaterial( parameters ) {

	Material.call( this );

	this.type = 'LineBasicMaterial';

	this.color = new Color( 0xffffff );

	this.linewidth = 1;
	this.linecap = 'round';
	this.linejoin = 'round';

	this.lights = false;

	this.setValues( parameters );

}

LineBasicMaterial.prototype = Object.create( Material.prototype );
LineBasicMaterial.prototype.constructor = LineBasicMaterial;

LineBasicMaterial.prototype.isLineBasicMaterial = true;

LineBasicMaterial.prototype.copy = function ( source ) {

	Material.prototype.copy.call( this, source );

	this.color.copy( source.color );

	this.linewidth = source.linewidth;
	this.linecap = source.linecap;
	this.linejoin = source.linejoin;

	return this;

};

/**
 * @author mrdoob / http://mrdoob.com/
 */

function Line( geometry, material, mode ) {

	if ( mode === 1 ) {

		console.warn( 'THREE.Line: parameter THREE.LinePieces no longer supported. Created THREE.LineSegments instead.' );
		return new LineSegments( geometry, material );

	}

	Object3D.call( this );

	this.type = 'Line';

	this.geometry = geometry !== undefined ? geometry : new BufferGeometry();
	this.material = material !== undefined ? material : new LineBasicMaterial( { color: Math.random() * 0xffffff } );

}

Line.prototype = Object.assign( Object.create( Object3D.prototype ), {

	constructor: Line,

	isLine: true,

	raycast: ( function () {

		var inverseMatrix = new Matrix4();
		var ray = new Ray();
		var sphere = new Sphere();

		return function raycast( raycaster, intersects ) {

			var precision = raycaster.linePrecision;
			var precisionSq = precision * precision;

			var geometry = this.geometry;
			var matrixWorld = this.matrixWorld;

			// Checking boundingSphere distance to ray

			if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();

			sphere.copy( geometry.boundingSphere );
			sphere.applyMatrix4( matrixWorld );

			if ( raycaster.ray.intersectsSphere( sphere ) === false ) return;

			//

			inverseMatrix.getInverse( matrixWorld );
			ray.copy( raycaster.ray ).applyMatrix4( inverseMatrix );

			var vStart = new Vector3();
			var vEnd = new Vector3();
			var interSegment = new Vector3();
			var interRay = new Vector3();
			var step = (this && this.isLineSegments) ? 2 : 1;

			if ( geometry.isBufferGeometry ) {

				var index = geometry.index;
				var attributes = geometry.attributes;
				var positions = attributes.position.array;

				if ( index !== null ) {

					var indices = index.array;

					for ( var i = 0, l = indices.length - 1; i < l; i += step ) {

						var a = indices[ i ];
						var b = indices[ i + 1 ];

						vStart.fromArray( positions, a * 3 );
						vEnd.fromArray( positions, b * 3 );

						var distSq = ray.distanceSqToSegment( vStart, vEnd, interRay, interSegment );

						if ( distSq > precisionSq ) continue;

						interRay.applyMatrix4( this.matrixWorld ); //Move back to world space for distance calculation

						var distance = raycaster.ray.origin.distanceTo( interRay );

						if ( distance < raycaster.near || distance > raycaster.far ) continue;

						intersects.push( {

							distance: distance,
							// What do we want? intersection point on the ray or on the segment??
							// point: raycaster.ray.at( distance ),
							point: interSegment.clone().applyMatrix4( this.matrixWorld ),
							index: i,
							face: null,
							faceIndex: null,
							object: this

						} );

					}

				} else {

					for ( var i = 0, l = positions.length / 3 - 1; i < l; i += step ) {

						vStart.fromArray( positions, 3 * i );
						vEnd.fromArray( positions, 3 * i + 3 );

						var distSq = ray.distanceSqToSegment( vStart, vEnd, interRay, interSegment );

						if ( distSq > precisionSq ) continue;

						interRay.applyMatrix4( this.matrixWorld ); //Move back to world space for distance calculation

						var distance = raycaster.ray.origin.distanceTo( interRay );

						if ( distance < raycaster.near || distance > raycaster.far ) continue;

						intersects.push( {

							distance: distance,
							// What do we want? intersection point on the ray or on the segment??
							// point: raycaster.ray.at( distance ),
							point: interSegment.clone().applyMatrix4( this.matrixWorld ),
							index: i,
							face: null,
							faceIndex: null,
							object: this

						} );

					}

				}

			} else if ( geometry.isGeometry ) {

				var vertices = geometry.vertices;
				var nbVertices = vertices.length;

				for ( var i = 0; i < nbVertices - 1; i += step ) {

					var distSq = ray.distanceSqToSegment( vertices[ i ], vertices[ i + 1 ], interRay, interSegment );

					if ( distSq > precisionSq ) continue;

					interRay.applyMatrix4( this.matrixWorld ); //Move back to world space for distance calculation

					var distance = raycaster.ray.origin.distanceTo( interRay );

					if ( distance < raycaster.near || distance > raycaster.far ) continue;

					intersects.push( {

						distance: distance,
						// What do we want? intersection point on the ray or on the segment??
						// point: raycaster.ray.at( distance ),
						point: interSegment.clone().applyMatrix4( this.matrixWorld ),
						index: i,
						face: null,
						faceIndex: null,
						object: this

					} );

				}

			}

		};

	}() ),

	clone: function () {

		return new this.constructor( this.geometry, this.material ).copy( this );

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 */

function LineSegments( geometry, material ) {

	Line.call( this, geometry, material );

	this.type = 'LineSegments';

}

LineSegments.prototype = Object.assign( Object.create( Line.prototype ), {

	constructor: LineSegments,

	isLineSegments: true

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 *
 * parameters = {
 *  color: <hex>,
 *  opacity: <float>,
 *  map: new THREE.Texture( <Image> ),
 *
 *  size: <float>,
 *  sizeAttenuation: <bool>
 * }
 */

function PointsMaterial( parameters ) {

	Material.call( this );

	this.type = 'PointsMaterial';

	this.color = new Color( 0xffffff );

	this.map = null;

	this.size = 1;
	this.sizeAttenuation = true;

	this.lights = false;

	this.setValues( parameters );

}

PointsMaterial.prototype = Object.create( Material.prototype );
PointsMaterial.prototype.constructor = PointsMaterial;

PointsMaterial.prototype.isPointsMaterial = true;

PointsMaterial.prototype.copy = function ( source ) {

	Material.prototype.copy.call( this, source );

	this.color.copy( source.color );

	this.map = source.map;

	this.size = source.size;
	this.sizeAttenuation = source.sizeAttenuation;

	return this;

};

/**
 * @author alteredq / http://alteredqualia.com/
 */

function Points( geometry, material ) {

	Object3D.call( this );

	this.type = 'Points';

	this.geometry = geometry !== undefined ? geometry : new BufferGeometry();
	this.material = material !== undefined ? material : new PointsMaterial( { color: Math.random() * 0xffffff } );

}

Points.prototype = Object.assign( Object.create( Object3D.prototype ), {

	constructor: Points,

	isPoints: true,

	raycast: ( function () {

		var inverseMatrix = new Matrix4();
		var ray = new Ray();
		var sphere = new Sphere();

		return function raycast( raycaster, intersects ) {

			var object = this;
			var geometry = this.geometry;
			var matrixWorld = this.matrixWorld;
			var threshold = raycaster.params.Points.threshold;

			// Checking boundingSphere distance to ray

			if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();

			sphere.copy( geometry.boundingSphere );
			sphere.applyMatrix4( matrixWorld );
			sphere.radius += threshold;

			if ( raycaster.ray.intersectsSphere( sphere ) === false ) return;

			//

			inverseMatrix.getInverse( matrixWorld );
			ray.copy( raycaster.ray ).applyMatrix4( inverseMatrix );

			var localThreshold = threshold / ( ( this.scale.x + this.scale.y + this.scale.z ) / 3 );
			var localThresholdSq = localThreshold * localThreshold;
			var position = new Vector3();

			function testPoint( point, index ) {

				var rayPointDistanceSq = ray.distanceSqToPoint( point );

				if ( rayPointDistanceSq < localThresholdSq ) {

					var intersectPoint = ray.closestPointToPoint( point );
					intersectPoint.applyMatrix4( matrixWorld );

					var distance = raycaster.ray.origin.distanceTo( intersectPoint );

					if ( distance < raycaster.near || distance > raycaster.far ) return;

					intersects.push( {

						distance: distance,
						distanceToRay: Math.sqrt( rayPointDistanceSq ),
						point: intersectPoint.clone(),
						index: index,
						face: null,
						object: object

					} );

				}

			}

			if ( geometry.isBufferGeometry ) {

				var index = geometry.index;
				var attributes = geometry.attributes;
				var positions = attributes.position.array;

				if ( index !== null ) {

					var indices = index.array;

					for ( var i = 0, il = indices.length; i < il; i ++ ) {

						var a = indices[ i ];

						position.fromArray( positions, a * 3 );

						testPoint( position, a );

					}

				} else {

					for ( var i = 0, l = positions.length / 3; i < l; i ++ ) {

						position.fromArray( positions, i * 3 );

						testPoint( position, i );

					}

				}

			} else {

				var vertices = geometry.vertices;

				for ( var i = 0, l = vertices.length; i < l; i ++ ) {

					testPoint( vertices[ i ], i );

				}

			}

		};

	}() ),

	clone: function () {

		return new this.constructor( this.geometry, this.material ).copy( this );

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 */

function Group() {

	Object3D.call( this );

	this.type = 'Group';

}

Group.prototype = Object.assign( Object.create( Object3D.prototype ), {

	constructor: Group

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author benaadams / https://twitter.com/ben_a_adams
 * @author Mugen87 / https://github.com/Mugen87
 */

/**
 * @author Kaleb Murphy
 * @author Mugen87 / https://github.com/Mugen87
 */

/**
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 */

/**
 * @author benaadams / https://twitter.com/ben_a_adams
 * @author Mugen87 / https://github.com/Mugen87
 * @author hughes
 */

//export { WireframeGeometry } from './WireframeGeometry.js';
//export { ParametricGeometry, ParametricBufferGeometry } from './ParametricGeometry.js';
//export { TetrahedronGeometry, TetrahedronBufferGeometry } from './TetrahedronGeometry.js';
//export { OctahedronGeometry, OctahedronBufferGeometry } from './OctahedronGeometry.js';
//export { IcosahedronGeometry, IcosahedronBufferGeometry } from './IcosahedronGeometry.js';
//export { DodecahedronGeometry, DodecahedronBufferGeometry } from './DodecahedronGeometry.js';
//export { PolyhedronGeometry, PolyhedronBufferGeometry } from './PolyhedronGeometry.js';
//export { TubeGeometry, TubeBufferGeometry } from './TubeGeometry.js';
//export { TorusKnotGeometry, TorusKnotBufferGeometry } from './TorusKnotGeometry.js';
//export { TorusGeometry, TorusBufferGeometry } from './TorusGeometry.js';
//export { TextGeometry, TextBufferGeometry } from './TextGeometry.js';

//export { BoxGeometry, BoxBufferGeometry } from './BoxGeometry.js';

/**
 * @author alteredq / http://alteredqualia.com/
 *
 * parameters = {
 *  color: <hex>,
 *  opacity: <float>,
 *  map: new THREE.Texture( <Image> ),
 *
 *	uvOffset: new THREE.Vector2(),
 *	uvScale: new THREE.Vector2()
 * }
 */

function SpriteMaterial( parameters ) {

	Material.call( this );

	this.type = 'SpriteMaterial';

	this.color = new Color( 0xffffff );
	this.map = null;

	this.rotation = 0;

	this.fog = false;
	this.lights = false;

	this.setValues( parameters );

}

SpriteMaterial.prototype = Object.create( Material.prototype );
SpriteMaterial.prototype.constructor = SpriteMaterial;
SpriteMaterial.prototype.isSpriteMaterial = true;

SpriteMaterial.prototype.copy = function ( source ) {

	Material.prototype.copy.call( this, source );

	this.color.copy( source.color );
	this.map = source.map;

	this.rotation = source.rotation;

	return this;

};

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 *
 * parameters = {
 *  color: <hex>,
 *  specular: <hex>,
 *  shininess: <float>,
 *  opacity: <float>,
 *
 *  map: new THREE.Texture( <Image> ),
 *
 *  lightMap: new THREE.Texture( <Image> ),
 *  lightMapIntensity: <float>
 *
 *  aoMap: new THREE.Texture( <Image> ),
 *  aoMapIntensity: <float>
 *
 *  emissive: <hex>,
 *  emissiveIntensity: <float>
 *  emissiveMap: new THREE.Texture( <Image> ),
 *
 *  bumpMap: new THREE.Texture( <Image> ),
 *  bumpScale: <float>,
 *
 *  normalMap: new THREE.Texture( <Image> ),
 *  normalScale: <Vector2>,
 *
 *  displacementMap: new THREE.Texture( <Image> ),
 *  displacementScale: <float>,
 *  displacementBias: <float>,
 *
 *  specularMap: new THREE.Texture( <Image> ),
 *
 *  alphaMap: new THREE.Texture( <Image> ),
 *
 *  envMap: new THREE.TextureCube( [posx, negx, posy, negy, posz, negz] ),
 *  combine: THREE.Multiply,
 *  reflectivity: <float>,
 *  refractionRatio: <float>,
 *
 *  wireframe: <boolean>,
 *  wireframeLinewidth: <float>,
 *
 *  skinning: <bool>,
 *  morphTargets: <bool>,
 *  morphNormals: <bool>
 * }
 */

function MeshPhongMaterial( parameters ) {

	Material.call( this );

	this.type = 'MeshPhongMaterial';

	this.color = new Color( 0xffffff ); // diffuse
	this.specular = new Color( 0x111111 );
	this.shininess = 30;

	this.map = null;

	this.lightMap = null;
	this.lightMapIntensity = 1.0;

	this.aoMap = null;
	this.aoMapIntensity = 1.0;

	this.emissive = new Color( 0x000000 );
	this.emissiveIntensity = 1.0;
	this.emissiveMap = null;

	this.bumpMap = null;
	this.bumpScale = 1;

	this.normalMap = null;
	this.normalScale = new Vector2( 1, 1 );

	this.displacementMap = null;
	this.displacementScale = 1;
	this.displacementBias = 0;

	this.specularMap = null;

	this.alphaMap = null;

	this.envMap = null;
	this.combine = MultiplyOperation;
	this.reflectivity = 1;
	this.refractionRatio = 0.98;

	this.wireframe = false;
	this.wireframeLinewidth = 1;
	this.wireframeLinecap = 'round';
	this.wireframeLinejoin = 'round';

	this.skinning = false;
	this.morphTargets = false;
	this.morphNormals = false;

	this.setValues( parameters );

}

MeshPhongMaterial.prototype = Object.create( Material.prototype );
MeshPhongMaterial.prototype.constructor = MeshPhongMaterial;

MeshPhongMaterial.prototype.isMeshPhongMaterial = true;

MeshPhongMaterial.prototype.copy = function ( source ) {

	Material.prototype.copy.call( this, source );

	this.color.copy( source.color );
	this.specular.copy( source.specular );
	this.shininess = source.shininess;

	this.map = source.map;

	this.lightMap = source.lightMap;
	this.lightMapIntensity = source.lightMapIntensity;

	this.aoMap = source.aoMap;
	this.aoMapIntensity = source.aoMapIntensity;

	this.emissive.copy( source.emissive );
	this.emissiveMap = source.emissiveMap;
	this.emissiveIntensity = source.emissiveIntensity;

	this.bumpMap = source.bumpMap;
	this.bumpScale = source.bumpScale;

	this.normalMap = source.normalMap;
	this.normalScale.copy( source.normalScale );

	this.displacementMap = source.displacementMap;
	this.displacementScale = source.displacementScale;
	this.displacementBias = source.displacementBias;

	this.specularMap = source.specularMap;

	this.alphaMap = source.alphaMap;

	this.envMap = source.envMap;
	this.combine = source.combine;
	this.reflectivity = source.reflectivity;
	this.refractionRatio = source.refractionRatio;

	this.wireframe = source.wireframe;
	this.wireframeLinewidth = source.wireframeLinewidth;
	this.wireframeLinecap = source.wireframeLinecap;
	this.wireframeLinejoin = source.wireframeLinejoin;

	this.skinning = source.skinning;
	this.morphTargets = source.morphTargets;
	this.morphNormals = source.morphNormals;

	return this;

};

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 *
 * parameters = {
 *  color: <hex>,
 *  opacity: <float>,
 *
 *  map: new THREE.Texture( <Image> ),
 *
 *  lightMap: new THREE.Texture( <Image> ),
 *  lightMapIntensity: <float>
 *
 *  aoMap: new THREE.Texture( <Image> ),
 *  aoMapIntensity: <float>
 *
 *  emissive: <hex>,
 *  emissiveIntensity: <float>
 *  emissiveMap: new THREE.Texture( <Image> ),
 *
 *  specularMap: new THREE.Texture( <Image> ),
 *
 *  alphaMap: new THREE.Texture( <Image> ),
 *
 *  envMap: new THREE.TextureCube( [posx, negx, posy, negy, posz, negz] ),
 *  combine: THREE.Multiply,
 *  reflectivity: <float>,
 *  refractionRatio: <float>,
 *
 *  wireframe: <boolean>,
 *  wireframeLinewidth: <float>,
 *
 *  skinning: <bool>,
 *  morphTargets: <bool>,
 *  morphNormals: <bool>
 * }
 */

function MeshLambertMaterial( parameters ) {

	Material.call( this );

	this.type = 'MeshLambertMaterial';

	this.color = new Color( 0xffffff ); // diffuse

	this.map = null;

	this.lightMap = null;
	this.lightMapIntensity = 1.0;

	this.aoMap = null;
	this.aoMapIntensity = 1.0;

	this.emissive = new Color( 0x000000 );
	this.emissiveIntensity = 1.0;
	this.emissiveMap = null;

	this.specularMap = null;

	this.alphaMap = null;

	this.envMap = null;
	this.combine = MultiplyOperation;
	this.reflectivity = 1;
	this.refractionRatio = 0.98;

	this.wireframe = false;
	this.wireframeLinewidth = 1;
	this.wireframeLinecap = 'round';
	this.wireframeLinejoin = 'round';

	this.skinning = false;
	this.morphTargets = false;
	this.morphNormals = false;

	this.setValues( parameters );

}

MeshLambertMaterial.prototype = Object.create( Material.prototype );
MeshLambertMaterial.prototype.constructor = MeshLambertMaterial;

MeshLambertMaterial.prototype.isMeshLambertMaterial = true;

MeshLambertMaterial.prototype.copy = function ( source ) {

	Material.prototype.copy.call( this, source );

	this.color.copy( source.color );

	this.map = source.map;

	this.lightMap = source.lightMap;
	this.lightMapIntensity = source.lightMapIntensity;

	this.aoMap = source.aoMap;
	this.aoMapIntensity = source.aoMapIntensity;

	this.emissive.copy( source.emissive );
	this.emissiveMap = source.emissiveMap;
	this.emissiveIntensity = source.emissiveIntensity;

	this.specularMap = source.specularMap;

	this.alphaMap = source.alphaMap;

	this.envMap = source.envMap;
	this.combine = source.combine;
	this.reflectivity = source.reflectivity;
	this.refractionRatio = source.refractionRatio;

	this.wireframe = source.wireframe;
	this.wireframeLinewidth = source.wireframeLinewidth;
	this.wireframeLinecap = source.wireframeLinecap;
	this.wireframeLinejoin = source.wireframeLinejoin;

	this.skinning = source.skinning;
	this.morphTargets = source.morphTargets;
	this.morphNormals = source.morphNormals;

	return this;

};

//export { ShadowMaterial } from './ShadowMaterial.js';



var Materials = Object.freeze({
	SpriteMaterial: SpriteMaterial,
	ShaderMaterial: ShaderMaterial,
	PointsMaterial: PointsMaterial,
	MeshPhongMaterial: MeshPhongMaterial,
	MeshLambertMaterial: MeshLambertMaterial,
	MeshBasicMaterial: MeshBasicMaterial,
	LineBasicMaterial: LineBasicMaterial,
	Material: Material
});

/**
 * @author mrdoob / http://mrdoob.com/
 */

var Cache = {

	enabled: false,

	files: {},

	add: function ( key, file ) {

		if ( this.enabled === false ) return;

		// console.log( 'THREE.Cache', 'Adding key:', key );

		this.files[ key ] = file;

	},

	get: function ( key ) {

		if ( this.enabled === false ) return;

		// console.log( 'THREE.Cache', 'Checking key:', key );

		return this.files[ key ];

	},

	remove: function ( key ) {

		delete this.files[ key ];

	},

	clear: function () {

		this.files = {};

	}

};

/**
 * @author mrdoob / http://mrdoob.com/
 */

function LoadingManager( onLoad, onProgress, onError ) {

	var scope = this;

	var isLoading = false, itemsLoaded = 0, itemsTotal = 0;

	this.onStart = undefined;
	this.onLoad = onLoad;
	this.onProgress = onProgress;
	this.onError = onError;

	this.itemStart = function ( url ) {

		itemsTotal ++;

		if ( isLoading === false ) {

			if ( scope.onStart !== undefined ) {

				scope.onStart( url, itemsLoaded, itemsTotal );

			}

		}

		isLoading = true;

	};

	this.itemEnd = function ( url ) {

		itemsLoaded ++;

		if ( scope.onProgress !== undefined ) {

			scope.onProgress( url, itemsLoaded, itemsTotal );

		}

		if ( itemsLoaded === itemsTotal ) {

			isLoading = false;

			if ( scope.onLoad !== undefined ) {

				scope.onLoad();

			}

		}

	};

	this.itemError = function ( url ) {

		if ( scope.onError !== undefined ) {

			scope.onError( url );

		}

	};

}

var DefaultLoadingManager = new LoadingManager();

/**
 * @author mrdoob / http://mrdoob.com/
 */

function ImageLoader( manager ) {

	this.manager = ( manager !== undefined ) ? manager : DefaultLoadingManager;

}

Object.assign( ImageLoader.prototype, {

	load: function ( url, onLoad, onProgress, onError ) {

		if ( url === undefined ) url = '';

		if ( this.path !== undefined ) url = this.path + url;

		var scope = this;

		var cached = Cache.get( url );

		if ( cached !== undefined ) {

			scope.manager.itemStart( url );

			setTimeout( function () {

				if ( onLoad ) onLoad( cached );

				scope.manager.itemEnd( url );

			}, 0 );

			return cached;

		}

		var image = document.createElementNS( 'http://www.w3.org/1999/xhtml', 'img' );

		image.addEventListener( 'load', function () {

			Cache.add( url, this );

			if ( onLoad ) onLoad( this );

			scope.manager.itemEnd( url );

		}, false );

		/*
		image.addEventListener( 'progress', function ( event ) {

			if ( onProgress ) onProgress( event );

		}, false );
		*/

		image.addEventListener( 'error', function ( event ) {

			if ( onError ) onError( event );

			scope.manager.itemEnd( url );
			scope.manager.itemError( url );

		}, false );

		if ( url.substr( 0, 5 ) !== 'data:' ) {

			if ( this.crossOrigin !== undefined ) image.crossOrigin = this.crossOrigin;

		}

		scope.manager.itemStart( url );

		image.src = url;

		return image;

	},

	setCrossOrigin: function ( value ) {

		this.crossOrigin = value;
		return this;

	},

	setPath: function ( value ) {

		this.path = value;
		return this;

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 */

function TextureLoader( manager ) {

	this.manager = ( manager !== undefined ) ? manager : DefaultLoadingManager;

}

Object.assign( TextureLoader.prototype, {

	load: function ( url, onLoad, onProgress, onError ) {

		var loader = new ImageLoader( this.manager );
		loader.setCrossOrigin( this.crossOrigin );
		loader.setPath( this.path );

		var texture = new Texture();
		texture.image = loader.load( url, function () {

			// JPEGs can't have an alpha channel, so memory can be saved by storing them as RGB.
			var isJPEG = url.search( /\.(jpg|jpeg)$/ ) > 0 || url.search( /^data\:image\/jpeg/ ) === 0;

			texture.format = isJPEG ? RGBFormat : RGBAFormat;
			texture.needsUpdate = true;

			if ( onLoad !== undefined ) {

				onLoad( texture );

			}

		}, onProgress, onError );

		return texture;

	},

	setCrossOrigin: function ( value ) {

		this.crossOrigin = value;
		return this;

	},

	setPath: function ( value ) {

		this.path = value;
		return this;

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 */

function FileLoader( manager ) {

	this.manager = ( manager !== undefined ) ? manager : DefaultLoadingManager;

}

Object.assign( FileLoader.prototype, {

	load: function ( url, onLoad, onProgress, onError ) {

		if ( url === undefined ) url = '';

		if ( this.path !== undefined ) url = this.path + url;

		var scope = this;

		var cached = Cache.get( url );

		if ( cached !== undefined ) {

			scope.manager.itemStart( url );

			setTimeout( function () {

				if ( onLoad ) onLoad( cached );

				scope.manager.itemEnd( url );

			}, 0 );

			return cached;

		}

		// Check for data: URI
		var dataUriRegex = /^data:(.*?)(;base64)?,(.*)$/;
		var dataUriRegexResult = url.match( dataUriRegex );

		// Safari can not handle Data URIs through XMLHttpRequest so process manually
		if ( dataUriRegexResult ) {

			var mimeType = dataUriRegexResult[ 1 ];
			var isBase64 = !! dataUriRegexResult[ 2 ];
			var data = dataUriRegexResult[ 3 ];

			data = window.decodeURIComponent( data );

			if ( isBase64 ) data = window.atob( data );

			try {

				var response;
				var responseType = ( this.responseType || '' ).toLowerCase();

				switch ( responseType ) {

					case 'arraybuffer':
					case 'blob':

					 	response = new ArrayBuffer( data.length );

						var view = new Uint8Array( response );

						for ( var i = 0; i < data.length; i ++ ) {

							view[ i ] = data.charCodeAt( i );

						}

						if ( responseType === 'blob' ) {

							response = new Blob( [ response ], { type: mimeType } );

						}

						break;

					case 'document':

						var parser = new DOMParser();
						response = parser.parseFromString( data, mimeType );

						break;

					case 'json':

						response = JSON.parse( data );

						break;

					default: // 'text' or other

						response = data;

						break;

				}

				// Wait for next browser tick
				window.setTimeout( function () {

					if ( onLoad ) onLoad( response );

					scope.manager.itemEnd( url );

				}, 0 );

			} catch ( error ) {

				// Wait for next browser tick
				window.setTimeout( function () {

					if ( onError ) onError( error );

					scope.manager.itemEnd( url );
					scope.manager.itemError( url );

				}, 0 );

			}

		} else {

			var request = new XMLHttpRequest();
			request.open( 'GET', url, true );

			request.addEventListener( 'load', function ( event ) {

				var response = event.target.response;

				Cache.add( url, response );

				if ( this.status === 200 ) {

					if ( onLoad ) onLoad( response );

					scope.manager.itemEnd( url );

				} else if ( this.status === 0 ) {

					// Some browsers return HTTP Status 0 when using non-http protocol
					// e.g. 'file://' or 'data://'. Handle as success.

					console.warn( 'THREE.FileLoader: HTTP Status 0 received.' );

					if ( onLoad ) onLoad( response );

					scope.manager.itemEnd( url );

				} else {

					if ( onError ) onError( event );

					scope.manager.itemEnd( url );
					scope.manager.itemError( url );

				}

			}, false );

			if ( onProgress !== undefined ) {

				request.addEventListener( 'progress', function ( event ) {

					onProgress( event );

				}, false );

			}

			request.addEventListener( 'error', function ( event ) {

				if ( onError ) onError( event );

				scope.manager.itemEnd( url );
				scope.manager.itemError( url );

			}, false );

			if ( this.responseType !== undefined ) request.responseType = this.responseType;
			if ( this.withCredentials !== undefined ) request.withCredentials = this.withCredentials;

			if ( request.overrideMimeType ) request.overrideMimeType( this.mimeType !== undefined ? this.mimeType : 'text/plain' );

			for ( var header in this.requestHeader ) {

				request.setRequestHeader( header, this.requestHeader[ header ] );

			}

			request.send( null );

		}

		scope.manager.itemStart( url );

		return request;

	},

	setPath: function ( value ) {

		this.path = value;
		return this;

	},

	setResponseType: function ( value ) {

		this.responseType = value;
		return this;

	},

	setWithCredentials: function ( value ) {

		this.withCredentials = value;
		return this;

	},

	setMimeType: function ( value ) {

		this.mimeType = value;
		return this;

	},

	setRequestHeader: function ( value ) {

		this.requestHeader = value;
		return this;

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 */

function MaterialLoader( manager ) {

	this.manager = ( manager !== undefined ) ? manager : DefaultLoadingManager;
	this.textures = {};

}

Object.assign( MaterialLoader.prototype, {

	load: function ( url, onLoad, onProgress, onError ) {

		var scope = this;

		var loader = new FileLoader( scope.manager );
		loader.load( url, function ( text ) {

			onLoad( scope.parse( JSON.parse( text ) ) );

		}, onProgress, onError );

	},

	setTextures: function ( value ) {

		this.textures = value;

	},

	parse: function ( json ) {

		var textures = this.textures;

		function getTexture( name ) {

			if ( textures[ name ] === undefined ) {

				console.warn( 'THREE.MaterialLoader: Undefined texture', name );

			}

			return textures[ name ];

		}

		var material = new Materials[ json.type ]();

		if ( json.uuid !== undefined ) material.uuid = json.uuid;
		if ( json.name !== undefined ) material.name = json.name;
		if ( json.color !== undefined ) material.color.setHex( json.color );
		if ( json.roughness !== undefined ) material.roughness = json.roughness;
		if ( json.metalness !== undefined ) material.metalness = json.metalness;
		if ( json.emissive !== undefined ) material.emissive.setHex( json.emissive );
		if ( json.specular !== undefined ) material.specular.setHex( json.specular );
		if ( json.shininess !== undefined ) material.shininess = json.shininess;
		if ( json.clearCoat !== undefined ) material.clearCoat = json.clearCoat;
		if ( json.clearCoatRoughness !== undefined ) material.clearCoatRoughness = json.clearCoatRoughness;
		if ( json.uniforms !== undefined ) material.uniforms = json.uniforms;
		if ( json.vertexShader !== undefined ) material.vertexShader = json.vertexShader;
		if ( json.fragmentShader !== undefined ) material.fragmentShader = json.fragmentShader;
		if ( json.vertexColors !== undefined ) material.vertexColors = json.vertexColors;
		if ( json.fog !== undefined ) material.fog = json.fog;
		if ( json.shading !== undefined ) material.shading = json.shading;
		if ( json.blending !== undefined ) material.blending = json.blending;
		if ( json.side !== undefined ) material.side = json.side;
		if ( json.opacity !== undefined ) material.opacity = json.opacity;
		if ( json.transparent !== undefined ) material.transparent = json.transparent;
		if ( json.alphaTest !== undefined ) material.alphaTest = json.alphaTest;
		if ( json.depthTest !== undefined ) material.depthTest = json.depthTest;
		if ( json.depthWrite !== undefined ) material.depthWrite = json.depthWrite;
		if ( json.colorWrite !== undefined ) material.colorWrite = json.colorWrite;
		if ( json.wireframe !== undefined ) material.wireframe = json.wireframe;
		if ( json.wireframeLinewidth !== undefined ) material.wireframeLinewidth = json.wireframeLinewidth;
		if ( json.wireframeLinecap !== undefined ) material.wireframeLinecap = json.wireframeLinecap;
		if ( json.wireframeLinejoin !== undefined ) material.wireframeLinejoin = json.wireframeLinejoin;
		if ( json.skinning !== undefined ) material.skinning = json.skinning;
		if ( json.morphTargets !== undefined ) material.morphTargets = json.morphTargets;

		// for PointsMaterial

		if ( json.size !== undefined ) material.size = json.size;
		if ( json.sizeAttenuation !== undefined ) material.sizeAttenuation = json.sizeAttenuation;

		// maps

		if ( json.map !== undefined ) material.map = getTexture( json.map );

		if ( json.alphaMap !== undefined ) {

			material.alphaMap = getTexture( json.alphaMap );
			material.transparent = true;

		}

		if ( json.bumpMap !== undefined ) material.bumpMap = getTexture( json.bumpMap );
		if ( json.bumpScale !== undefined ) material.bumpScale = json.bumpScale;

		if ( json.normalMap !== undefined ) material.normalMap = getTexture( json.normalMap );
		if ( json.normalScale !== undefined ) {

			var normalScale = json.normalScale;

			if ( Array.isArray( normalScale ) === false ) {

				// Blender exporter used to export a scalar. See #7459

				normalScale = [ normalScale, normalScale ];

			}

			material.normalScale = new Vector2().fromArray( normalScale );

		}

		if ( json.displacementMap !== undefined ) material.displacementMap = getTexture( json.displacementMap );
		if ( json.displacementScale !== undefined ) material.displacementScale = json.displacementScale;
		if ( json.displacementBias !== undefined ) material.displacementBias = json.displacementBias;

		if ( json.roughnessMap !== undefined ) material.roughnessMap = getTexture( json.roughnessMap );
		if ( json.metalnessMap !== undefined ) material.metalnessMap = getTexture( json.metalnessMap );

		if ( json.emissiveMap !== undefined ) material.emissiveMap = getTexture( json.emissiveMap );
		if ( json.emissiveIntensity !== undefined ) material.emissiveIntensity = json.emissiveIntensity;

		if ( json.specularMap !== undefined ) material.specularMap = getTexture( json.specularMap );

		if ( json.envMap !== undefined ) material.envMap = getTexture( json.envMap );

		if ( json.reflectivity !== undefined ) material.reflectivity = json.reflectivity;

		if ( json.lightMap !== undefined ) material.lightMap = getTexture( json.lightMap );
		if ( json.lightMapIntensity !== undefined ) material.lightMapIntensity = json.lightMapIntensity;

		if ( json.aoMap !== undefined ) material.aoMap = getTexture( json.aoMap );
		if ( json.aoMapIntensity !== undefined ) material.aoMapIntensity = json.aoMapIntensity;

		if ( json.gradientMap !== undefined ) material.gradientMap = getTexture( json.gradientMap );

		return material;

	}

} );

/**
 * @author alteredq / http://alteredqualia.com/
 */

function Loader() {

	this.onLoadStart = function () {};
	this.onLoadProgress = function () {};
	this.onLoadComplete = function () {};

}

Loader.Handlers = {

	handlers: [],

	add: function ( regex, loader ) {

		this.handlers.push( regex, loader );

	},

	get: function ( file ) {

		var handlers = this.handlers;

		for ( var i = 0, l = handlers.length; i < l; i += 2 ) {

			var regex = handlers[ i ];
			var loader = handlers[ i + 1 ];

			if ( regex.test( file ) ) {

				return loader;

			}

		}

		return null;

	}

};

Object.assign( Loader.prototype, {

	crossOrigin: undefined,

	extractUrlBase: function ( url ) {

		var parts = url.split( '/' );

		if ( parts.length === 1 ) return './';

		parts.pop();

		return parts.join( '/' ) + '/';

	},

	initMaterials: function ( materials, texturePath, crossOrigin ) {

		var array = [];

		for ( var i = 0; i < materials.length; ++ i ) {

			array[ i ] = this.createMaterial( materials[ i ], texturePath, crossOrigin );

		}

		return array;

	},

	createMaterial: ( function () {

		var BlendingMode = {
			NoBlending: NoBlending,
			NormalBlending: NormalBlending,
			AdditiveBlending: AdditiveBlending,
			SubtractiveBlending: SubtractiveBlending,
			MultiplyBlending: MultiplyBlending,
			CustomBlending: CustomBlending
		};

		var color = new Color();
		var textureLoader = new TextureLoader();
		var materialLoader = new MaterialLoader();

		return function createMaterial( m, texturePath, crossOrigin ) {

			// convert from old material format

			var textures = {};

			function loadTexture( path, repeat, offset, wrap, anisotropy ) {

				var fullPath = texturePath + path;
				var loader = Loader.Handlers.get( fullPath );

				var texture;

				if ( loader !== null ) {

					texture = loader.load( fullPath );

				} else {

					textureLoader.setCrossOrigin( crossOrigin );
					texture = textureLoader.load( fullPath );

				}

				if ( repeat !== undefined ) {

					texture.repeat.fromArray( repeat );

					if ( repeat[ 0 ] !== 1 ) texture.wrapS = RepeatWrapping;
					if ( repeat[ 1 ] !== 1 ) texture.wrapT = RepeatWrapping;

				}

				if ( offset !== undefined ) {

					texture.offset.fromArray( offset );

				}

				if ( wrap !== undefined ) {

					if ( wrap[ 0 ] === 'repeat' ) texture.wrapS = RepeatWrapping;
					if ( wrap[ 0 ] === 'mirror' ) texture.wrapS = MirroredRepeatWrapping;

					if ( wrap[ 1 ] === 'repeat' ) texture.wrapT = RepeatWrapping;
					if ( wrap[ 1 ] === 'mirror' ) texture.wrapT = MirroredRepeatWrapping;

				}

				if ( anisotropy !== undefined ) {

					texture.anisotropy = anisotropy;

				}

				var uuid = _Math.generateUUID();

				textures[ uuid ] = texture;

				return uuid;

			}

			//

			var json = {
				uuid: _Math.generateUUID(),
				type: 'MeshLambertMaterial'
			};

			for ( var name in m ) {

				var value = m[ name ];

				switch ( name ) {

					case 'DbgColor':
					case 'DbgIndex':
					case 'opticalDensity':
					case 'illumination':
						break;
					case 'DbgName':
						json.name = value;
						break;
					case 'blending':
						json.blending = BlendingMode[ value ];
						break;
					case 'colorAmbient':
					case 'mapAmbient':
						console.warn( 'THREE.Loader.createMaterial:', name, 'is no longer supported.' );
						break;
					case 'colorDiffuse':
						json.color = color.fromArray( value ).getHex();
						break;
					case 'colorSpecular':
						json.specular = color.fromArray( value ).getHex();
						break;
					case 'colorEmissive':
						json.emissive = color.fromArray( value ).getHex();
						break;
					case 'specularCoef':
						json.shininess = value;
						break;
					case 'shading':
						if ( value.toLowerCase() === 'basic' ) json.type = 'MeshBasicMaterial';
						if ( value.toLowerCase() === 'phong' ) json.type = 'MeshPhongMaterial';
						if ( value.toLowerCase() === 'standard' ) json.type = 'MeshStandardMaterial';
						break;
					case 'mapDiffuse':
						json.map = loadTexture( value, m.mapDiffuseRepeat, m.mapDiffuseOffset, m.mapDiffuseWrap, m.mapDiffuseAnisotropy );
						break;
					case 'mapDiffuseRepeat':
					case 'mapDiffuseOffset':
					case 'mapDiffuseWrap':
					case 'mapDiffuseAnisotropy':
						break;
					case 'mapEmissive':
						json.emissiveMap = loadTexture( value, m.mapEmissiveRepeat, m.mapEmissiveOffset, m.mapEmissiveWrap, m.mapEmissiveAnisotropy );
						break;
					case 'mapEmissiveRepeat':
					case 'mapEmissiveOffset':
					case 'mapEmissiveWrap':
					case 'mapEmissiveAnisotropy':
						break;
					case 'mapLight':
						json.lightMap = loadTexture( value, m.mapLightRepeat, m.mapLightOffset, m.mapLightWrap, m.mapLightAnisotropy );
						break;
					case 'mapLightRepeat':
					case 'mapLightOffset':
					case 'mapLightWrap':
					case 'mapLightAnisotropy':
						break;
					case 'mapAO':
						json.aoMap = loadTexture( value, m.mapAORepeat, m.mapAOOffset, m.mapAOWrap, m.mapAOAnisotropy );
						break;
					case 'mapAORepeat':
					case 'mapAOOffset':
					case 'mapAOWrap':
					case 'mapAOAnisotropy':
						break;
					case 'mapBump':
						json.bumpMap = loadTexture( value, m.mapBumpRepeat, m.mapBumpOffset, m.mapBumpWrap, m.mapBumpAnisotropy );
						break;
					case 'mapBumpScale':
						json.bumpScale = value;
						break;
					case 'mapBumpRepeat':
					case 'mapBumpOffset':
					case 'mapBumpWrap':
					case 'mapBumpAnisotropy':
						break;
					case 'mapNormal':
						json.normalMap = loadTexture( value, m.mapNormalRepeat, m.mapNormalOffset, m.mapNormalWrap, m.mapNormalAnisotropy );
						break;
					case 'mapNormalFactor':
						json.normalScale = [ value, value ];
						break;
					case 'mapNormalRepeat':
					case 'mapNormalOffset':
					case 'mapNormalWrap':
					case 'mapNormalAnisotropy':
						break;
					case 'mapSpecular':
						json.specularMap = loadTexture( value, m.mapSpecularRepeat, m.mapSpecularOffset, m.mapSpecularWrap, m.mapSpecularAnisotropy );
						break;
					case 'mapSpecularRepeat':
					case 'mapSpecularOffset':
					case 'mapSpecularWrap':
					case 'mapSpecularAnisotropy':
						break;
					case 'mapMetalness':
						json.metalnessMap = loadTexture( value, m.mapMetalnessRepeat, m.mapMetalnessOffset, m.mapMetalnessWrap, m.mapMetalnessAnisotropy );
						break;
					case 'mapMetalnessRepeat':
					case 'mapMetalnessOffset':
					case 'mapMetalnessWrap':
					case 'mapMetalnessAnisotropy':
						break;
					case 'mapRoughness':
						json.roughnessMap = loadTexture( value, m.mapRoughnessRepeat, m.mapRoughnessOffset, m.mapRoughnessWrap, m.mapRoughnessAnisotropy );
						break;
					case 'mapRoughnessRepeat':
					case 'mapRoughnessOffset':
					case 'mapRoughnessWrap':
					case 'mapRoughnessAnisotropy':
						break;
					case 'mapAlpha':
						json.alphaMap = loadTexture( value, m.mapAlphaRepeat, m.mapAlphaOffset, m.mapAlphaWrap, m.mapAlphaAnisotropy );
						break;
					case 'mapAlphaRepeat':
					case 'mapAlphaOffset':
					case 'mapAlphaWrap':
					case 'mapAlphaAnisotropy':
						break;
					case 'flipSided':
						json.side = BackSide;
						break;
					case 'doubleSided':
						json.side = DoubleSide;
						break;
					case 'transparency':
						console.warn( 'THREE.Loader.createMaterial: transparency has been renamed to opacity' );
						json.opacity = value;
						break;
					case 'depthTest':
					case 'depthWrite':
					case 'colorWrite':
					case 'opacity':
					case 'reflectivity':
					case 'transparent':
					case 'visible':
					case 'wireframe':
						json[ name ] = value;
						break;
					case 'vertexColors':
						if ( value === true ) json.vertexColors = VertexColors;
						if ( value === 'face' ) json.vertexColors = FaceColors;
						break;
					default:
						console.error( 'THREE.Loader.createMaterial: Unsupported', name, value );
						break;

				}

			}

			if ( json.type === 'MeshBasicMaterial' ) delete json.emissive;
			if ( json.type !== 'MeshPhongMaterial' ) delete json.specular;

			if ( json.opacity < 1 ) json.transparent = true;

			materialLoader.setTextures( textures );

			return materialLoader.parse( json );

		};

	} )()

} );

/**
 * @author tschw
 * @author Ben Houston / http://clara.io/
 * @author David Sarno / http://lighthaus.us/
 */

var AnimationUtils = {

	// same as Array.prototype.slice, but also works on typed arrays
	arraySlice: function ( array, from, to ) {

		if ( AnimationUtils.isTypedArray( array ) ) {

			// in ios9 array.subarray(from, undefined) will return empty array
			// but array.subarray(from) or array.subarray(from, len) is correct
			return new array.constructor( array.subarray( from, to !== undefined ? to : array.length ) );

		}

		return array.slice( from, to );

	},

	// converts an array to a specific type
	convertArray: function ( array, type, forceClone ) {

		if ( ! array || // let 'undefined' and 'null' pass
				! forceClone && array.constructor === type ) return array;

		if ( typeof type.BYTES_PER_ELEMENT === 'number' ) {

			return new type( array ); // create typed array

		}

		return Array.prototype.slice.call( array ); // create Array

	},

	isTypedArray: function ( object ) {

		return ArrayBuffer.isView( object ) &&
				! ( object instanceof DataView );

	},

	// returns an array by which times and values can be sorted
	getKeyframeOrder: function ( times ) {

		function compareTime( i, j ) {

			return times[ i ] - times[ j ];

		}

		var n = times.length;
		var result = new Array( n );
		for ( var i = 0; i !== n; ++ i ) result[ i ] = i;

		result.sort( compareTime );

		return result;

	},

	// uses the array previously returned by 'getKeyframeOrder' to sort data
	sortedArray: function ( values, stride, order ) {

		var nValues = values.length;
		var result = new values.constructor( nValues );

		for ( var i = 0, dstOffset = 0; dstOffset !== nValues; ++ i ) {

			var srcOffset = order[ i ] * stride;

			for ( var j = 0; j !== stride; ++ j ) {

				result[ dstOffset ++ ] = values[ srcOffset + j ];

			}

		}

		return result;

	},

	// function for parsing AOS keyframe formats
	flattenJSON: function ( jsonKeys, times, values, valuePropertyName ) {

		var i = 1, key = jsonKeys[ 0 ];

		while ( key !== undefined && key[ valuePropertyName ] === undefined ) {

			key = jsonKeys[ i ++ ];

		}

		if ( key === undefined ) return; // no data

		var value = key[ valuePropertyName ];
		if ( value === undefined ) return; // no data

		if ( Array.isArray( value ) ) {

			do {

				value = key[ valuePropertyName ];

				if ( value !== undefined ) {

					times.push( key.time );
					values.push.apply( values, value ); // push all elements

				}

				key = jsonKeys[ i ++ ];

			} while ( key !== undefined );

		} else if ( value.toArray !== undefined ) {

			// ...assume THREE.Math-ish

			do {

				value = key[ valuePropertyName ];

				if ( value !== undefined ) {

					times.push( key.time );
					value.toArray( values, values.length );

				}

				key = jsonKeys[ i ++ ];

			} while ( key !== undefined );

		} else {

			// otherwise push as-is

			do {

				value = key[ valuePropertyName ];

				if ( value !== undefined ) {

					times.push( key.time );
					values.push( value );

				}

				key = jsonKeys[ i ++ ];

			} while ( key !== undefined );

		}

	}

};

/**
 * Abstract base class of interpolants over parametric samples.
 *
 * The parameter domain is one dimensional, typically the time or a path
 * along a curve defined by the data.
 *
 * The sample values can have any dimensionality and derived classes may
 * apply special interpretations to the data.
 *
 * This class provides the interval seek in a Template Method, deferring
 * the actual interpolation to derived classes.
 *
 * Time complexity is O(1) for linear access crossing at most two points
 * and O(log N) for random access, where N is the number of positions.
 *
 * References:
 *
 * 		http://www.oodesign.com/template-method-pattern.html
 *
 * @author tschw
 */

function Interpolant( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

	this.parameterPositions = parameterPositions;
	this._cachedIndex = 0;

	this.resultBuffer = resultBuffer !== undefined ?
			resultBuffer : new sampleValues.constructor( sampleSize );
	this.sampleValues = sampleValues;
	this.valueSize = sampleSize;

}

Object.assign( Interpolant.prototype, {

	evaluate: function( t ) {

		var pp = this.parameterPositions,
			i1 = this._cachedIndex,

			t1 = pp[   i1   ],
			t0 = pp[ i1 - 1 ];

		validate_interval: {

			seek: {

				var right;

				linear_scan: {
					//- See http://jsperf.com/comparison-to-undefined/3
					//- slower code:
					//-
					//- 				if ( t >= t1 || t1 === undefined ) {
					forward_scan: if ( ! ( t < t1 ) ) {

						for ( var giveUpAt = i1 + 2; ;) {

							if ( t1 === undefined ) {

								if ( t < t0 ) break forward_scan;

								// after end

								i1 = pp.length;
								this._cachedIndex = i1;
								return this.afterEnd_( i1 - 1, t, t0 );

							}

							if ( i1 === giveUpAt ) break; // this loop

							t0 = t1;
							t1 = pp[ ++ i1 ];

							if ( t < t1 ) {

								// we have arrived at the sought interval
								break seek;

							}

						}

						// prepare binary search on the right side of the index
						right = pp.length;
						break linear_scan;

					}

					//- slower code:
					//-					if ( t < t0 || t0 === undefined ) {
					if ( ! ( t >= t0 ) ) {

						// looping?

						var t1global = pp[ 1 ];

						if ( t < t1global ) {

							i1 = 2; // + 1, using the scan for the details
							t0 = t1global;

						}

						// linear reverse scan

						for ( var giveUpAt = i1 - 2; ;) {

							if ( t0 === undefined ) {

								// before start

								this._cachedIndex = 0;
								return this.beforeStart_( 0, t, t1 );

							}

							if ( i1 === giveUpAt ) break; // this loop

							t1 = t0;
							t0 = pp[ -- i1 - 1 ];

							if ( t >= t0 ) {

								// we have arrived at the sought interval
								break seek;

							}

						}

						// prepare binary search on the left side of the index
						right = i1;
						i1 = 0;
						break linear_scan;

					}

					// the interval is valid

					break validate_interval;

				} // linear scan

				// binary search

				while ( i1 < right ) {

					var mid = ( i1 + right ) >>> 1;

					if ( t < pp[ mid ] ) {

						right = mid;

					} else {

						i1 = mid + 1;

					}

				}

				t1 = pp[   i1   ];
				t0 = pp[ i1 - 1 ];

				// check boundary cases, again

				if ( t0 === undefined ) {

					this._cachedIndex = 0;
					return this.beforeStart_( 0, t, t1 );

				}

				if ( t1 === undefined ) {

					i1 = pp.length;
					this._cachedIndex = i1;
					return this.afterEnd_( i1 - 1, t0, t );

				}

			} // seek

			this._cachedIndex = i1;

			this.intervalChanged_( i1, t0, t1 );

		} // validate_interval

		return this.interpolate_( i1, t0, t, t1 );

	},

	settings: null, // optional, subclass-specific settings structure
	// Note: The indirection allows central control of many interpolants.

	// --- Protected interface

	DefaultSettings_: {},

	getSettings_: function() {

		return this.settings || this.DefaultSettings_;

	},

	copySampleValue_: function( index ) {

		// copies a sample value to the result buffer

		var result = this.resultBuffer,
			values = this.sampleValues,
			stride = this.valueSize,
			offset = index * stride;

		for ( var i = 0; i !== stride; ++ i ) {

			result[ i ] = values[ offset + i ];

		}

		return result;

	},

	// Template methods for derived classes:

	interpolate_: function( i1, t0, t, t1 ) {

		throw new Error( "call to abstract method" );
		// implementations shall return this.resultBuffer

	},

	intervalChanged_: function( i1, t0, t1 ) {

		// empty

	}

} );

//!\ DECLARE ALIAS AFTER assign prototype !
Object.assign( Interpolant.prototype, {

	//( 0, t, t0 ), returns this.resultBuffer
	beforeStart_: Interpolant.prototype.copySampleValue_,

	//( N-1, tN-1, t ), returns this.resultBuffer
	afterEnd_: Interpolant.prototype.copySampleValue_,

} );

/**
 * Fast and simple cubic spline interpolant.
 *
 * It was derived from a Hermitian construction setting the first derivative
 * at each sample position to the linear slope between neighboring positions
 * over their parameter interval.
 *
 * @author tschw
 */

function CubicInterpolant( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

	Interpolant.call(
			this, parameterPositions, sampleValues, sampleSize, resultBuffer );

	this._weightPrev = -0;
	this._offsetPrev = -0;
	this._weightNext = -0;
	this._offsetNext = -0;

}

CubicInterpolant.prototype = Object.assign( Object.create( Interpolant.prototype ), {

	constructor: CubicInterpolant,

	DefaultSettings_: {

		endingStart: 	ZeroCurvatureEnding,
		endingEnd:		ZeroCurvatureEnding

	},

	intervalChanged_: function( i1, t0, t1 ) {

		var pp = this.parameterPositions,
			iPrev = i1 - 2,
			iNext = i1 + 1,

			tPrev = pp[ iPrev ],
			tNext = pp[ iNext ];

		if ( tPrev === undefined ) {

			switch ( this.getSettings_().endingStart ) {

				case ZeroSlopeEnding:

					// f'(t0) = 0
					iPrev = i1;
					tPrev = 2 * t0 - t1;

					break;

				case WrapAroundEnding:

					// use the other end of the curve
					iPrev = pp.length - 2;
					tPrev = t0 + pp[ iPrev ] - pp[ iPrev + 1 ];

					break;

				default: // ZeroCurvatureEnding

					// f''(t0) = 0 a.k.a. Natural Spline
					iPrev = i1;
					tPrev = t1;

			}

		}

		if ( tNext === undefined ) {

			switch ( this.getSettings_().endingEnd ) {

				case ZeroSlopeEnding:

					// f'(tN) = 0
					iNext = i1;
					tNext = 2 * t1 - t0;

					break;

				case WrapAroundEnding:

					// use the other end of the curve
					iNext = 1;
					tNext = t1 + pp[ 1 ] - pp[ 0 ];

					break;

				default: // ZeroCurvatureEnding

					// f''(tN) = 0, a.k.a. Natural Spline
					iNext = i1 - 1;
					tNext = t0;

			}

		}

		var halfDt = ( t1 - t0 ) * 0.5,
			stride = this.valueSize;

		this._weightPrev = halfDt / ( t0 - tPrev );
		this._weightNext = halfDt / ( tNext - t1 );
		this._offsetPrev = iPrev * stride;
		this._offsetNext = iNext * stride;

	},

	interpolate_: function( i1, t0, t, t1 ) {

		var result = this.resultBuffer,
			values = this.sampleValues,
			stride = this.valueSize,

			o1 = i1 * stride,		o0 = o1 - stride,
			oP = this._offsetPrev, 	oN = this._offsetNext,
			wP = this._weightPrev,	wN = this._weightNext,

			p = ( t - t0 ) / ( t1 - t0 ),
			pp = p * p,
			ppp = pp * p;

		// evaluate polynomials

		var sP =     - wP   * ppp   +         2 * wP    * pp    -          wP   * p;
		var s0 = ( 1 + wP ) * ppp   + (-1.5 - 2 * wP )  * pp    + ( -0.5 + wP ) * p     + 1;
		var s1 = (-1 - wN ) * ppp   + ( 1.5 +   wN   )  * pp    +    0.5        * p;
		var sN =       wN   * ppp   -           wN      * pp;

		// combine data linearly

		for ( var i = 0; i !== stride; ++ i ) {

			result[ i ] =
					sP * values[ oP + i ] +
					s0 * values[ o0 + i ] +
					s1 * values[ o1 + i ] +
					sN * values[ oN + i ];

		}

		return result;

	}

} );

/**
 * @author tschw
 */

function LinearInterpolant( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

	Interpolant.call( this, parameterPositions, sampleValues, sampleSize, resultBuffer );

}

LinearInterpolant.prototype = Object.assign( Object.create( Interpolant.prototype ), {

	constructor: LinearInterpolant,

	interpolate_: function( i1, t0, t, t1 ) {

		var result = this.resultBuffer,
			values = this.sampleValues,
			stride = this.valueSize,

			offset1 = i1 * stride,
			offset0 = offset1 - stride,

			weight1 = ( t - t0 ) / ( t1 - t0 ),
			weight0 = 1 - weight1;

		for ( var i = 0; i !== stride; ++ i ) {

			result[ i ] =
					values[ offset0 + i ] * weight0 +
					values[ offset1 + i ] * weight1;

		}

		return result;

	}

} );

/**
 *
 * Interpolant that evaluates to the sample value at the position preceeding
 * the parameter.
 *
 * @author tschw
 */

function DiscreteInterpolant( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

	Interpolant.call( this, parameterPositions, sampleValues, sampleSize, resultBuffer );

}

DiscreteInterpolant.prototype = Object.assign( Object.create( Interpolant.prototype ), {

	constructor: DiscreteInterpolant,

	interpolate_: function( i1, t0, t, t1 ) {

		return this.copySampleValue_( i1 - 1 );

	}

} );

var KeyframeTrackPrototype;

KeyframeTrackPrototype = {

	TimeBufferType: Float32Array,
	ValueBufferType: Float32Array,

	DefaultInterpolation: InterpolateLinear,

	InterpolantFactoryMethodDiscrete: function ( result ) {

		return new DiscreteInterpolant(
				this.times, this.values, this.getValueSize(), result );

	},

	InterpolantFactoryMethodLinear: function ( result ) {

		return new LinearInterpolant(
				this.times, this.values, this.getValueSize(), result );

	},

	InterpolantFactoryMethodSmooth: function ( result ) {

		return new CubicInterpolant(
				this.times, this.values, this.getValueSize(), result );

	},

	setInterpolation: function ( interpolation ) {

		var factoryMethod;

		switch ( interpolation ) {

			case InterpolateDiscrete:

				factoryMethod = this.InterpolantFactoryMethodDiscrete;

				break;

			case InterpolateLinear:

				factoryMethod = this.InterpolantFactoryMethodLinear;

				break;

			case InterpolateSmooth:

				factoryMethod = this.InterpolantFactoryMethodSmooth;

				break;

		}

		if ( factoryMethod === undefined ) {

			var message = "unsupported interpolation for " +
					this.ValueTypeName + " keyframe track named " + this.name;

			if ( this.createInterpolant === undefined ) {

				// fall back to default, unless the default itself is messed up
				if ( interpolation !== this.DefaultInterpolation ) {

					this.setInterpolation( this.DefaultInterpolation );

				} else {

					throw new Error( message ); // fatal, in this case

				}

			}

			console.warn( 'THREE.KeyframeTrackPrototype:', message );
			return;

		}

		this.createInterpolant = factoryMethod;

	},

	getInterpolation: function () {

		switch ( this.createInterpolant ) {

			case this.InterpolantFactoryMethodDiscrete:

				return InterpolateDiscrete;

			case this.InterpolantFactoryMethodLinear:

				return InterpolateLinear;

			case this.InterpolantFactoryMethodSmooth:

				return InterpolateSmooth;

		}

	},

	getValueSize: function () {

		return this.values.length / this.times.length;

	},

	// move all keyframes either forwards or backwards in time
	shift: function ( timeOffset ) {

		if ( timeOffset !== 0.0 ) {

			var times = this.times;

			for ( var i = 0, n = times.length; i !== n; ++ i ) {

				times[ i ] += timeOffset;

			}

		}

		return this;

	},

	// scale all keyframe times by a factor (useful for frame <-> seconds conversions)
	scale: function ( timeScale ) {

		if ( timeScale !== 1.0 ) {

			var times = this.times;

			for ( var i = 0, n = times.length; i !== n; ++ i ) {

				times[ i ] *= timeScale;

			}

		}

		return this;

	},

	// removes keyframes before and after animation without changing any values within the range [startTime, endTime].
	// IMPORTANT: We do not shift around keys to the start of the track time, because for interpolated keys this will change their values
	trim: function ( startTime, endTime ) {

		var times = this.times,
			nKeys = times.length,
			from = 0,
			to = nKeys - 1;

		while ( from !== nKeys && times[ from ] < startTime ) ++ from;
		while ( to !== - 1 && times[ to ] > endTime ) -- to;

		++ to; // inclusive -> exclusive bound

		if ( from !== 0 || to !== nKeys ) {

			// empty tracks are forbidden, so keep at least one keyframe
			if ( from >= to ) to = Math.max( to, 1 ), from = to - 1;

			var stride = this.getValueSize();
			this.times = AnimationUtils.arraySlice( times, from, to );
			this.values = AnimationUtils.
					arraySlice( this.values, from * stride, to * stride );

		}

		return this;

	},

	// ensure we do not get a GarbageInGarbageOut situation, make sure tracks are at least minimally viable
	validate: function () {

		var valid = true;

		var valueSize = this.getValueSize();
		if ( valueSize - Math.floor( valueSize ) !== 0 ) {

			console.error( 'THREE.KeyframeTrackPrototype: Invalid value size in track.', this );
			valid = false;

		}

		var times = this.times,
			values = this.values,

			nKeys = times.length;

		if ( nKeys === 0 ) {

			console.error( 'THREE.KeyframeTrackPrototype: Track is empty.', this );
			valid = false;

		}

		var prevTime = null;

		for ( var i = 0; i !== nKeys; i ++ ) {

			var currTime = times[ i ];

			if ( typeof currTime === 'number' && isNaN( currTime ) ) {

				console.error( 'THREE.KeyframeTrackPrototype: Time is not a valid number.', this, i, currTime );
				valid = false;
				break;

			}

			if ( prevTime !== null && prevTime > currTime ) {

				console.error( 'THREE.KeyframeTrackPrototype: Out of order keys.', this, i, currTime, prevTime );
				valid = false;
				break;

			}

			prevTime = currTime;

		}

		if ( values !== undefined ) {

			if ( AnimationUtils.isTypedArray( values ) ) {

				for ( var i = 0, n = values.length; i !== n; ++ i ) {

					var value = values[ i ];

					if ( isNaN( value ) ) {

						console.error( 'THREE.KeyframeTrackPrototype: Value is not a valid number.', this, i, value );
						valid = false;
						break;

					}

				}

			}

		}

		return valid;

	},

	// removes equivalent sequential keys as common in morph target sequences
	// (0,0,0,0,1,1,1,0,0,0,0,0,0,0) --> (0,0,1,1,0,0)
	optimize: function () {

		var times = this.times,
			values = this.values,
			stride = this.getValueSize(),

			smoothInterpolation = this.getInterpolation() === InterpolateSmooth,

			writeIndex = 1,
			lastIndex = times.length - 1;

		for ( var i = 1; i < lastIndex; ++ i ) {

			var keep = false;

			var time = times[ i ];
			var timeNext = times[ i + 1 ];

			// remove adjacent keyframes scheduled at the same time

			if ( time !== timeNext && ( i !== 1 || time !== time[ 0 ] ) ) {

				if ( ! smoothInterpolation ) {

					// remove unnecessary keyframes same as their neighbors

					var offset = i * stride,
						offsetP = offset - stride,
						offsetN = offset + stride;

					for ( var j = 0; j !== stride; ++ j ) {

						var value = values[ offset + j ];

						if ( value !== values[ offsetP + j ] ||
								value !== values[ offsetN + j ] ) {

							keep = true;
							break;

						}

					}

				} else keep = true;

			}

			// in-place compaction

			if ( keep ) {

				if ( i !== writeIndex ) {

					times[ writeIndex ] = times[ i ];

					var readOffset = i * stride,
						writeOffset = writeIndex * stride;

					for ( var j = 0; j !== stride; ++ j )

						values[ writeOffset + j ] = values[ readOffset + j ];

				}

				++ writeIndex;

			}

		}

		// flush last keyframe (compaction looks ahead)

		if ( lastIndex > 0 ) {

			times[ writeIndex ] = times[ lastIndex ];

			for ( var readOffset = lastIndex * stride, writeOffset = writeIndex * stride, j = 0; j !== stride; ++ j )

				values[ writeOffset + j ] = values[ readOffset + j ];

			++ writeIndex;

		}

		if ( writeIndex !== times.length ) {

			this.times = AnimationUtils.arraySlice( times, 0, writeIndex );
			this.values = AnimationUtils.arraySlice( values, 0, writeIndex * stride );

		}

		return this;

	}

};

function KeyframeTrackConstructor( name, times, values, interpolation ) {

	if ( name === undefined ) throw new Error( "track name is undefined" );

	if ( times === undefined || times.length === 0 ) {

		throw new Error( "no keyframes in track named " + name );

	}

	this.name = name;

	this.times = AnimationUtils.convertArray( times, this.TimeBufferType );
	this.values = AnimationUtils.convertArray( values, this.ValueBufferType );

	this.setInterpolation( interpolation || this.DefaultInterpolation );

	this.validate();
	this.optimize();

}

/**
 *
 * A Track of vectored keyframe values.
 *
 *
 * @author Ben Houston / http://clara.io/
 * @author David Sarno / http://lighthaus.us/
 * @author tschw
 */

function VectorKeyframeTrack( name, times, values, interpolation ) {

	KeyframeTrackConstructor.call( this, name, times, values, interpolation );

}

VectorKeyframeTrack.prototype =
		Object.assign( Object.create( KeyframeTrackPrototype ), {

	constructor: VectorKeyframeTrack,

	ValueTypeName: 'vector'

	// ValueBufferType is inherited

	// DefaultInterpolation is inherited

} );

/**
 * Spherical linear unit quaternion interpolant.
 *
 * @author tschw
 */

function QuaternionLinearInterpolant( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

	Interpolant.call( this, parameterPositions, sampleValues, sampleSize, resultBuffer );

}

QuaternionLinearInterpolant.prototype = Object.assign( Object.create( Interpolant.prototype ), {

	constructor: QuaternionLinearInterpolant,

	interpolate_: function( i1, t0, t, t1 ) {

		var result = this.resultBuffer,
			values = this.sampleValues,
			stride = this.valueSize,

			offset = i1 * stride,

			alpha = ( t - t0 ) / ( t1 - t0 );

		for ( var end = offset + stride; offset !== end; offset += 4 ) {

			Quaternion.slerpFlat( result, 0,
					values, offset - stride, values, offset, alpha );

		}

		return result;

	}

} );

/**
 *
 * A Track of quaternion keyframe values.
 *
 * @author Ben Houston / http://clara.io/
 * @author David Sarno / http://lighthaus.us/
 * @author tschw
 */

function QuaternionKeyframeTrack( name, times, values, interpolation ) {

	KeyframeTrackConstructor.call( this, name, times, values, interpolation );

}

QuaternionKeyframeTrack.prototype =
		Object.assign( Object.create( KeyframeTrackPrototype ), {

	constructor: QuaternionKeyframeTrack,

	ValueTypeName: 'quaternion',

	// ValueBufferType is inherited

	DefaultInterpolation: InterpolateLinear,

	InterpolantFactoryMethodLinear: function( result ) {

		return new QuaternionLinearInterpolant(
				this.times, this.values, this.getValueSize(), result );

	},

	InterpolantFactoryMethodSmooth: undefined // not yet implemented

} );

/**
 *
 * A Track of numeric keyframe values.
 *
 * @author Ben Houston / http://clara.io/
 * @author David Sarno / http://lighthaus.us/
 * @author tschw
 */

function NumberKeyframeTrack( name, times, values, interpolation ) {

	KeyframeTrackConstructor.call( this, name, times, values, interpolation );

}

NumberKeyframeTrack.prototype =
		Object.assign( Object.create( KeyframeTrackPrototype ), {

	constructor: NumberKeyframeTrack,

	ValueTypeName: 'number'

	// ValueBufferType is inherited

	// DefaultInterpolation is inherited

} );

/**
 *
 * A Track that interpolates Strings
 *
 *
 * @author Ben Houston / http://clara.io/
 * @author David Sarno / http://lighthaus.us/
 * @author tschw
 */

function StringKeyframeTrack( name, times, values, interpolation ) {

	KeyframeTrackConstructor.call( this, name, times, values, interpolation );

}

StringKeyframeTrack.prototype =
		Object.assign( Object.create( KeyframeTrackPrototype ), {

	constructor: StringKeyframeTrack,

	ValueTypeName: 'string',
	ValueBufferType: Array,

	DefaultInterpolation: InterpolateDiscrete,

	InterpolantFactoryMethodLinear: undefined,

	InterpolantFactoryMethodSmooth: undefined

} );

/**
 *
 * A Track of Boolean keyframe values.
 *
 *
 * @author Ben Houston / http://clara.io/
 * @author David Sarno / http://lighthaus.us/
 * @author tschw
 */

function BooleanKeyframeTrack( name, times, values ) {

	KeyframeTrackConstructor.call( this, name, times, values );

}

BooleanKeyframeTrack.prototype =
		Object.assign( Object.create( KeyframeTrackPrototype ), {

	constructor: BooleanKeyframeTrack,

	ValueTypeName: 'bool',
	ValueBufferType: Array,

	DefaultInterpolation: InterpolateDiscrete,

	InterpolantFactoryMethodLinear: undefined,
	InterpolantFactoryMethodSmooth: undefined

	// Note: Actually this track could have a optimized / compressed
	// representation of a single value and a custom interpolant that
	// computes "firstValue ^ isOdd( index )".

} );

/**
 *
 * A Track of keyframe values that represent color.
 *
 *
 * @author Ben Houston / http://clara.io/
 * @author David Sarno / http://lighthaus.us/
 * @author tschw
 */

function ColorKeyframeTrack( name, times, values, interpolation ) {

	KeyframeTrackConstructor.call( this, name, times, values, interpolation );

}

ColorKeyframeTrack.prototype =
		Object.assign( Object.create( KeyframeTrackPrototype ), {

	constructor: ColorKeyframeTrack,

	ValueTypeName: 'color'

	// ValueBufferType is inherited

	// DefaultInterpolation is inherited


	// Note: Very basic implementation and nothing special yet.
	// However, this is the place for color space parameterization.

} );

/**
 *
 * A timed sequence of keyframes for a specific property.
 *
 *
 * @author Ben Houston / http://clara.io/
 * @author David Sarno / http://lighthaus.us/
 * @author tschw
 */

function KeyframeTrack( name, times, values, interpolation ) {

	KeyframeTrackConstructor.apply( this, arguments );

}

KeyframeTrack.prototype = KeyframeTrackPrototype;
KeyframeTrackPrototype.constructor = KeyframeTrack;

// Static methods:

Object.assign( KeyframeTrack, {

	// Serialization (in static context, because of constructor invocation
	// and automatic invocation of .toJSON):

	parse: function( json ) {

		if( json.type === undefined ) {

			throw new Error( "track type undefined, can not parse" );

		}

		var trackType = KeyframeTrack._getTrackTypeForValueTypeName( json.type );

		if ( json.times === undefined ) {

			var times = [], values = [];

			AnimationUtils.flattenJSON( json.keys, times, values, 'value' );

			json.times = times;
			json.values = values;

		}

		// derived classes can define a static parse method
		if ( trackType.parse !== undefined ) {

			return trackType.parse( json );

		} else {

			// by default, we asssume a constructor compatible with the base
			return new trackType(
					json.name, json.times, json.values, json.interpolation );

		}

	},

	toJSON: function( track ) {

		var trackType = track.constructor;

		var json;

		// derived classes can define a static toJSON method
		if ( trackType.toJSON !== undefined ) {

			json = trackType.toJSON( track );

		} else {

			// by default, we assume the data can be serialized as-is
			json = {

				'name': track.name,
				'times': AnimationUtils.convertArray( track.times, Array ),
				'values': AnimationUtils.convertArray( track.values, Array )

			};

			var interpolation = track.getInterpolation();

			if ( interpolation !== track.DefaultInterpolation ) {

				json.interpolation = interpolation;

			}

		}

		json.type = track.ValueTypeName; // mandatory

		return json;

	},

	_getTrackTypeForValueTypeName: function( typeName ) {

		switch( typeName.toLowerCase() ) {

			case "scalar":
			case "double":
			case "float":
			case "number":
			case "integer":

				return NumberKeyframeTrack;

			case "vector":
			case "vector2":
			case "vector3":
			case "vector4":

				return VectorKeyframeTrack;

			case "color":

				return ColorKeyframeTrack;

			case "quaternion":

				return QuaternionKeyframeTrack;

			case "bool":
			case "boolean":

				return BooleanKeyframeTrack;

			case "string":

				return StringKeyframeTrack;

		}

		throw new Error( "Unsupported typeName: " + typeName );

	}

} );

/**
 *
 * Reusable set of Tracks that represent an animation.
 *
 * @author Ben Houston / http://clara.io/
 * @author David Sarno / http://lighthaus.us/
 */

function AnimationClip( name, duration, tracks ) {

	this.name = name;
	this.tracks = tracks;
	this.duration = ( duration !== undefined ) ? duration : - 1;

	this.uuid = _Math.generateUUID();

	// this means it should figure out its duration by scanning the tracks
	if ( this.duration < 0 ) {

		this.resetDuration();

	}

	this.optimize();

}

Object.assign( AnimationClip, {

	parse: function ( json ) {

		var tracks = [],
			jsonTracks = json.tracks,
			frameTime = 1.0 / ( json.fps || 1.0 );

		for ( var i = 0, n = jsonTracks.length; i !== n; ++ i ) {

			tracks.push( KeyframeTrack.parse( jsonTracks[ i ] ).scale( frameTime ) );

		}

		return new AnimationClip( json.name, json.duration, tracks );

	},

	toJSON: function ( clip ) {

		var tracks = [],
			clipTracks = clip.tracks;

		var json = {

			'name': clip.name,
			'duration': clip.duration,
			'tracks': tracks

		};

		for ( var i = 0, n = clipTracks.length; i !== n; ++ i ) {

			tracks.push( KeyframeTrack.toJSON( clipTracks[ i ] ) );

		}

		return json;

	},

	CreateFromMorphTargetSequence: function ( name, morphTargetSequence, fps, noLoop ) {

		var numMorphTargets = morphTargetSequence.length;
		var tracks = [];

		for ( var i = 0; i < numMorphTargets; i ++ ) {

			var times = [];
			var values = [];

			times.push(
					( i + numMorphTargets - 1 ) % numMorphTargets,
					i,
					( i + 1 ) % numMorphTargets );

			values.push( 0, 1, 0 );

			var order = AnimationUtils.getKeyframeOrder( times );
			times = AnimationUtils.sortedArray( times, 1, order );
			values = AnimationUtils.sortedArray( values, 1, order );

			// if there is a key at the first frame, duplicate it as the
			// last frame as well for perfect loop.
			if ( ! noLoop && times[ 0 ] === 0 ) {

				times.push( numMorphTargets );
				values.push( values[ 0 ] );

			}

			tracks.push(
					new NumberKeyframeTrack(
						'.morphTargetInfluences[' + morphTargetSequence[ i ].name + ']',
						times, values
					).scale( 1.0 / fps ) );

		}

		return new AnimationClip( name, - 1, tracks );

	},

	findByName: function ( objectOrClipArray, name ) {

		var clipArray = objectOrClipArray;

		if ( ! Array.isArray( objectOrClipArray ) ) {

			var o = objectOrClipArray;
			clipArray = o.geometry && o.geometry.animations || o.animations;

		}

		for ( var i = 0; i < clipArray.length; i ++ ) {

			if ( clipArray[ i ].name === name ) {

				return clipArray[ i ];

			}

		}

		return null;

	},

	CreateClipsFromMorphTargetSequences: function ( morphTargets, fps, noLoop ) {

		var animationToMorphTargets = {};

		// tested with https://regex101.com/ on trick sequences
		// such flamingo_flyA_003, flamingo_run1_003, crdeath0059
		var pattern = /^([\w-]*?)([\d]+)$/;

		// sort morph target names into animation groups based
		// patterns like Walk_001, Walk_002, Run_001, Run_002
		for ( var i = 0, il = morphTargets.length; i < il; i ++ ) {

			var morphTarget = morphTargets[ i ];
			var parts = morphTarget.name.match( pattern );

			if ( parts && parts.length > 1 ) {

				var name = parts[ 1 ];

				var animationMorphTargets = animationToMorphTargets[ name ];
				if ( ! animationMorphTargets ) {

					animationToMorphTargets[ name ] = animationMorphTargets = [];

				}

				animationMorphTargets.push( morphTarget );

			}

		}

		var clips = [];

		for ( var name in animationToMorphTargets ) {

			clips.push( AnimationClip.CreateFromMorphTargetSequence( name, animationToMorphTargets[ name ], fps, noLoop ) );

		}

		return clips;

	},

	// parse the animation.hierarchy format
	parseAnimation: function ( animation, bones ) {

		if ( ! animation ) {

			console.error( 'THREE.AnimationClip: No animation in JSONLoader data.' );
			return null;

		}

		var addNonemptyTrack = function ( trackType, trackName, animationKeys, propertyName, destTracks ) {

			// only return track if there are actually keys.
			if ( animationKeys.length !== 0 ) {

				var times = [];
				var values = [];

				AnimationUtils.flattenJSON( animationKeys, times, values, propertyName );

				// empty keys are filtered out, so check again
				if ( times.length !== 0 ) {

					destTracks.push( new trackType( trackName, times, values ) );

				}

			}

		};

		var tracks = [];

		var clipName = animation.name || 'default';
		// automatic length determination in AnimationClip.
		var duration = animation.length || - 1;
		var fps = animation.fps || 30;

		var hierarchyTracks = animation.hierarchy || [];

		for ( var h = 0; h < hierarchyTracks.length; h ++ ) {

			var animationKeys = hierarchyTracks[ h ].keys;

			// skip empty tracks
			if ( ! animationKeys || animationKeys.length === 0 ) continue;

			// process morph targets
			if ( animationKeys[ 0 ].morphTargets ) {

				// figure out all morph targets used in this track
				var morphTargetNames = {};

				for ( var k = 0; k < animationKeys.length; k ++ ) {

					if ( animationKeys[ k ].morphTargets ) {

						for ( var m = 0; m < animationKeys[ k ].morphTargets.length; m ++ ) {

							morphTargetNames[ animationKeys[ k ].morphTargets[ m ] ] = - 1;

						}

					}

				}

				// create a track for each morph target with all zero
				// morphTargetInfluences except for the keys in which
				// the morphTarget is named.
				for ( var morphTargetName in morphTargetNames ) {

					var times = [];
					var values = [];

					for ( var m = 0; m !== animationKeys[ k ].morphTargets.length; ++ m ) {

						var animationKey = animationKeys[ k ];

						times.push( animationKey.time );
						values.push( ( animationKey.morphTarget === morphTargetName ) ? 1 : 0 );

					}

					tracks.push( new NumberKeyframeTrack( '.morphTargetInfluence[' + morphTargetName + ']', times, values ) );

				}

				duration = morphTargetNames.length * ( fps || 1.0 );

			} else {

				// ...assume skeletal animation

				var boneName = '.bones[' + bones[ h ].name + ']';

				addNonemptyTrack(
						VectorKeyframeTrack, boneName + '.position',
						animationKeys, 'pos', tracks );

				addNonemptyTrack(
						QuaternionKeyframeTrack, boneName + '.quaternion',
						animationKeys, 'rot', tracks );

				addNonemptyTrack(
						VectorKeyframeTrack, boneName + '.scale',
						animationKeys, 'scl', tracks );

			}

		}

		if ( tracks.length === 0 ) {

			return null;

		}

		var clip = new AnimationClip( clipName, duration, tracks );

		return clip;

	}

} );

Object.assign( AnimationClip.prototype, {

	resetDuration: function () {

		var tracks = this.tracks, duration = 0;

		for ( var i = 0, n = tracks.length; i !== n; ++ i ) {

			var track = this.tracks[ i ];

			duration = Math.max( duration, track.times[ track.times.length - 1 ] );

		}

		this.duration = duration;

	},

	trim: function () {

		for ( var i = 0; i < this.tracks.length; i ++ ) {

			this.tracks[ i ].trim( 0, this.duration );

		}

		return this;

	},

	optimize: function () {

		for ( var i = 0; i < this.tracks.length; i ++ ) {

			this.tracks[ i ].optimize();

		}

		return this;

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 */

function JSONLoader( manager ) {

	if ( typeof manager === 'boolean' ) {

		console.warn( 'THREE.JSONLoader: showStatus parameter has been removed from constructor.' );
		manager = undefined;

	}

	this.manager = ( manager !== undefined ) ? manager : DefaultLoadingManager;

	this.withCredentials = false;

}

Object.assign( JSONLoader.prototype, {

	load: function ( url, onLoad, onProgress, onError ) {

		var scope = this;

		var texturePath = this.texturePath && ( typeof this.texturePath === "string" ) ? this.texturePath : Loader.prototype.extractUrlBase( url );

		var loader = new FileLoader( this.manager );
		loader.setWithCredentials( this.withCredentials );
		loader.load( url, function ( text ) {

			var json = JSON.parse( text );
			var metadata = json.metadata;

			if ( metadata !== undefined ) {

				var type = metadata.type;

				if ( type !== undefined ) {

					if ( type.toLowerCase() === 'object' ) {

						console.error( 'THREE.JSONLoader: ' + url + ' should be loaded with THREE.ObjectLoader instead.' );
						return;

					}

					if ( type.toLowerCase() === 'scene' ) {

						console.error( 'THREE.JSONLoader: ' + url + ' should be loaded with THREE.SceneLoader instead.' );
						return;

					}

				}

			}

			var object = scope.parse( json, texturePath );
			onLoad( object.geometry, object.materials );

		}, onProgress, onError );

	},

	setTexturePath: function ( value ) {

		this.texturePath = value;

	},

	parse: ( function () {

		function parseModel( json, geometry ) {

			function isBitSet( value, position ) {

				return value & ( 1 << position );

			}

			var i, j, fi,

				offset, zLength,

				colorIndex, normalIndex, uvIndex, materialIndex,

				type,
				isQuad,
				hasMaterial,
				hasFaceVertexUv,
				hasFaceNormal, hasFaceVertexNormal,
				hasFaceColor, hasFaceVertexColor,

				vertex, face, faceA, faceB, hex, normal,

				uvLayer, uv, u, v,

				faces = json.faces,
				vertices = json.vertices,
				normals = json.normals,
				colors = json.colors,

				scale = json.scale,

				nUvLayers = 0;


			if ( json.uvs !== undefined ) {

				// disregard empty arrays

				for ( i = 0; i < json.uvs.length; i ++ ) {

					if ( json.uvs[ i ].length ) nUvLayers ++;

				}

				for ( i = 0; i < nUvLayers; i ++ ) {

					geometry.faceVertexUvs[ i ] = [];

				}

			}

			offset = 0;
			zLength = vertices.length;

			while ( offset < zLength ) {

				vertex = new Vector3();

				vertex.x = vertices[ offset ++ ] * scale;
				vertex.y = vertices[ offset ++ ] * scale;
				vertex.z = vertices[ offset ++ ] * scale;

				geometry.vertices.push( vertex );

			}

			offset = 0;
			zLength = faces.length;

			while ( offset < zLength ) {

				type = faces[ offset ++ ];

				isQuad = isBitSet( type, 0 );
				hasMaterial = isBitSet( type, 1 );
				hasFaceVertexUv = isBitSet( type, 3 );
				hasFaceNormal = isBitSet( type, 4 );
				hasFaceVertexNormal = isBitSet( type, 5 );
				hasFaceColor = isBitSet( type, 6 );
				hasFaceVertexColor = isBitSet( type, 7 );

				// console.log("type", type, "bits", isQuad, hasMaterial, hasFaceVertexUv, hasFaceNormal, hasFaceVertexNormal, hasFaceColor, hasFaceVertexColor);

				if ( isQuad ) {

					faceA = new Face3();
					faceA.a = faces[ offset ];
					faceA.b = faces[ offset + 1 ];
					faceA.c = faces[ offset + 3 ];

					faceB = new Face3();
					faceB.a = faces[ offset + 1 ];
					faceB.b = faces[ offset + 2 ];
					faceB.c = faces[ offset + 3 ];

					offset += 4;

					if ( hasMaterial ) {

						materialIndex = faces[ offset ++ ];
						faceA.materialIndex = materialIndex;
						faceB.materialIndex = materialIndex;

					}

					// to get face <=> uv index correspondence

					fi = geometry.faces.length;

					if ( hasFaceVertexUv ) {

						for ( i = 0; i < nUvLayers; i ++ ) {

							uvLayer = json.uvs[ i ];

							geometry.faceVertexUvs[ i ][ fi ] = [];
							geometry.faceVertexUvs[ i ][ fi + 1 ] = [];

							for ( j = 0; j < 4; j ++ ) {

								uvIndex = faces[ offset ++ ];

								u = uvLayer[ uvIndex * 2 ];
								v = uvLayer[ uvIndex * 2 + 1 ];

								uv = new Vector2( u, v );

								if ( j !== 2 ) geometry.faceVertexUvs[ i ][ fi ].push( uv );
								if ( j !== 0 ) geometry.faceVertexUvs[ i ][ fi + 1 ].push( uv );

							}

						}

					}

					if ( hasFaceNormal ) {

						normalIndex = faces[ offset ++ ] * 3;

						faceA.normal.set(
							normals[ normalIndex ++ ],
							normals[ normalIndex ++ ],
							normals[ normalIndex ]
						);

						faceB.normal.copy( faceA.normal );

					}

					if ( hasFaceVertexNormal ) {

						for ( i = 0; i < 4; i ++ ) {

							normalIndex = faces[ offset ++ ] * 3;

							normal = new Vector3(
								normals[ normalIndex ++ ],
								normals[ normalIndex ++ ],
								normals[ normalIndex ]
							);


							if ( i !== 2 ) faceA.vertexNormals.push( normal );
							if ( i !== 0 ) faceB.vertexNormals.push( normal );

						}

					}


					if ( hasFaceColor ) {

						colorIndex = faces[ offset ++ ];
						hex = colors[ colorIndex ];

						faceA.color.setHex( hex );
						faceB.color.setHex( hex );

					}


					if ( hasFaceVertexColor ) {

						for ( i = 0; i < 4; i ++ ) {

							colorIndex = faces[ offset ++ ];
							hex = colors[ colorIndex ];

							if ( i !== 2 ) faceA.vertexColors.push( new Color( hex ) );
							if ( i !== 0 ) faceB.vertexColors.push( new Color( hex ) );

						}

					}

					geometry.faces.push( faceA );
					geometry.faces.push( faceB );

				} else {

					face = new Face3();
					face.a = faces[ offset ++ ];
					face.b = faces[ offset ++ ];
					face.c = faces[ offset ++ ];

					if ( hasMaterial ) {

						materialIndex = faces[ offset ++ ];
						face.materialIndex = materialIndex;

					}

					// to get face <=> uv index correspondence

					fi = geometry.faces.length;

					if ( hasFaceVertexUv ) {

						for ( i = 0; i < nUvLayers; i ++ ) {

							uvLayer = json.uvs[ i ];

							geometry.faceVertexUvs[ i ][ fi ] = [];

							for ( j = 0; j < 3; j ++ ) {

								uvIndex = faces[ offset ++ ];

								u = uvLayer[ uvIndex * 2 ];
								v = uvLayer[ uvIndex * 2 + 1 ];

								uv = new Vector2( u, v );

								geometry.faceVertexUvs[ i ][ fi ].push( uv );

							}

						}

					}

					if ( hasFaceNormal ) {

						normalIndex = faces[ offset ++ ] * 3;

						face.normal.set(
							normals[ normalIndex ++ ],
							normals[ normalIndex ++ ],
							normals[ normalIndex ]
						);

					}

					if ( hasFaceVertexNormal ) {

						for ( i = 0; i < 3; i ++ ) {

							normalIndex = faces[ offset ++ ] * 3;

							normal = new Vector3(
								normals[ normalIndex ++ ],
								normals[ normalIndex ++ ],
								normals[ normalIndex ]
							);

							face.vertexNormals.push( normal );

						}

					}


					if ( hasFaceColor ) {

						colorIndex = faces[ offset ++ ];
						face.color.setHex( colors[ colorIndex ] );

					}


					if ( hasFaceVertexColor ) {

						for ( i = 0; i < 3; i ++ ) {

							colorIndex = faces[ offset ++ ];
							face.vertexColors.push( new Color( colors[ colorIndex ] ) );

						}

					}

					geometry.faces.push( face );

				}

			}

		}

		function parseSkin( json, geometry ) {

			var influencesPerVertex = ( json.influencesPerVertex !== undefined ) ? json.influencesPerVertex : 2;

			if ( json.skinWeights ) {

				for ( var i = 0, l = json.skinWeights.length; i < l; i += influencesPerVertex ) {

					var x = json.skinWeights[ i ];
					var y = ( influencesPerVertex > 1 ) ? json.skinWeights[ i + 1 ] : 0;
					var z = ( influencesPerVertex > 2 ) ? json.skinWeights[ i + 2 ] : 0;
					var w = ( influencesPerVertex > 3 ) ? json.skinWeights[ i + 3 ] : 0;

					geometry.skinWeights.push( new Vector4( x, y, z, w ) );

				}

			}

			if ( json.skinIndices ) {

				for ( var i = 0, l = json.skinIndices.length; i < l; i += influencesPerVertex ) {

					var a = json.skinIndices[ i ];
					var b = ( influencesPerVertex > 1 ) ? json.skinIndices[ i + 1 ] : 0;
					var c = ( influencesPerVertex > 2 ) ? json.skinIndices[ i + 2 ] : 0;
					var d = ( influencesPerVertex > 3 ) ? json.skinIndices[ i + 3 ] : 0;

					geometry.skinIndices.push( new Vector4( a, b, c, d ) );

				}

			}

			geometry.bones = json.bones;

			if ( geometry.bones && geometry.bones.length > 0 && ( geometry.skinWeights.length !== geometry.skinIndices.length || geometry.skinIndices.length !== geometry.vertices.length ) ) {

				console.warn( 'When skinning, number of vertices (' + geometry.vertices.length + '), skinIndices (' +
					geometry.skinIndices.length + '), and skinWeights (' + geometry.skinWeights.length + ') should match.' );

			}

		}

		function parseMorphing( json, geometry ) {

			var scale = json.scale;

			if ( json.morphTargets !== undefined ) {

				for ( var i = 0, l = json.morphTargets.length; i < l; i ++ ) {

					geometry.morphTargets[ i ] = {};
					geometry.morphTargets[ i ].name = json.morphTargets[ i ].name;
					geometry.morphTargets[ i ].vertices = [];

					var dstVertices = geometry.morphTargets[ i ].vertices;
					var srcVertices = json.morphTargets[ i ].vertices;

					for ( var v = 0, vl = srcVertices.length; v < vl; v += 3 ) {

						var vertex = new Vector3();
						vertex.x = srcVertices[ v ] * scale;
						vertex.y = srcVertices[ v + 1 ] * scale;
						vertex.z = srcVertices[ v + 2 ] * scale;

						dstVertices.push( vertex );

					}

				}

			}

			if ( json.morphColors !== undefined && json.morphColors.length > 0 ) {

				console.warn( 'THREE.JSONLoader: "morphColors" no longer supported. Using them as face colors.' );

				var faces = geometry.faces;
				var morphColors = json.morphColors[ 0 ].colors;

				for ( var i = 0, l = faces.length; i < l; i ++ ) {

					faces[ i ].color.fromArray( morphColors, i * 3 );

				}

			}

		}

		function parseAnimations( json, geometry ) {

			var outputAnimations = [];

			// parse old style Bone/Hierarchy animations
			var animations = [];

			if ( json.animation !== undefined ) {

				animations.push( json.animation );

			}

			if ( json.animations !== undefined ) {

				if ( json.animations.length ) {

					animations = animations.concat( json.animations );

				} else {

					animations.push( json.animations );

				}

			}

			for ( var i = 0; i < animations.length; i ++ ) {

				var clip = AnimationClip.parseAnimation( animations[ i ], geometry.bones );
				if ( clip ) outputAnimations.push( clip );

			}

			// parse implicit morph animations
			if ( geometry.morphTargets ) {

				// TODO: Figure out what an appropraite FPS is for morph target animations -- defaulting to 10, but really it is completely arbitrary.
				var morphAnimationClips = AnimationClip.CreateClipsFromMorphTargetSequences( geometry.morphTargets, 10 );
				outputAnimations = outputAnimations.concat( morphAnimationClips );

			}

			if ( outputAnimations.length > 0 ) geometry.animations = outputAnimations;

		}

		return function ( json, texturePath ) {

			if ( json.data !== undefined ) {

				// Geometry 4.0 spec
				json = json.data;

			}

			if ( json.scale !== undefined ) {

				json.scale = 1.0 / json.scale;

			} else {

				json.scale = 1.0;

			}

			var geometry = new Geometry();

			parseModel( json, geometry );
			parseSkin( json, geometry );
			parseMorphing( json, geometry );
			parseAnimations( json, geometry );

			geometry.computeFaceNormals();
			geometry.computeBoundingSphere();

			if ( json.materials === undefined || json.materials.length === 0 ) {

				return { geometry: geometry };

			} else {

				var materials = Loader.prototype.initMaterials( json.materials, texturePath, this.crossOrigin );

				return { geometry: geometry, materials: materials };

			}

		};

	} )()

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 */

function Light( color, intensity ) {

	Object3D.call( this );

	this.type = 'Light';

	this.color = new Color( color );
	this.intensity = intensity !== undefined ? intensity : 1;

	this.receiveShadow = undefined;

}

Light.prototype = Object.assign( Object.create( Object3D.prototype ), {

	constructor: Light,

	isLight: true,

	copy: function ( source ) {

		Object3D.prototype.copy.call( this, source );

		this.color.copy( source.color );
		this.intensity = source.intensity;

		return this;

	},

	toJSON: function ( meta ) {

		var data = Object3D.prototype.toJSON.call( this, meta );

		data.object.color = this.color.getHex();
		data.object.intensity = this.intensity;

		if ( this.groundColor !== undefined ) data.object.groundColor = this.groundColor.getHex();

		if ( this.distance !== undefined ) data.object.distance = this.distance;
		if ( this.angle !== undefined ) data.object.angle = this.angle;
		if ( this.decay !== undefined ) data.object.decay = this.decay;
		if ( this.penumbra !== undefined ) data.object.penumbra = this.penumbra;

		if ( this.shadow !== undefined ) data.object.shadow = this.shadow.toJSON();

		return data;

	}

} );

/**
 * @author alteredq / http://alteredqualia.com/
 */

function HemisphereLight( skyColor, groundColor, intensity ) {

	Light.call( this, skyColor, intensity );

	this.type = 'HemisphereLight';

	this.castShadow = undefined;

	this.position.copy( Object3D.DefaultUp );
	this.updateMatrix();

	this.groundColor = new Color( groundColor );

}

HemisphereLight.prototype = Object.assign( Object.create( Light.prototype ), {

	constructor: HemisphereLight,

	isHemisphereLight: true,

	copy: function ( source ) {

		Light.prototype.copy.call( this, source );

		this.groundColor.copy( source.groundColor );

		return this;

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 */

function LightShadow( camera ) {

	this.camera = camera;

	this.bias = 0;
	this.radius = 1;

	this.mapSize = new Vector2( 512, 512 );

	this.map = null;
	this.matrix = new Matrix4();

}

Object.assign( LightShadow.prototype, {

	copy: function ( source ) {

		this.camera = source.camera.clone();

		this.bias = source.bias;
		this.radius = source.radius;

		this.mapSize.copy( source.mapSize );

		return this;

	},

	clone: function () {

		return new this.constructor().copy( this );

	},

	toJSON: function () {

		var object = {};

		if ( this.bias !== 0 ) object.bias = this.bias;
		if ( this.radius !== 1 ) object.radius = this.radius;
		if ( this.mapSize.x !== 512 || this.mapSize.y !== 512 ) object.mapSize = this.mapSize.toArray();

		object.camera = this.camera.toJSON( false ).object;
		delete object.camera.matrix;

		return object;

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 */

function DirectionalLightShadow( ) {

	LightShadow.call( this, new OrthographicCamera( - 5, 5, 5, - 5, 0.5, 500 ) );

}

DirectionalLightShadow.prototype = Object.assign( Object.create( LightShadow.prototype ), {

	constructor: DirectionalLightShadow

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 */

function DirectionalLight( color, intensity ) {

	Light.call( this, color, intensity );

	this.type = 'DirectionalLight';

	this.position.copy( Object3D.DefaultUp );
	this.updateMatrix();

	this.target = new Object3D();

	this.shadow = new DirectionalLightShadow();

}

DirectionalLight.prototype = Object.assign( Object.create( Light.prototype ), {

	constructor: DirectionalLight,

	isDirectionalLight: true,

	copy: function ( source ) {

		Light.prototype.copy.call( this, source );

		this.target = source.target.clone();

		this.shadow = source.shadow.clone();

		return this;

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 */

function AmbientLight( color, intensity ) {

	Light.call( this, color, intensity );

	this.type = 'AmbientLight';

	this.castShadow = undefined;

}

AmbientLight.prototype = Object.assign( Object.create( Light.prototype ), {

	constructor: AmbientLight,

	isAmbientLight: true

} );

/**
 * @author mrdoob / http://mrdoob.com/
 */

function StereoCamera() {

	this.type = 'StereoCamera';

	this.aspect = 1;

	this.eyeSep = 0.064;

	this.cameraL = new PerspectiveCamera();
	this.cameraL.layers.enable( 1 );
	this.cameraL.matrixAutoUpdate = false;

	this.cameraR = new PerspectiveCamera();
	this.cameraR.layers.enable( 2 );
	this.cameraR.matrixAutoUpdate = false;

}

Object.assign( StereoCamera.prototype, {

	update: ( function () {

		var instance, focus, fov, aspect, near, far, zoom, eyeSep;

		var eyeRight = new Matrix4();
		var eyeLeft = new Matrix4();

		return function update( camera ) {

			var needsUpdate = instance !== this || focus !== camera.focus || fov !== camera.fov ||
												aspect !== camera.aspect * this.aspect || near !== camera.near ||
												far !== camera.far || zoom !== camera.zoom || eyeSep !== this.eyeSep;

			if ( needsUpdate ) {

				instance = this;
				focus = camera.focus;
				fov = camera.fov;
				aspect = camera.aspect * this.aspect;
				near = camera.near;
				far = camera.far;
				zoom = camera.zoom;

				// Off-axis stereoscopic effect based on
				// http://paulbourke.net/stereographics/stereorender/

				var projectionMatrix = camera.projectionMatrix.clone();
				eyeSep = this.eyeSep / 2;
				var eyeSepOnProjection = eyeSep * near / focus;
				var ymax = ( near * Math.tan( _Math.DEG2RAD * fov * 0.5 ) ) / zoom;
				var xmin, xmax;

				// translate xOffset

				eyeLeft.elements[ 12 ] = - eyeSep;
				eyeRight.elements[ 12 ] = eyeSep;

				// for left eye

				xmin = - ymax * aspect + eyeSepOnProjection;
				xmax = ymax * aspect + eyeSepOnProjection;

				projectionMatrix.elements[ 0 ] = 2 * near / ( xmax - xmin );
				projectionMatrix.elements[ 8 ] = ( xmax + xmin ) / ( xmax - xmin );

				this.cameraL.projectionMatrix.copy( projectionMatrix );

				// for right eye

				xmin = - ymax * aspect - eyeSepOnProjection;
				xmax = ymax * aspect - eyeSepOnProjection;

				projectionMatrix.elements[ 0 ] = 2 * near / ( xmax - xmin );
				projectionMatrix.elements[ 8 ] = ( xmax + xmin ) / ( xmax - xmin );

				this.cameraR.projectionMatrix.copy( projectionMatrix );

			}

			this.cameraL.matrixWorld.copy( camera.matrixWorld ).multiply( eyeLeft );
			this.cameraR.matrixWorld.copy( camera.matrixWorld ).multiply( eyeRight );

		};

	} )()

} );

/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * @author benaadams / https://twitter.com/ben_a_adams
 */

function InstancedBufferGeometry() {

	BufferGeometry.call( this );

	this.type = 'InstancedBufferGeometry';
	this.maxInstancedCount = undefined;

}

InstancedBufferGeometry.prototype = Object.assign( Object.create( BufferGeometry.prototype ), {

	constructor: InstancedBufferGeometry,

	isInstancedBufferGeometry: true,

	addGroup: function ( start, count, materialIndex ) {

		this.groups.push( {

			start: start,
			count: count,
			materialIndex: materialIndex

		} );

	},

	copy: function ( source ) {

		var index = source.index;

		if ( index !== null ) {

			this.setIndex( index.clone() );

		}

		var attributes = source.attributes;

		for ( var name in attributes ) {

			var attribute = attributes[ name ];
			this.addAttribute( name, attribute.clone() );

		}

		var groups = source.groups;

		for ( var i = 0, l = groups.length; i < l; i ++ ) {

			var group = groups[ i ];
			this.addGroup( group.start, group.count, group.materialIndex );

		}

		return this;

	}

} );

/**
 * @author benaadams / https://twitter.com/ben_a_adams
 */

function InstancedBufferAttribute( array, itemSize, meshPerAttribute ) {

	BufferAttribute.call( this, array, itemSize );

	this.meshPerAttribute = meshPerAttribute || 1;

}

InstancedBufferAttribute.prototype = Object.assign( Object.create( BufferAttribute.prototype ), {

	constructor: InstancedBufferAttribute,

	isInstancedBufferAttribute: true,

	copy: function ( source ) {

		BufferAttribute.prototype.copy.call( this, source );

		this.meshPerAttribute = source.meshPerAttribute;

		return this;

	}

} );

/**
 * @author mrdoob / http://mrdoob.com/
 * @author bhouston / http://clara.io/
 * @author stephomi / http://stephaneginier.com/
 */

function Raycaster( origin, direction, near, far ) {

	this.ray = new Ray( origin, direction );
	// direction is assumed to be normalized (for accurate distance calculations)

	this.near = near || 0;
	this.far = far || Infinity;

	this.params = {
		Mesh: {},
		Line: {},
		LOD: {},
		Points: { threshold: 1 },
		Sprite: {}
	};

	Object.defineProperties( this.params, {
		PointCloud: {
			get: function () {
				console.warn( 'THREE.Raycaster: params.PointCloud has been renamed to params.Points.' );
				return this.Points;
			}
		}
	} );

}

function ascSort( a, b ) {

	return a.distance - b.distance;

}

function intersectObject( object, raycaster, intersects, recursive ) {

	if ( object.visible === false ) return;

	object.raycast( raycaster, intersects );

	if ( recursive === true ) {

		var children = object.children;

		for ( var i = 0, l = children.length; i < l; i ++ ) {

			intersectObject( children[ i ], raycaster, intersects, true );

		}

	}

}

Object.assign( Raycaster.prototype, {

	linePrecision: 1,

	set: function ( origin, direction ) {

		// direction is assumed to be normalized (for accurate distance calculations)

		this.ray.set( origin, direction );

	},

	setFromCamera: function ( coords, camera ) {

		if ( ( camera && camera.isPerspectiveCamera ) ) {

			this.ray.origin.setFromMatrixPosition( camera.matrixWorld );
			this.ray.direction.set( coords.x, coords.y, 0.5 ).unproject( camera ).sub( this.ray.origin ).normalize();

		} else if ( ( camera && camera.isOrthographicCamera ) ) {

			this.ray.origin.set( coords.x, coords.y, ( camera.near + camera.far ) / ( camera.near - camera.far ) ).unproject( camera ); // set origin in plane of camera
			this.ray.direction.set( 0, 0, - 1 ).transformDirection( camera.matrixWorld );

		} else {

			console.error( 'THREE.Raycaster: Unsupported camera type.' );

		}

	},

	intersectObject: function ( object, recursive ) {

		var intersects = [];

		intersectObject( object, this, intersects, recursive );

		intersects.sort( ascSort );

		return intersects;

	},

	intersectObjects: function ( objects, recursive ) {

		var intersects = [];

		if ( Array.isArray( objects ) === false ) {

			console.warn( 'THREE.Raycaster.intersectObjects: objects is not an Array.' );
			return intersects;

		}

		for ( var i = 0, l = objects.length; i < l; i ++ ) {

			intersectObject( objects[ i ], this, intersects, recursive );

		}

		intersects.sort( ascSort );

		return intersects;

	}

} );

/**
 * @author alteredq / http://alteredqualia.com/
 */

function Clock( autoStart ) {

	this.autoStart = ( autoStart !== undefined ) ? autoStart : true;

	this.startTime = 0;
	this.oldTime = 0;
	this.elapsedTime = 0;

	this.running = false;

}

Object.assign( Clock.prototype, {

	start: function () {

		this.startTime = ( typeof performance === 'undefined' ? Date : performance ).now(); // see #10732

		this.oldTime = this.startTime;
		this.elapsedTime = 0;
		this.running = true;

	},

	stop: function () {

		this.getElapsedTime();
		this.running = false;
		this.autoStart = false;

	},

	getElapsedTime: function () {

		this.getDelta();
		return this.elapsedTime;

	},

	getDelta: function () {

		var diff = 0;

		if ( this.autoStart && ! this.running ) {

			this.start();
			return 0;

		}

		if ( this.running ) {

			var newTime = ( typeof performance === 'undefined' ? Date : performance ).now();

			diff = ( newTime - this.oldTime ) / 1000;
			this.oldTime = newTime;

			this.elapsedTime += diff;

		}

		return diff;

	}

} );

/**
 * @author bhouston / http://clara.io
 * @author WestLangley / http://github.com/WestLangley
 *
 * Ref: https://en.wikipedia.org/wiki/Spherical_coordinate_system
 *
 * The poles (phi) are at the positive and negative y axis.
 * The equator starts at positive z.
 */

function Spherical( radius, phi, theta ) {

	this.radius = ( radius !== undefined ) ? radius : 1.0;
	this.phi = ( phi !== undefined ) ? phi : 0; // up / down towards top and bottom pole
	this.theta = ( theta !== undefined ) ? theta : 0; // around the equator of the sphere

	return this;

}

Object.assign( Spherical.prototype, {

	set: function ( radius, phi, theta ) {

		this.radius = radius;
		this.phi = phi;
		this.theta = theta;

		return this;

	},

	clone: function () {

		return new this.constructor().copy( this );

	},

	copy: function ( other ) {

		this.radius = other.radius;
		this.phi = other.phi;
		this.theta = other.theta;

		return this;

	},

	// restrict phi to be betwee EPS and PI-EPS
	makeSafe: function() {

		var EPS = 0.000001;
		this.phi = Math.max( EPS, Math.min( Math.PI - EPS, this.phi ) );

		return this;

	},

	setFromVector3: function( vec3 ) {

		this.radius = vec3.length();

		if ( this.radius === 0 ) {

			this.theta = 0;
			this.phi = 0;

		} else {

			this.theta = Math.atan2( vec3.x, vec3.z ); // equator angle around y-up axis
			this.phi = Math.acos( _Math.clamp( vec3.y / this.radius, - 1, 1 ) ); // polar angle

		}

		return this;

	}

} );

/**
 * @author zz85 / http://www.lab4games.net/zz85/blog
 * Extensible curve object
 *
 * Some common of curve methods:
 * .getPoint(t), getTangent(t)
 * .getPointAt(u), getTangentAt(u)
 * .getPoints(), .getSpacedPoints()
 * .getLength()
 * .updateArcLengths()
 *
 * This following curves inherit from THREE.Curve:
 *
 * -- 2D curves --
 * THREE.ArcCurve
 * THREE.CubicBezierCurve
 * THREE.EllipseCurve
 * THREE.LineCurve
 * THREE.QuadraticBezierCurve
 * THREE.SplineCurve
 *
 * -- 3D curves --
 * THREE.CatmullRomCurve3
 * THREE.CubicBezierCurve3
 * THREE.LineCurve3
 * THREE.QuadraticBezierCurve3
 *
 * A series of curves can be represented as a THREE.CurvePath.
 *
 **/

/**************************************************************
 *	Abstract Curve base class
 **************************************************************/

function Curve() {

	this.arcLengthDivisions = 200;

}

Object.assign( Curve.prototype, {

	// Virtual base class method to overwrite and implement in subclasses
	//	- t [0 .. 1]

	getPoint: function () {

		console.warn( 'THREE.Curve: .getPoint() not implemented.' );
		return null;

	},

	// Get point at relative position in curve according to arc length
	// - u [0 .. 1]

	getPointAt: function ( u ) {

		var t = this.getUtoTmapping( u );
		return this.getPoint( t );

	},

	// Get sequence of points using getPoint( t )

	getPoints: function ( divisions ) {

		if ( divisions === undefined ) divisions = 5;

		var points = [];

		for ( var d = 0; d <= divisions; d ++ ) {

			points.push( this.getPoint( d / divisions ) );

		}

		return points;

	},

	// Get sequence of points using getPointAt( u )

	getSpacedPoints: function ( divisions ) {

		if ( divisions === undefined ) divisions = 5;

		var points = [];

		for ( var d = 0; d <= divisions; d ++ ) {

			points.push( this.getPointAt( d / divisions ) );

		}

		return points;

	},

	// Get total curve arc length

	getLength: function () {

		var lengths = this.getLengths();
		return lengths[ lengths.length - 1 ];

	},

	// Get list of cumulative segment lengths

	getLengths: function ( divisions ) {

		if ( divisions === undefined ) divisions = this.arcLengthDivisions;

		if ( this.cacheArcLengths &&
			( this.cacheArcLengths.length === divisions + 1 ) &&
			! this.needsUpdate ) {

			return this.cacheArcLengths;

		}

		this.needsUpdate = false;

		var cache = [];
		var current, last = this.getPoint( 0 );
		var p, sum = 0;

		cache.push( 0 );

		for ( p = 1; p <= divisions; p ++ ) {

			current = this.getPoint( p / divisions );
			sum += current.distanceTo( last );
			cache.push( sum );
			last = current;

		}

		this.cacheArcLengths = cache;

		return cache; // { sums: cache, sum: sum }; Sum is in the last element.

	},

	updateArcLengths: function () {

		this.needsUpdate = true;
		this.getLengths();

	},

	// Given u ( 0 .. 1 ), get a t to find p. This gives you points which are equidistant

	getUtoTmapping: function ( u, distance ) {

		var arcLengths = this.getLengths();

		var i = 0, il = arcLengths.length;

		var targetArcLength; // The targeted u distance value to get

		if ( distance ) {

			targetArcLength = distance;

		} else {

			targetArcLength = u * arcLengths[ il - 1 ];

		}

		// binary search for the index with largest value smaller than target u distance

		var low = 0, high = il - 1, comparison;

		while ( low <= high ) {

			i = Math.floor( low + ( high - low ) / 2 ); // less likely to overflow, though probably not issue here, JS doesn't really have integers, all numbers are floats

			comparison = arcLengths[ i ] - targetArcLength;

			if ( comparison < 0 ) {

				low = i + 1;

			} else if ( comparison > 0 ) {

				high = i - 1;

			} else {

				high = i;
				break;

				// DONE

			}

		}

		i = high;

		if ( arcLengths[ i ] === targetArcLength ) {

			return i / ( il - 1 );

		}

		// we could get finer grain at lengths, or use simple interpolation between two points

		var lengthBefore = arcLengths[ i ];
		var lengthAfter = arcLengths[ i + 1 ];

		var segmentLength = lengthAfter - lengthBefore;

		// determine where we are between the 'before' and 'after' points

		var segmentFraction = ( targetArcLength - lengthBefore ) / segmentLength;

		// add that fractional amount to t

		var t = ( i + segmentFraction ) / ( il - 1 );

		return t;

	},

	// Returns a unit vector tangent at t
	// In case any sub curve does not implement its tangent derivation,
	// 2 points a small delta apart will be used to find its gradient
	// which seems to give a reasonable approximation

	getTangent: function ( t ) {

		var delta = 0.0001;
		var t1 = t - delta;
		var t2 = t + delta;

		// Capping in case of danger

		if ( t1 < 0 ) t1 = 0;
		if ( t2 > 1 ) t2 = 1;

		var pt1 = this.getPoint( t1 );
		var pt2 = this.getPoint( t2 );

		var vec = pt2.clone().sub( pt1 );
		return vec.normalize();

	},

	getTangentAt: function ( u ) {

		var t = this.getUtoTmapping( u );
		return this.getTangent( t );

	},

	computeFrenetFrames: function ( segments, closed ) {

		// see http://www.cs.indiana.edu/pub/techreports/TR425.pdf

		var normal = new Vector3();

		var tangents = [];
		var normals = [];
		var binormals = [];

		var vec = new Vector3();
		var mat = new Matrix4();

		var i, u, theta;

		// compute the tangent vectors for each segment on the curve

		for ( i = 0; i <= segments; i ++ ) {

			u = i / segments;

			tangents[ i ] = this.getTangentAt( u );
			tangents[ i ].normalize();

		}

		// select an initial normal vector perpendicular to the first tangent vector,
		// and in the direction of the minimum tangent xyz component

		normals[ 0 ] = new Vector3();
		binormals[ 0 ] = new Vector3();
		var min = Number.MAX_VALUE;
		var tx = Math.abs( tangents[ 0 ].x );
		var ty = Math.abs( tangents[ 0 ].y );
		var tz = Math.abs( tangents[ 0 ].z );

		if ( tx <= min ) {

			min = tx;
			normal.set( 1, 0, 0 );

		}

		if ( ty <= min ) {

			min = ty;
			normal.set( 0, 1, 0 );

		}

		if ( tz <= min ) {

			normal.set( 0, 0, 1 );

		}

		vec.crossVectors( tangents[ 0 ], normal ).normalize();

		normals[ 0 ].crossVectors( tangents[ 0 ], vec );
		binormals[ 0 ].crossVectors( tangents[ 0 ], normals[ 0 ] );


		// compute the slowly-varying normal and binormal vectors for each segment on the curve

		for ( i = 1; i <= segments; i ++ ) {

			normals[ i ] = normals[ i - 1 ].clone();

			binormals[ i ] = binormals[ i - 1 ].clone();

			vec.crossVectors( tangents[ i - 1 ], tangents[ i ] );

			if ( vec.length() > Number.EPSILON ) {

				vec.normalize();

				theta = Math.acos( _Math.clamp( tangents[ i - 1 ].dot( tangents[ i ] ), - 1, 1 ) ); // clamp for floating pt errors

				normals[ i ].applyMatrix4( mat.makeRotationAxis( vec, theta ) );

			}

			binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

		}

		// if the curve is closed, postprocess the vectors so the first and last normal vectors are the same

		if ( closed === true ) {

			theta = Math.acos( _Math.clamp( normals[ 0 ].dot( normals[ segments ] ), - 1, 1 ) );
			theta /= segments;

			if ( tangents[ 0 ].dot( vec.crossVectors( normals[ 0 ], normals[ segments ] ) ) > 0 ) {

				theta = - theta;

			}

			for ( i = 1; i <= segments; i ++ ) {

				// twist a little...
				normals[ i ].applyMatrix4( mat.makeRotationAxis( tangents[ i ], theta * i ) );
				binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

			}

		}

		return {
			tangents: tangents,
			normals: normals,
			binormals: binormals
		};

	}

} );

/**
 * @author zz85 / http://www.lab4games.net/zz85/blog
 *
 * Bezier Curves formulas obtained from
 * http://en.wikipedia.org/wiki/Bézier_curve
 */

//export * from './Three.Legacy.js';

function CaveLoader ( callback, progress ) {

	if ( ! callback ) {

		alert( 'No callback specified' );

	}

	this.callback = callback;
	this.progress = progress;
	this.dataResponse = null;
	this.metadataResponse = null;
	this.taskCount = 0;

}

CaveLoader.prototype.constructor = CaveLoader;

CaveLoader.prototype.parseName = function ( name ) {

	var type;
	var rev = name.split( '.' ).reverse();

	this.extention = rev.shift();
	this.basename  = rev.reverse().join( '.' );

	switch ( this.extention ) {

	case '3d':

		type = 'arraybuffer';

		break;

	case 'lox':

		type = 'arraybuffer';

		break;

	case 'reg':
	case 'json':

		type = 'json';

		break;

	default:

		console.log( 'Cave: unknown response extension [', self.extention, ']' );

	}

	return type;

};

CaveLoader.prototype.loadURL = function ( fileName ) {

	var self = this;
	var prefix = getEnvironmentValue( 'surveyDirectory', '' );

	// parse file name
	var type = this.parseName( fileName );

	if ( ! type ) {

		alert( 'Cave: unknown file extension [', self.extention, ']' );
		return false;

	}

	this.doneCount = 0;
	this.taskCount = type === 'json' ? 1 : 2;

	var loader = new FileLoader().setPath( prefix );

	loader.setResponseType( type ).load( fileName, _dataLoaded, _progress, _error );

	// request metadata file if not a region (ie json file)

	if ( type !== 'json' ) {

		loader.setResponseType( 'json' ).load( replaceExtension( fileName, 'json' ), _metadataLoaded, undefined, _error );

	}

	return true;

	function _dataLoaded ( result ) {

		self.doneCount++;
		self.dataResponse = result;

		if ( self.doneCount === self.taskCount ) self.callHandler( fileName );

	}

	function _metadataLoaded ( result ) {

		self.doneCount++;
		self.metadataResponse = result;

		if ( self.doneCount === self.taskCount ) self.callHandler( fileName );

	}

	function _progress ( e ) {

		if ( self.progress) self.progress( Math.round( 100 * e.loaded / e.total ) );

	}

	function _error ( event ) {

		self.doneCount++;

		if ( event.currentTarget.responseType !== 'json' ) console.log( ' error event', event );

		if ( self.doneCount === self.taskCount ) self.callHandler( fileName );

	}

};

CaveLoader.prototype.loadFile = function ( file ) {

	var self = this;
	var fileName = file.name;

	var type = this.parseName( fileName );

	if ( ! type ) {

		alert( 'Cave: unknown file extension [', self.extention, ']' );
		return false;

	}

	var fLoader = new FileReader();

	fLoader.addEventListener( 'load', _loaded );
	fLoader.addEventListener( 'progress', _progress );

	switch ( type ) {

	case 'arraybuffer':

		fLoader.readAsArrayBuffer( file );

		break;

	/*case 'arraybuffer':

		fLoader.readAsArrayText( file );

		break;*/

	default:

		alert( 'unknown file data type' );
		return false;

	}

	return true;

	function _loaded () {

		self.dataResponse = fLoader.result;
		self.callHandler( fileName );

	}

	function _progress ( e ) {

		if ( self.progress ) self.progress( Math.round( 100 * e.loaded / e.total ) );

	}

};

CaveLoader.prototype.callHandler = function ( fileName ) {

	if ( this.dataResponse === null ) {

		this.callback( false );
		return;

	}

	var handler;
	var data = this.dataResponse;
	var metadata = this.metadataResponse;

	switch ( this.extention ) {

	case '3d':

		handler = new Svx3dHandler( fileName, data, metadata );

		break;

	case 'lox':

		handler = new loxHandler( fileName, data, metadata );

		break;

	case 'reg':

		handler = new RegionHandler( fileName, data );

		break;

	default:

		alert( 'Cave: unknown response extension [', this.extention, ']' );
		handler = false;

	}

	this.dataResponse = null;
	this.metadataResponse = null;

	this.callback( handler );

};



// EOF

onmessage = onMessage;

function onMessage ( event ) {

	var file = event.data;

	var loader = new CaveLoader( _caveLoaded );

	loader.loadURL( file );

	function _caveLoaded( cave ) {

		postMessage( { status: 'ok', survey: cave.getSurvey() } );

	}

}

})));
