(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var twoProduct_1 = twoProduct;

var SPLITTER = +(Math.pow(2, 27) + 1.0);

function twoProduct(a, b, result) {
  var x = a * b;

  var c = SPLITTER * a;
  var abig = c - a;
  var ahi = c - abig;
  var alo = a - ahi;

  var d = SPLITTER * b;
  var bbig = d - b;
  var bhi = d - bbig;
  var blo = b - bhi;

  var err1 = x - (ahi * bhi);
  var err2 = err1 - (alo * bhi);
  var err3 = err2 - (ahi * blo);

  var y = alo * blo - err3;

  if(result) {
    result[0] = y;
    result[1] = x;
    return result
  }

  return [ y, x ]
}

var robustSum = linearExpansionSum;

//Easy case: Add two scalars
function scalarScalar(a, b) {
  var x = a + b;
  var bv = x - a;
  var av = x - bv;
  var br = b - bv;
  var ar = a - av;
  var y = ar + br;
  if(y) {
    return [y, x]
  }
  return [x]
}

function linearExpansionSum(e, f) {
  var ne = e.length|0;
  var nf = f.length|0;
  if(ne === 1 && nf === 1) {
    return scalarScalar(e[0], f[0])
  }
  var n = ne + nf;
  var g = new Array(n);
  var count = 0;
  var eptr = 0;
  var fptr = 0;
  var abs = Math.abs;
  var ei = e[eptr];
  var ea = abs(ei);
  var fi = f[fptr];
  var fa = abs(fi);
  var a, b;
  if(ea < fa) {
    b = ei;
    eptr += 1;
    if(eptr < ne) {
      ei = e[eptr];
      ea = abs(ei);
    }
  } else {
    b = fi;
    fptr += 1;
    if(fptr < nf) {
      fi = f[fptr];
      fa = abs(fi);
    }
  }
  if((eptr < ne && ea < fa) || (fptr >= nf)) {
    a = ei;
    eptr += 1;
    if(eptr < ne) {
      ei = e[eptr];
      ea = abs(ei);
    }
  } else {
    a = fi;
    fptr += 1;
    if(fptr < nf) {
      fi = f[fptr];
      fa = abs(fi);
    }
  }
  var x = a + b;
  var bv = x - a;
  var y = b - bv;
  var q0 = y;
  var q1 = x;
  var _x, _bv, _av, _br, _ar;
  while(eptr < ne && fptr < nf) {
    if(ea < fa) {
      a = ei;
      eptr += 1;
      if(eptr < ne) {
        ei = e[eptr];
        ea = abs(ei);
      }
    } else {
      a = fi;
      fptr += 1;
      if(fptr < nf) {
        fi = f[fptr];
        fa = abs(fi);
      }
    }
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if(y) {
      g[count++] = y;
    }
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
  }
  while(eptr < ne) {
    a = ei;
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if(y) {
      g[count++] = y;
    }
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
    eptr += 1;
    if(eptr < ne) {
      ei = e[eptr];
    }
  }
  while(fptr < nf) {
    a = fi;
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if(y) {
      g[count++] = y;
    } 
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
    fptr += 1;
    if(fptr < nf) {
      fi = f[fptr];
    }
  }
  if(q0) {
    g[count++] = q0;
  }
  if(q1) {
    g[count++] = q1;
  }
  if(!count) {
    g[count++] = 0.0;  
  }
  g.length = count;
  return g
}

var twoSum = fastTwoSum;

function fastTwoSum(a, b, result) {
	var x = a + b;
	var bv = x - a;
	var av = x - bv;
	var br = b - bv;
	var ar = a - av;
	if(result) {
		result[0] = ar + br;
		result[1] = x;
		return result
	}
	return [ar+br, x]
}

var robustScale = scaleLinearExpansion;

function scaleLinearExpansion(e, scale) {
  var n = e.length;
  if(n === 1) {
    var ts = twoProduct_1(e[0], scale);
    if(ts[0]) {
      return ts
    }
    return [ ts[1] ]
  }
  var g = new Array(2 * n);
  var q = [0.1, 0.1];
  var t = [0.1, 0.1];
  var count = 0;
  twoProduct_1(e[0], scale, q);
  if(q[0]) {
    g[count++] = q[0];
  }
  for(var i=1; i<n; ++i) {
    twoProduct_1(e[i], scale, t);
    var pq = q[1];
    twoSum(pq, t[0], q);
    if(q[0]) {
      g[count++] = q[0];
    }
    var a = t[1];
    var b = q[1];
    var x = a + b;
    var bv = x - a;
    var y = b - bv;
    q[1] = x;
    if(y) {
      g[count++] = y;
    }
  }
  if(q[1]) {
    g[count++] = q[1];
  }
  if(count === 0) {
    g[count++] = 0.0;
  }
  g.length = count;
  return g
}

var robustDiff = robustSubtract;

//Easy case: Add two scalars
function scalarScalar$1(a, b) {
  var x = a + b;
  var bv = x - a;
  var av = x - bv;
  var br = b - bv;
  var ar = a - av;
  var y = ar + br;
  if(y) {
    return [y, x]
  }
  return [x]
}

function robustSubtract(e, f) {
  var ne = e.length|0;
  var nf = f.length|0;
  if(ne === 1 && nf === 1) {
    return scalarScalar$1(e[0], -f[0])
  }
  var n = ne + nf;
  var g = new Array(n);
  var count = 0;
  var eptr = 0;
  var fptr = 0;
  var abs = Math.abs;
  var ei = e[eptr];
  var ea = abs(ei);
  var fi = -f[fptr];
  var fa = abs(fi);
  var a, b;
  if(ea < fa) {
    b = ei;
    eptr += 1;
    if(eptr < ne) {
      ei = e[eptr];
      ea = abs(ei);
    }
  } else {
    b = fi;
    fptr += 1;
    if(fptr < nf) {
      fi = -f[fptr];
      fa = abs(fi);
    }
  }
  if((eptr < ne && ea < fa) || (fptr >= nf)) {
    a = ei;
    eptr += 1;
    if(eptr < ne) {
      ei = e[eptr];
      ea = abs(ei);
    }
  } else {
    a = fi;
    fptr += 1;
    if(fptr < nf) {
      fi = -f[fptr];
      fa = abs(fi);
    }
  }
  var x = a + b;
  var bv = x - a;
  var y = b - bv;
  var q0 = y;
  var q1 = x;
  var _x, _bv, _av, _br, _ar;
  while(eptr < ne && fptr < nf) {
    if(ea < fa) {
      a = ei;
      eptr += 1;
      if(eptr < ne) {
        ei = e[eptr];
        ea = abs(ei);
      }
    } else {
      a = fi;
      fptr += 1;
      if(fptr < nf) {
        fi = -f[fptr];
        fa = abs(fi);
      }
    }
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if(y) {
      g[count++] = y;
    }
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
  }
  while(eptr < ne) {
    a = ei;
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if(y) {
      g[count++] = y;
    }
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
    eptr += 1;
    if(eptr < ne) {
      ei = e[eptr];
    }
  }
  while(fptr < nf) {
    a = fi;
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if(y) {
      g[count++] = y;
    } 
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
    fptr += 1;
    if(fptr < nf) {
      fi = -f[fptr];
    }
  }
  if(q0) {
    g[count++] = q0;
  }
  if(q1) {
    g[count++] = q1;
  }
  if(!count) {
    g[count++] = 0.0;  
  }
  g.length = count;
  return g
}

var orientation_1 = createCommonjsModule(function (module) {






var NUM_EXPAND = 5;

var EPSILON     = 1.1102230246251565e-16;
var ERRBOUND3   = (3.0 + 16.0 * EPSILON) * EPSILON;
var ERRBOUND4   = (7.0 + 56.0 * EPSILON) * EPSILON;

function cofactor(m, c) {
  var result = new Array(m.length-1);
  for(var i=1; i<m.length; ++i) {
    var r = result[i-1] = new Array(m.length-1);
    for(var j=0,k=0; j<m.length; ++j) {
      if(j === c) {
        continue
      }
      r[k++] = m[i][j];
    }
  }
  return result
}

function matrix(n) {
  var result = new Array(n);
  for(var i=0; i<n; ++i) {
    result[i] = new Array(n);
    for(var j=0; j<n; ++j) {
      result[i][j] = ["m", j, "[", (n-i-1), "]"].join("");
    }
  }
  return result
}

function sign(n) {
  if(n & 1) {
    return "-"
  }
  return ""
}

function generateSum(expr) {
  if(expr.length === 1) {
    return expr[0]
  } else if(expr.length === 2) {
    return ["sum(", expr[0], ",", expr[1], ")"].join("")
  } else {
    var m = expr.length>>1;
    return ["sum(", generateSum(expr.slice(0, m)), ",", generateSum(expr.slice(m)), ")"].join("")
  }
}

function determinant(m) {
  if(m.length === 2) {
    return [["sum(prod(", m[0][0], ",", m[1][1], "),prod(-", m[0][1], ",", m[1][0], "))"].join("")]
  } else {
    var expr = [];
    for(var i=0; i<m.length; ++i) {
      expr.push(["scale(", generateSum(determinant(cofactor(m, i))), ",", sign(i), m[0][i], ")"].join(""));
    }
    return expr
  }
}

function orientation(n) {
  var pos = [];
  var neg = [];
  var m = matrix(n);
  var args = [];
  for(var i=0; i<n; ++i) {
    if((i&1)===0) {
      pos.push.apply(pos, determinant(cofactor(m, i)));
    } else {
      neg.push.apply(neg, determinant(cofactor(m, i)));
    }
    args.push("m" + i);
  }
  var posExpr = generateSum(pos);
  var negExpr = generateSum(neg);
  var funcName = "orientation" + n + "Exact";
  var code = ["function ", funcName, "(", args.join(), "){var p=", posExpr, ",n=", negExpr, ",d=sub(p,n);\
return d[d.length-1];};return ", funcName].join("");
  var proc = new Function("sum", "prod", "scale", "sub", code);
  return proc(robustSum, twoProduct_1, robustScale, robustDiff)
}

var orientation3Exact = orientation(3);
var orientation4Exact = orientation(4);

var CACHED = [
  function orientation0() { return 0 },
  function orientation1() { return 0 },
  function orientation2(a, b) { 
    return b[0] - a[0]
  },
  function orientation3(a, b, c) {
    var l = (a[1] - c[1]) * (b[0] - c[0]);
    var r = (a[0] - c[0]) * (b[1] - c[1]);
    var det = l - r;
    var s;
    if(l > 0) {
      if(r <= 0) {
        return det
      } else {
        s = l + r;
      }
    } else if(l < 0) {
      if(r >= 0) {
        return det
      } else {
        s = -(l + r);
      }
    } else {
      return det
    }
    var tol = ERRBOUND3 * s;
    if(det >= tol || det <= -tol) {
      return det
    }
    return orientation3Exact(a, b, c)
  },
  function orientation4(a,b,c,d) {
    var adx = a[0] - d[0];
    var bdx = b[0] - d[0];
    var cdx = c[0] - d[0];
    var ady = a[1] - d[1];
    var bdy = b[1] - d[1];
    var cdy = c[1] - d[1];
    var adz = a[2] - d[2];
    var bdz = b[2] - d[2];
    var cdz = c[2] - d[2];
    var bdxcdy = bdx * cdy;
    var cdxbdy = cdx * bdy;
    var cdxady = cdx * ady;
    var adxcdy = adx * cdy;
    var adxbdy = adx * bdy;
    var bdxady = bdx * ady;
    var det = adz * (bdxcdy - cdxbdy) 
            + bdz * (cdxady - adxcdy)
            + cdz * (adxbdy - bdxady);
    var permanent = (Math.abs(bdxcdy) + Math.abs(cdxbdy)) * Math.abs(adz)
                  + (Math.abs(cdxady) + Math.abs(adxcdy)) * Math.abs(bdz)
                  + (Math.abs(adxbdy) + Math.abs(bdxady)) * Math.abs(cdz);
    var tol = ERRBOUND4 * permanent;
    if ((det > tol) || (-det > tol)) {
      return det
    }
    return orientation4Exact(a,b,c,d)
  }
];

function slowOrient(args) {
  var proc = CACHED[args.length];
  if(!proc) {
    proc = CACHED[args.length] = orientation(args.length);
  }
  return proc.apply(undefined, args)
}

function generateOrientationProc() {
  while(CACHED.length <= NUM_EXPAND) {
    CACHED.push(orientation(CACHED.length));
  }
  var args = [];
  var procArgs = ["slow"];
  for(var i=0; i<=NUM_EXPAND; ++i) {
    args.push("a" + i);
    procArgs.push("o" + i);
  }
  var code = [
    "function getOrientation(", args.join(), "){switch(arguments.length){case 0:case 1:return 0;"
  ];
  for(var i=2; i<=NUM_EXPAND; ++i) {
    code.push("case ", i, ":return o", i, "(", args.slice(0, i).join(), ");");
  }
  code.push("}var s=new Array(arguments.length);for(var i=0;i<arguments.length;++i){s[i]=arguments[i]};return slow(s);}return getOrientation");
  procArgs.push(code.join(""));

  var proc = Function.apply(undefined, procArgs);
  module.exports = proc.apply(undefined, [slowOrient].concat(CACHED));
  for(var i=0; i<=NUM_EXPAND; ++i) {
    module.exports[i] = CACHED[i];
  }
}

generateOrientationProc();
});

/**
 * Bit twiddling hacks for JavaScript.
 *
 * Author: Mikola Lysenko
 *
 * Ported from Stanford bit twiddling hack library:
 *    http://graphics.stanford.edu/~seander/bithacks.html
 */

//Number of bits in an integer
var INT_BITS = 32;

//Constants
var INT_BITS_1  = INT_BITS;
var INT_MAX   =  0x7fffffff;
var INT_MIN   = -1<<(INT_BITS-1);

//Returns -1, 0, +1 depending on sign of x
var sign = function(v) {
  return (v > 0) - (v < 0);
};

//Computes absolute value of integer
var abs = function(v) {
  var mask = v >> (INT_BITS-1);
  return (v ^ mask) - mask;
};

//Computes minimum of integers x and y
var min = function(x, y) {
  return y ^ ((x ^ y) & -(x < y));
};

//Computes maximum of integers x and y
var max = function(x, y) {
  return x ^ ((x ^ y) & -(x < y));
};

//Checks if a number is a power of two
var isPow2 = function(v) {
  return !(v & (v-1)) && (!!v);
};

//Computes log base 2 of v
var log2 = function(v) {
  var r, shift;
  r =     (v > 0xFFFF) << 4; v >>>= r;
  shift = (v > 0xFF  ) << 3; v >>>= shift; r |= shift;
  shift = (v > 0xF   ) << 2; v >>>= shift; r |= shift;
  shift = (v > 0x3   ) << 1; v >>>= shift; r |= shift;
  return r | (v >> 1);
};

//Computes log base 10 of v
var log10 = function(v) {
  return  (v >= 1000000000) ? 9 : (v >= 100000000) ? 8 : (v >= 10000000) ? 7 :
          (v >= 1000000) ? 6 : (v >= 100000) ? 5 : (v >= 10000) ? 4 :
          (v >= 1000) ? 3 : (v >= 100) ? 2 : (v >= 10) ? 1 : 0;
};

//Counts number of bits
var popCount = function(v) {
  v = v - ((v >>> 1) & 0x55555555);
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return ((v + (v >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24;
};

//Counts number of trailing zeros
function countTrailingZeros(v) {
  var c = 32;
  v &= -v;
  if (v) c--;
  if (v & 0x0000FFFF) c -= 16;
  if (v & 0x00FF00FF) c -= 8;
  if (v & 0x0F0F0F0F) c -= 4;
  if (v & 0x33333333) c -= 2;
  if (v & 0x55555555) c -= 1;
  return c;
}
var countTrailingZeros_1 = countTrailingZeros;

//Rounds to next power of 2
var nextPow2 = function(v) {
  v += v === 0;
  --v;
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v + 1;
};

//Rounds down to previous power of 2
var prevPow2 = function(v) {
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v - (v>>>1);
};

//Computes parity of word
var parity = function(v) {
  v ^= v >>> 16;
  v ^= v >>> 8;
  v ^= v >>> 4;
  v &= 0xf;
  return (0x6996 >>> v) & 1;
};

var REVERSE_TABLE = new Array(256);

(function(tab) {
  for(var i=0; i<256; ++i) {
    var v = i, r = i, s = 7;
    for (v >>>= 1; v; v >>>= 1) {
      r <<= 1;
      r |= v & 1;
      --s;
    }
    tab[i] = (r << s) & 0xff;
  }
})(REVERSE_TABLE);

//Reverse bits in a 32 bit word
var reverse = function(v) {
  return  (REVERSE_TABLE[ v         & 0xff] << 24) |
          (REVERSE_TABLE[(v >>> 8)  & 0xff] << 16) |
          (REVERSE_TABLE[(v >>> 16) & 0xff] << 8)  |
           REVERSE_TABLE[(v >>> 24) & 0xff];
};

//Interleave bits of 2 coordinates with 16 bits.  Useful for fast quadtree codes
var interleave2 = function(x, y) {
  x &= 0xFFFF;
  x = (x | (x << 8)) & 0x00FF00FF;
  x = (x | (x << 4)) & 0x0F0F0F0F;
  x = (x | (x << 2)) & 0x33333333;
  x = (x | (x << 1)) & 0x55555555;

  y &= 0xFFFF;
  y = (y | (y << 8)) & 0x00FF00FF;
  y = (y | (y << 4)) & 0x0F0F0F0F;
  y = (y | (y << 2)) & 0x33333333;
  y = (y | (y << 1)) & 0x55555555;

  return x | (y << 1);
};

//Extracts the nth interleaved component
var deinterleave2 = function(v, n) {
  v = (v >>> n) & 0x55555555;
  v = (v | (v >>> 1))  & 0x33333333;
  v = (v | (v >>> 2))  & 0x0F0F0F0F;
  v = (v | (v >>> 4))  & 0x00FF00FF;
  v = (v | (v >>> 16)) & 0x000FFFF;
  return (v << 16) >> 16;
};


//Interleave bits of 3 coordinates, each with 10 bits.  Useful for fast octree codes
var interleave3 = function(x, y, z) {
  x &= 0x3FF;
  x  = (x | (x<<16)) & 4278190335;
  x  = (x | (x<<8))  & 251719695;
  x  = (x | (x<<4))  & 3272356035;
  x  = (x | (x<<2))  & 1227133513;

  y &= 0x3FF;
  y  = (y | (y<<16)) & 4278190335;
  y  = (y | (y<<8))  & 251719695;
  y  = (y | (y<<4))  & 3272356035;
  y  = (y | (y<<2))  & 1227133513;
  x |= (y << 1);
  
  z &= 0x3FF;
  z  = (z | (z<<16)) & 4278190335;
  z  = (z | (z<<8))  & 251719695;
  z  = (z | (z<<4))  & 3272356035;
  z  = (z | (z<<2))  & 1227133513;
  
  return x | (z << 2);
};

//Extracts nth interleaved component of a 3-tuple
var deinterleave3 = function(v, n) {
  v = (v >>> n)       & 1227133513;
  v = (v | (v>>>2))   & 3272356035;
  v = (v | (v>>>4))   & 251719695;
  v = (v | (v>>>8))   & 4278190335;
  v = (v | (v>>>16))  & 0x3FF;
  return (v<<22)>>22;
};

//Computes next combination in colexicographic order (this is mistakenly called nextPermutation on the bit twiddling hacks page)
var nextCombination = function(v) {
  var t = v | (v - 1);
  return (t + 1) | (((~t & -~t) - 1) >>> (countTrailingZeros(v) + 1));
};

var twiddle = {
	INT_BITS: INT_BITS_1,
	INT_MAX: INT_MAX,
	INT_MIN: INT_MIN,
	sign: sign,
	abs: abs,
	min: min,
	max: max,
	isPow2: isPow2,
	log2: log2,
	log10: log10,
	popCount: popCount,
	countTrailingZeros: countTrailingZeros_1,
	nextPow2: nextPow2,
	prevPow2: prevPow2,
	parity: parity,
	reverse: reverse,
	interleave2: interleave2,
	deinterleave2: deinterleave2,
	interleave3: interleave3,
	deinterleave3: deinterleave3,
	nextCombination: nextCombination
};

var unionFind = UnionFind;

function UnionFind(count) {
  this.roots = new Array(count);
  this.ranks = new Array(count);
  
  for(var i=0; i<count; ++i) {
    this.roots[i] = i;
    this.ranks[i] = 0;
  }
}

var proto = UnionFind.prototype;

Object.defineProperty(proto, "length", {
  "get": function() {
    return this.roots.length
  }
});

proto.makeSet = function() {
  var n = this.roots.length;
  this.roots.push(n);
  this.ranks.push(0);
  return n;
};

proto.find = function(x) {
  var x0 = x;
  var roots = this.roots;
  while(roots[x] !== x) {
    x = roots[x];
  }
  while(roots[x0] !== x) {
    var y = roots[x0];
    roots[x0] = x;
    x0 = y;
  }
  return x;
};

proto.link = function(x, y) {
  var xr = this.find(x)
    , yr = this.find(y);
  if(xr === yr) {
    return;
  }
  var ranks = this.ranks
    , roots = this.roots
    , xd    = ranks[xr]
    , yd    = ranks[yr];
  if(xd < yd) {
    roots[xr] = yr;
  } else if(yd < xd) {
    roots[yr] = xr;
  } else {
    roots[yr] = xr;
    ++ranks[xr];
  }
};

//Returns the dimension of a cell complex
function dimension(cells) {
  var d = 0
    , max = Math.max;
  for(var i=0, il=cells.length; i<il; ++i) {
    d = max(d, cells[i].length);
  }
  return d-1
}
var dimension_1 = dimension;

//Counts the number of vertices in faces
function countVertices(cells) {
  var vc = -1
    , max = Math.max;
  for(var i=0, il=cells.length; i<il; ++i) {
    var c = cells[i];
    for(var j=0, jl=c.length; j<jl; ++j) {
      vc = max(vc, c[j]);
    }
  }
  return vc+1
}
var countVertices_1 = countVertices;

//Returns a deep copy of cells
function cloneCells(cells) {
  var ncells = new Array(cells.length);
  for(var i=0, il=cells.length; i<il; ++i) {
    ncells[i] = cells[i].slice(0);
  }
  return ncells
}
var cloneCells_1 = cloneCells;

//Ranks a pair of cells up to permutation
function compareCells(a, b) {
  var n = a.length
    , t = a.length - b.length
    , min = Math.min;
  if(t) {
    return t
  }
  switch(n) {
    case 0:
      return 0;
    case 1:
      return a[0] - b[0];
    case 2:
      var d = a[0]+a[1]-b[0]-b[1];
      if(d) {
        return d
      }
      return min(a[0],a[1]) - min(b[0],b[1])
    case 3:
      var l1 = a[0]+a[1]
        , m1 = b[0]+b[1];
      d = l1+a[2] - (m1+b[2]);
      if(d) {
        return d
      }
      var l0 = min(a[0], a[1])
        , m0 = min(b[0], b[1])
        , d  = min(l0, a[2]) - min(m0, b[2]);
      if(d) {
        return d
      }
      return min(l0+a[2], l1) - min(m0+b[2], m1)
    
    //TODO: Maybe optimize n=4 as well?
    
    default:
      var as = a.slice(0);
      as.sort();
      var bs = b.slice(0);
      bs.sort();
      for(var i=0; i<n; ++i) {
        t = as[i] - bs[i];
        if(t) {
          return t
        }
      }
      return 0
  }
}
var compareCells_1 = compareCells;

function compareZipped(a, b) {
  return compareCells(a[0], b[0])
}

//Puts a cell complex into normal order for the purposes of findCell queries
function normalize(cells, attr) {
  if(attr) {
    var len = cells.length;
    var zipped = new Array(len);
    for(var i=0; i<len; ++i) {
      zipped[i] = [cells[i], attr[i]];
    }
    zipped.sort(compareZipped);
    for(var i=0; i<len; ++i) {
      cells[i] = zipped[i][0];
      attr[i] = zipped[i][1];
    }
    return cells
  } else {
    cells.sort(compareCells);
    return cells
  }
}
var normalize_1 = normalize;

//Removes all duplicate cells in the complex
function unique(cells) {
  if(cells.length === 0) {
    return []
  }
  var ptr = 1
    , len = cells.length;
  for(var i=1; i<len; ++i) {
    var a = cells[i];
    if(compareCells(a, cells[i-1])) {
      if(i === ptr) {
        ptr++;
        continue
      }
      cells[ptr++] = a;
    }
  }
  cells.length = ptr;
  return cells
}
var unique_1 = unique;

//Finds a cell in a normalized cell complex
function findCell(cells, c) {
  var lo = 0
    , hi = cells.length-1
    , r  = -1;
  while (lo <= hi) {
    var mid = (lo + hi) >> 1
      , s   = compareCells(cells[mid], c);
    if(s <= 0) {
      if(s === 0) {
        r = mid;
      }
      lo = mid + 1;
    } else if(s > 0) {
      hi = mid - 1;
    }
  }
  return r
}
var findCell_1 = findCell;

//Builds an index for an n-cell.  This is more general than dual, but less efficient
function incidence(from_cells, to_cells) {
  var index = new Array(from_cells.length);
  for(var i=0, il=index.length; i<il; ++i) {
    index[i] = [];
  }
  var b = [];
  for(var i=0, n=to_cells.length; i<n; ++i) {
    var c = to_cells[i];
    var cl = c.length;
    for(var k=1, kn=(1<<cl); k<kn; ++k) {
      b.length = twiddle.popCount(k);
      var l = 0;
      for(var j=0; j<cl; ++j) {
        if(k & (1<<j)) {
          b[l++] = c[j];
        }
      }
      var idx=findCell(from_cells, b);
      if(idx < 0) {
        continue
      }
      while(true) {
        index[idx++].push(i);
        if(idx >= from_cells.length || compareCells(from_cells[idx], b) !== 0) {
          break
        }
      }
    }
  }
  return index
}
var incidence_1 = incidence;

//Computes the dual of the mesh.  This is basically an optimized version of buildIndex for the situation where from_cells is just the list of vertices
function dual(cells, vertex_count) {
  if(!vertex_count) {
    return incidence(unique(skeleton(cells, 0)), cells, 0)
  }
  var res = new Array(vertex_count);
  for(var i=0; i<vertex_count; ++i) {
    res[i] = [];
  }
  for(var i=0, len=cells.length; i<len; ++i) {
    var c = cells[i];
    for(var j=0, cl=c.length; j<cl; ++j) {
      res[c[j]].push(i);
    }
  }
  return res
}
var dual_1 = dual;

//Enumerates all cells in the complex
function explode(cells) {
  var result = [];
  for(var i=0, il=cells.length; i<il; ++i) {
    var c = cells[i]
      , cl = c.length|0;
    for(var j=1, jl=(1<<cl); j<jl; ++j) {
      var b = [];
      for(var k=0; k<cl; ++k) {
        if((j >>> k) & 1) {
          b.push(c[k]);
        }
      }
      result.push(b);
    }
  }
  return normalize(result)
}
var explode_1 = explode;

//Enumerates all of the n-cells of a cell complex
function skeleton(cells, n) {
  if(n < 0) {
    return []
  }
  var result = []
    , k0     = (1<<(n+1))-1;
  for(var i=0; i<cells.length; ++i) {
    var c = cells[i];
    for(var k=k0; k<(1<<c.length); k=twiddle.nextCombination(k)) {
      var b = new Array(n+1)
        , l = 0;
      for(var j=0; j<c.length; ++j) {
        if(k & (1<<j)) {
          b[l++] = c[j];
        }
      }
      result.push(b);
    }
  }
  return normalize(result)
}
var skeleton_1 = skeleton;

//Computes the boundary of all cells, does not remove duplicates
function boundary(cells) {
  var res = [];
  for(var i=0,il=cells.length; i<il; ++i) {
    var c = cells[i];
    for(var j=0,cl=c.length; j<cl; ++j) {
      var b = new Array(c.length-1);
      for(var k=0, l=0; k<cl; ++k) {
        if(k !== j) {
          b[l++] = c[k];
        }
      }
      res.push(b);
    }
  }
  return normalize(res)
}
var boundary_1 = boundary;

//Computes connected components for a dense cell complex
function connectedComponents_dense(cells, vertex_count) {
  var labels = new unionFind(vertex_count);
  for(var i=0; i<cells.length; ++i) {
    var c = cells[i];
    for(var j=0; j<c.length; ++j) {
      for(var k=j+1; k<c.length; ++k) {
        labels.link(c[j], c[k]);
      }
    }
  }
  var components = []
    , component_labels = labels.ranks;
  for(var i=0; i<component_labels.length; ++i) {
    component_labels[i] = -1;
  }
  for(var i=0; i<cells.length; ++i) {
    var l = labels.find(cells[i][0]);
    if(component_labels[l] < 0) {
      component_labels[l] = components.length;
      components.push([cells[i].slice(0)]);
    } else {
      components[component_labels[l]].push(cells[i].slice(0));
    }
  }
  return components
}

//Computes connected components for a sparse graph
function connectedComponents_sparse(cells) {
  var vertices  = unique(normalize(skeleton(cells, 0)))
    , labels    = new unionFind(vertices.length);
  for(var i=0; i<cells.length; ++i) {
    var c = cells[i];
    for(var j=0; j<c.length; ++j) {
      var vj = findCell(vertices, [c[j]]);
      for(var k=j+1; k<c.length; ++k) {
        labels.link(vj, findCell(vertices, [c[k]]));
      }
    }
  }
  var components        = []
    , component_labels  = labels.ranks;
  for(var i=0; i<component_labels.length; ++i) {
    component_labels[i] = -1;
  }
  for(var i=0; i<cells.length; ++i) {
    var l = labels.find(findCell(vertices, [cells[i][0]]));
    if(component_labels[l] < 0) {
      component_labels[l] = components.length;
      components.push([cells[i].slice(0)]);
    } else {
      components[component_labels[l]].push(cells[i].slice(0));
    }
  }
  return components
}

//Computes connected components for a cell complex
function connectedComponents(cells, vertex_count) {
  if(vertex_count) {
    return connectedComponents_dense(cells, vertex_count)
  }
  return connectedComponents_sparse(cells)
}
var connectedComponents_1 = connectedComponents;

var topology = {
	dimension: dimension_1,
	countVertices: countVertices_1,
	cloneCells: cloneCells_1,
	compareCells: compareCells_1,
	normalize: normalize_1,
	unique: unique_1,
	findCell: findCell_1,
	incidence: incidence_1,
	dual: dual_1,
	explode: explode_1,
	skeleton: skeleton_1,
	boundary: boundary_1,
	connectedComponents: connectedComponents_1
};

//High level idea:
// 1. Use Clarkson's incremental construction to find convex hull
// 2. Point location in triangulation by jump and walk

var ich = incrementalConvexHull;


var compareCell = topology.compareCells;

function Simplex(vertices, adjacent, boundary) {
  this.vertices = vertices;
  this.adjacent = adjacent;
  this.boundary = boundary;
  this.lastVisited = -1;
}

Simplex.prototype.flip = function() {
  var t = this.vertices[0];
  this.vertices[0] = this.vertices[1];
  this.vertices[1] = t;
  var u = this.adjacent[0];
  this.adjacent[0] = this.adjacent[1];
  this.adjacent[1] = u;
};

function GlueFacet(vertices, cell, index) {
  this.vertices = vertices;
  this.cell = cell;
  this.index = index;
}

function compareGlue(a, b) {
  return compareCell(a.vertices, b.vertices)
}

function bakeOrient(d) {
  var code = ["function orient(){var tuple=this.tuple;return test("];
  for(var i=0; i<=d; ++i) {
    if(i > 0) {
      code.push(",");
    }
    code.push("tuple[", i, "]");
  }
  code.push(")}return orient");
  var proc = new Function("test", code.join(""));
  var test = orientation_1[d+1];
  if(!test) {
    test = orientation_1;
  }
  return proc(test)
}

var BAKED = [];

function Triangulation(dimension, vertices, simplices) {
  this.dimension = dimension;
  this.vertices = vertices;
  this.simplices = simplices;
  this.interior = simplices.filter(function(c) {
    return !c.boundary
  });

  this.tuple = new Array(dimension+1);
  for(var i=0; i<=dimension; ++i) {
    this.tuple[i] = this.vertices[i];
  }

  var o = BAKED[dimension];
  if(!o) {
    o = BAKED[dimension] = bakeOrient(dimension);
  }
  this.orient = o;
}

var proto$1 = Triangulation.prototype;

//Degenerate situation where we are on boundary, but coplanar to face
proto$1.handleBoundaryDegeneracy = function(cell, point) {
  var d = this.dimension;
  var n = this.vertices.length - 1;
  var tuple = this.tuple;
  var verts = this.vertices;

  //Dumb solution: Just do dfs from boundary cell until we find any peak, or terminate
  var toVisit = [ cell ];
  cell.lastVisited = -n;
  while(toVisit.length > 0) {
    cell = toVisit.pop();
    var cellVerts = cell.vertices;
    var cellAdj = cell.adjacent;
    for(var i=0; i<=d; ++i) {
      var neighbor = cellAdj[i];
      if(!neighbor.boundary || neighbor.lastVisited <= -n) {
        continue
      }
      var nv = neighbor.vertices;
      for(var j=0; j<=d; ++j) {
        var vv = nv[j];
        if(vv < 0) {
          tuple[j] = point;
        } else {
          tuple[j] = verts[vv];
        }
      }
      var o = this.orient();
      if(o > 0) {
        return neighbor
      }
      neighbor.lastVisited = -n;
      if(o === 0) {
        toVisit.push(neighbor);
      }
    }
  }
  return null
};

proto$1.walk = function(point, random) {
  //Alias local properties
  var n = this.vertices.length - 1;
  var d = this.dimension;
  var verts = this.vertices;
  var tuple = this.tuple;

  //Compute initial jump cell
  var initIndex = random ? (this.interior.length * Math.random())|0 : (this.interior.length-1);
  var cell = this.interior[ initIndex ];

  //Start walking
outerLoop:
  while(!cell.boundary) {
    var cellVerts = cell.vertices;
    var cellAdj = cell.adjacent;

    for(var i=0; i<=d; ++i) {
      tuple[i] = verts[cellVerts[i]];
    }
    cell.lastVisited = n;

    //Find farthest adjacent cell
    for(var i=0; i<=d; ++i) {
      var neighbor = cellAdj[i];
      if(neighbor.lastVisited >= n) {
        continue
      }
      var prev = tuple[i];
      tuple[i] = point;
      var o = this.orient();
      tuple[i] = prev;
      if(o < 0) {
        cell = neighbor;
        continue outerLoop
      } else {
        if(!neighbor.boundary) {
          neighbor.lastVisited = n;
        } else {
          neighbor.lastVisited = -n;
        }
      }
    }
    return
  }

  return cell
};

proto$1.addPeaks = function(point, cell) {
  var n = this.vertices.length - 1;
  var d = this.dimension;
  var verts = this.vertices;
  var tuple = this.tuple;
  var interior = this.interior;
  var simplices = this.simplices;

  //Walking finished at boundary, time to add peaks
  var tovisit = [ cell ];

  //Stretch initial boundary cell into a peak
  cell.lastVisited = n;
  cell.vertices[cell.vertices.indexOf(-1)] = n;
  cell.boundary = false;
  interior.push(cell);

  //Record a list of all new boundaries created by added peaks so we can glue them together when we are all done
  var glueFacets = [];

  //Do a traversal of the boundary walking outward from starting peak
  while(tovisit.length > 0) {
    //Pop off peak and walk over adjacent cells
    var cell = tovisit.pop();
    var cellVerts = cell.vertices;
    var cellAdj = cell.adjacent;
    var indexOfN = cellVerts.indexOf(n);
    if(indexOfN < 0) {
      continue
    }

    for(var i=0; i<=d; ++i) {
      if(i === indexOfN) {
        continue
      }

      //For each boundary neighbor of the cell
      var neighbor = cellAdj[i];
      if(!neighbor.boundary || neighbor.lastVisited >= n) {
        continue
      }

      var nv = neighbor.vertices;

      //Test if neighbor is a peak
      if(neighbor.lastVisited !== -n) {      
        //Compute orientation of p relative to each boundary peak
        var indexOfNeg1 = 0;
        for(var j=0; j<=d; ++j) {
          if(nv[j] < 0) {
            indexOfNeg1 = j;
            tuple[j] = point;
          } else {
            tuple[j] = verts[nv[j]];
          }
        }
        var o = this.orient();

        //Test if neighbor cell is also a peak
        if(o > 0) {
          nv[indexOfNeg1] = n;
          neighbor.boundary = false;
          interior.push(neighbor);
          tovisit.push(neighbor);
          neighbor.lastVisited = n;
          continue
        } else {
          neighbor.lastVisited = -n;
        }
      }

      var na = neighbor.adjacent;

      //Otherwise, replace neighbor with new face
      var vverts = cellVerts.slice();
      var vadj = cellAdj.slice();
      var ncell = new Simplex(vverts, vadj, true);
      simplices.push(ncell);

      //Connect to neighbor
      var opposite = na.indexOf(cell);
      if(opposite < 0) {
        continue
      }
      na[opposite] = ncell;
      vadj[indexOfN] = neighbor;

      //Connect to cell
      vverts[i] = -1;
      vadj[i] = cell;
      cellAdj[i] = ncell;

      //Flip facet
      ncell.flip();

      //Add to glue list
      for(var j=0; j<=d; ++j) {
        var uu = vverts[j];
        if(uu < 0 || uu === n) {
          continue
        }
        var nface = new Array(d-1);
        var nptr = 0;
        for(var k=0; k<=d; ++k) {
          var vv = vverts[k];
          if(vv < 0 || k === j) {
            continue
          }
          nface[nptr++] = vv;
        }
        glueFacets.push(new GlueFacet(nface, ncell, j));
      }
    }
  }

  //Glue boundary facets together
  glueFacets.sort(compareGlue);

  for(var i=0; i+1<glueFacets.length; i+=2) {
    var a = glueFacets[i];
    var b = glueFacets[i+1];
    var ai = a.index;
    var bi = b.index;
    if(ai < 0 || bi < 0) {
      continue
    }
    a.cell.adjacent[a.index] = b.cell;
    b.cell.adjacent[b.index] = a.cell;
  }
};

proto$1.insert = function(point, random) {
  //Add point
  var verts = this.vertices;
  verts.push(point);

  var cell = this.walk(point, random);
  if(!cell) {
    return
  }

  //Alias local properties
  var d = this.dimension;
  var tuple = this.tuple;

  //Degenerate case: If point is coplanar to cell, then walk until we find a non-degenerate boundary
  for(var i=0; i<=d; ++i) {
    var vv = cell.vertices[i];
    if(vv < 0) {
      tuple[i] = point;
    } else {
      tuple[i] = verts[vv];
    }
  }
  var o = this.orient(tuple);
  if(o < 0) {
    return
  } else if(o === 0) {
    cell = this.handleBoundaryDegeneracy(cell, point);
    if(!cell) {
      return
    }
  }

  //Add peaks
  this.addPeaks(point, cell);
};

//Extract all boundary cells
proto$1.boundary = function() {
  var d = this.dimension;
  var boundary = [];
  var cells = this.simplices;
  var nc = cells.length;
  for(var i=0; i<nc; ++i) {
    var c = cells[i];
    if(c.boundary) {
      var bcell = new Array(d);
      var cv = c.vertices;
      var ptr = 0;
      var parity = 0;
      for(var j=0; j<=d; ++j) {
        if(cv[j] >= 0) {
          bcell[ptr++] = cv[j];
        } else {
          parity = j&1;
        }
      }
      if(parity === (d&1)) {
        var t = bcell[0];
        bcell[0] = bcell[1];
        bcell[1] = t;
      }
      boundary.push(bcell);
    }
  }
  return boundary
};

function incrementalConvexHull(points, randomSearch) {
  var n = points.length;
  if(n === 0) {
    throw new Error("Must have at least d+1 points")
  }
  var d = points[0].length;
  if(n <= d) {
    throw new Error("Must input at least d+1 points")
  }

  //FIXME: This could be degenerate, but need to select d+1 non-coplanar points to bootstrap process
  var initialSimplex = points.slice(0, d+1);

  //Make sure initial simplex is positively oriented
  var o = orientation_1.apply(void 0, initialSimplex);
  if(o === 0) {
    throw new Error("Input not in general position")
  }
  var initialCoords = new Array(d+1);
  for(var i=0; i<=d; ++i) {
    initialCoords[i] = i;
  }
  if(o < 0) {
    initialCoords[0] = 1;
    initialCoords[1] = 0;
  }

  //Create initial topological index, glue pointers together (kind of messy)
  var initialCell = new Simplex(initialCoords, new Array(d+1), false);
  var boundary = initialCell.adjacent;
  var list = new Array(d+2);
  for(var i=0; i<=d; ++i) {
    var verts = initialCoords.slice();
    for(var j=0; j<=d; ++j) {
      if(j === i) {
        verts[j] = -1;
      }
    }
    var t = verts[0];
    verts[0] = verts[1];
    verts[1] = t;
    var cell = new Simplex(verts, new Array(d+1), true);
    boundary[i] = cell;
    list[i] = cell;
  }
  list[d+1] = initialCell;
  for(var i=0; i<=d; ++i) {
    var verts = boundary[i].vertices;
    var adj = boundary[i].adjacent;
    for(var j=0; j<=d; ++j) {
      var v = verts[j];
      if(v < 0) {
        adj[j] = initialCell;
        continue
      }
      for(var k=0; k<=d; ++k) {
        if(boundary[k].vertices.indexOf(v) < 0) {
          adj[j] = boundary[k];
        }
      }
    }
  }

  //Initialize triangles
  var triangles = new Triangulation(d, initialSimplex, list);

  //Insert remaining points
  var useRandom = !!randomSearch;
  for(var i=d+1; i<n; ++i) {
    triangles.insert(points[i], useRandom);
  }
  
  //Extract boundary cells
  return triangles.boundary()
}

function unique_pred(list, compare) {
  var ptr = 1
    , len = list.length
    , a=list[0], b=list[0];
  for(var i=1; i<len; ++i) {
    b = a;
    a = list[i];
    if(compare(a, b)) {
      if(i === ptr) {
        ptr++;
        continue
      }
      list[ptr++] = a;
    }
  }
  list.length = ptr;
  return list
}

function unique_eq(list) {
  var ptr = 1
    , len = list.length
    , a=list[0], b = list[0];
  for(var i=1; i<len; ++i, b=a) {
    b = a;
    a = list[i];
    if(a !== b) {
      if(i === ptr) {
        ptr++;
        continue
      }
      list[ptr++] = a;
    }
  }
  list.length = ptr;
  return list
}

function unique$1(list, compare, sorted) {
  if(list.length === 0) {
    return list
  }
  if(compare) {
    if(!sorted) {
      list.sort(compare);
    }
    return unique_pred(list, compare)
  }
  if(!sorted) {
    list.sort();
  }
  return unique_eq(list)
}

var uniq = unique$1;

var triangulate_1 = triangulate;

function LiftedPoint(p, i) {
  this.point = p;
  this.index = i;
}

function compareLifted(a, b) {
  var ap = a.point;
  var bp = b.point;
  var d = ap.length;
  for(var i=0; i<d; ++i) {
    var s = bp[i] - ap[i];
    if(s) {
      return s
    }
  }
  return 0
}

function triangulate1D(n, points, includePointAtInfinity) {
  if(n === 1) {
    if(includePointAtInfinity) {
      return [ [-1, 0] ]
    } else {
      return []
    }
  }
  var lifted = points.map(function(p, i) {
    return [ p[0], i ]
  });
  lifted.sort(function(a,b) {
    return a[0] - b[0]
  });
  var cells = new Array(n - 1);
  for(var i=1; i<n; ++i) {
    var a = lifted[i-1];
    var b = lifted[i];
    cells[i-1] = [ a[1], b[1] ];
  }
  if(includePointAtInfinity) {
    cells.push(
      [ -1, cells[0][1], ],
      [ cells[n-1][1], -1 ]);
  }
  return cells
}

function triangulate(points, includePointAtInfinity) {
  var n = points.length;
  if(n === 0) {
    return []
  }
  
  var d = points[0].length;
  if(d < 1) {
    return []
  }

  //Special case:  For 1D we can just sort the points
  if(d === 1) {
    return triangulate1D(n, points, includePointAtInfinity)
  }
  
  //Lift points, sort
  var lifted = new Array(n);
  var upper = 1.0;
  for(var i=0; i<n; ++i) {
    var p = points[i];
    var x = new Array(d+1);
    var l = 0.0;
    for(var j=0; j<d; ++j) {
      var v = p[j];
      x[j] = v;
      l += v * v;
    }
    x[d] = l;
    lifted[i] = new LiftedPoint(x, i);
    upper = Math.max(l, upper);
  }
  uniq(lifted, compareLifted);
  
  //Double points
  n = lifted.length;

  //Create new list of points
  var dpoints = new Array(n + d + 1);
  var dindex = new Array(n + d + 1);

  //Add steiner points at top
  var u = (d+1) * (d+1) * upper;
  var y = new Array(d+1);
  for(var i=0; i<=d; ++i) {
    y[i] = 0.0;
  }
  y[d] = u;

  dpoints[0] = y.slice();
  dindex[0] = -1;

  for(var i=0; i<=d; ++i) {
    var x = y.slice();
    x[i] = 1;
    dpoints[i+1] = x;
    dindex[i+1] = -1;
  }

  //Copy rest of the points over
  for(var i=0; i<n; ++i) {
    var h = lifted[i];
    dpoints[i + d + 1] = h.point;
    dindex[i + d + 1] =  h.index;
  }

  //Construct convex hull
  var hull = ich(dpoints, false);
  if(includePointAtInfinity) {
    hull = hull.filter(function(cell) {
      var count = 0;
      for(var j=0; j<=d; ++j) {
        var v = dindex[cell[j]];
        if(v < 0) {
          if(++count >= 2) {
            return false
          }
        }
        cell[j] = v;
      }
      return true
    });
  } else {
    hull = hull.filter(function(cell) {
      for(var i=0; i<=d; ++i) {
        var v = dindex[cell[i]];
        if(v < 0) {
          return false
        }
        cell[i] = v;
      }
      return true
    });
  }

  if(d & 1) {
    for(var i=0; i<hull.length; ++i) {
      var h = hull[i];
      var x = h[0];
      h[0] = h[1];
      h[1] = x;
    }
  }

  return hull
}

function dupe_array(count, value, i) {
  var c = count[i]|0;
  if(c <= 0) {
    return []
  }
  var result = new Array(c), j;
  if(i === count.length-1) {
    for(j=0; j<c; ++j) {
      result[j] = value;
    }
  } else {
    for(j=0; j<c; ++j) {
      result[j] = dupe_array(count, value, i+1);
    }
  }
  return result
}

function dupe_number(count, value) {
  var result, i;
  result = new Array(count);
  for(i=0; i<count; ++i) {
    result[i] = value;
  }
  return result
}

function dupe(count, value) {
  if(typeof value === "undefined") {
    value = 0;
  }
  switch(typeof count) {
    case "number":
      if(count > 0) {
        return dupe_number(count|0, value)
      }
    break
    case "object":
      if(typeof (count.length) === "number") {
        return dupe_array(count, value, 0)
      }
    break
  }
  return []
}

var dup = dupe;

var compress = compressExpansion;

function compressExpansion(e) {
  var m = e.length;
  var Q = e[e.length-1];
  var bottom = m;
  for(var i=m-2; i>=0; --i) {
    var a = Q;
    var b = e[i];
    Q = a + b;
    var bv = Q - a;
    var q = b - bv;
    if(q) {
      e[--bottom] = Q;
      Q = q;
    }
  }
  var top = 0;
  for(var i=bottom; i<m; ++i) {
    var a = e[i];
    var b = Q;
    Q = a + b;
    var bv = Q - a;
    var q = b - bv;
    if(q) {
      e[top++] = q;
    }
  }
  e[top++] = Q;
  e.length = top;
  return e
}

var robustDeterminant = createCommonjsModule(function (module) {






var NUM_EXPANDED = 6;

function cofactor(m, c) {
  var result = new Array(m.length-1);
  for(var i=1; i<m.length; ++i) {
    var r = result[i-1] = new Array(m.length-1);
    for(var j=0,k=0; j<m.length; ++j) {
      if(j === c) {
        continue
      }
      r[k++] = m[i][j];
    }
  }
  return result
}

function matrix(n) {
  var result = new Array(n);
  for(var i=0; i<n; ++i) {
    result[i] = new Array(n);
    for(var j=0; j<n; ++j) {
      result[i][j] = ["m[", i, "][", j, "]"].join("");
    }
  }
  return result
}

function sign(n) {
  if(n & 1) {
    return "-"
  }
  return ""
}

function generateSum(expr) {
  if(expr.length === 1) {
    return expr[0]
  } else if(expr.length === 2) {
    return ["sum(", expr[0], ",", expr[1], ")"].join("")
  } else {
    var m = expr.length>>1;
    return ["sum(", generateSum(expr.slice(0, m)), ",", generateSum(expr.slice(m)), ")"].join("")
  }
}

function determinant(m) {
  if(m.length === 2) {
    return ["sum(prod(", m[0][0], ",", m[1][1], "),prod(-", m[0][1], ",", m[1][0], "))"].join("")
  } else {
    var expr = [];
    for(var i=0; i<m.length; ++i) {
      expr.push(["scale(", determinant(cofactor(m, i)), ",", sign(i), m[0][i], ")"].join(""));
    }
    return generateSum(expr)
  }
}

function compileDeterminant(n) {
  var proc = new Function("sum", "scale", "prod", "compress", [
    "function robustDeterminant",n, "(m){return compress(", 
      determinant(matrix(n)),
    ")};return robustDeterminant", n].join(""));
  return proc(robustSum, robustScale, twoProduct_1, compress)
}

var CACHE = [
  function robustDeterminant0() { return [0] },
  function robustDeterminant1(m) { return [m[0][0]] }
];

function generateDispatch() {
  while(CACHE.length < NUM_EXPANDED) {
    CACHE.push(compileDeterminant(CACHE.length));
  }
  var procArgs = [];
  var code = ["function robustDeterminant(m){switch(m.length){"];
  for(var i=0; i<NUM_EXPANDED; ++i) {
    procArgs.push("det" + i);
    code.push("case ", i, ":return det", i, "(m);");
  }
  code.push("}\
var det=CACHE[m.length];\
if(!det)\
det=CACHE[m.length]=gen(m.length);\
return det(m);\
}\
return robustDeterminant");
  procArgs.push("CACHE", "gen", code.join(""));
  var proc = Function.apply(undefined, procArgs);
  module.exports = proc.apply(undefined, CACHE.concat([CACHE, compileDeterminant]));
  for(var i=0; i<CACHE.length; ++i) {
    module.exports[i] = CACHE[i];
  }
}

generateDispatch();
});

var linsolve = createCommonjsModule(function (module) {



var NUM_EXPAND = 6;

function generateSolver(n) {
  var funcName = "robustLinearSolve" + n + "d";
  var code = ["function ", funcName, "(A,b){return ["];
  for(var i=0; i<n; ++i) {
    code.push("det([");
    for(var j=0; j<n; ++j) {
      if(j > 0) {
        code.push(",");
      }
      code.push("[");
      for(var k=0; k<n; ++k) {
        if(k > 0) {
          code.push(",");
        }
        if(k === i) {
          code.push("+b[", j, "]");
        } else {
          code.push("+A[", j, "][", k, "]");
        }
      }
      code.push("]");
    }
    code.push("]),");
  }
  code.push("det(A)]}return ", funcName);
  var proc = new Function("det", code.join(""));
  if(n < 6) {
    return proc(robustDeterminant[n])
  }
  return proc(robustDeterminant)
}

function robustLinearSolve0d() {
  return [ 0 ]
}

function robustLinearSolve1d(A, b) {
  return [ [ b[0] ], [ A[0][0] ] ]
}

var CACHE = [
  robustLinearSolve0d,
  robustLinearSolve1d
];

function generateDispatch() {
  while(CACHE.length < NUM_EXPAND) {
    CACHE.push(generateSolver(CACHE.length));
  }
  var procArgs = [];
  var code = ["function dispatchLinearSolve(A,b){switch(A.length){"];
  for(var i=0; i<NUM_EXPAND; ++i) {
    procArgs.push("s" + i);
    code.push("case ", i, ":return s", i, "(A,b);");
  }
  code.push("}var s=CACHE[A.length];if(!s)s=CACHE[A.length]=g(A.length);return s(A,b)}return dispatchLinearSolve");
  procArgs.push("CACHE", "g", code.join(""));
  var proc = Function.apply(undefined, procArgs);
  module.exports = proc.apply(undefined, CACHE.concat([CACHE, generateSolver]));
  for(var i=0; i<NUM_EXPAND; ++i) {
    module.exports[i] = CACHE[i];
  }
}

generateDispatch();
});

function dot(a, b) {
  var s = 0.0;
  var d = a.length;
  for(var i=0; i<d; ++i) {
    s += a[i] * b[i];
  }
  return s
}

function barycentricCircumcenter(points) {
  var N = points.length;
  if(N === 0) {
    return []
  }
  
  var D = points[0].length;
  var A = dup([points.length+1, points.length+1], 1.0);
  var b = dup([points.length+1], 1.0);
  A[N][N] = 0.0;
  for(var i=0; i<N; ++i) {
    for(var j=0; j<=i; ++j) {
      A[j][i] = A[i][j] = 2.0 * dot(points[i], points[j]);
    }
    b[i] = dot(points[i], points[i]);
  }
  var x = linsolve(A, b);

  var denom = 0.0;
  var h = x[N+1];
  for(var i=0; i<h.length; ++i) {
    denom += h[i];
  }

  var y = new Array(N);
  for(var i=0; i<N; ++i) {
    var h = x[i];
    var numer = 0.0;
    for(var j=0; j<h.length; ++j) {
      numer += h[j];
    }
    y[i] =  numer / denom;
  }

  return y
}

function circumcenter(points) {
  if(points.length === 0) {
    return []
  }
  var D = points[0].length;
  var result = dup([D]);
  var weights = barycentricCircumcenter(points);
  for(var i=0; i<points.length; ++i) {
    for(var j=0; j<D; ++j) {
      result[j] += points[i][j] * weights[i];
    }
  }
  return result
}

circumcenter.barycenetric = barycentricCircumcenter;
var circumcenter_1 = circumcenter;

var crad = circumradius;



function circumradius(points) {
  var center = circumcenter_1(points);
  var avgDist = 0.0;
  for(var i=0; i<points.length; ++i) {
    var p = points[i];
    for(var j=0; j<center.length; ++j) {
      avgDist += Math.pow(p[j] - center[j], 2);
    }
  }
  return Math.sqrt(avgDist / points.length)
}

var alpha = alphaComplex;




function alphaComplex(alpha, points) {
  return triangulate_1(points).filter(function(cell) {
    var simplex = new Array(cell.length);
    for(var i=0; i<cell.length; ++i) {
      simplex[i] = points[cell[i]];
    }
    return crad(simplex) * alpha < 1
  })
}

var boundary_1$1 = boundary$1;

function boundary$1 (cells) {
  var i, j, k;
  var n = cells.length;
  var sz = 0;
  for (i = 0; i < n; ++i) {
    sz += cells[i].length;
  }
  var result = new Array(sz);
  var ptr = 0;
  for (i = 0; i < n; ++i) {
    var c = cells[i];
    var d = c.length;
    for (j = 0; j < d; ++j) {
      var b = result[ptr++] = new Array(d - 1);
      var p = 0;
      for (k = 0; k < d; ++k) {
        if (k === j) {
          continue
        }
        b[p++] = c[k];
      }
      if (j & 1) {
        var tmp = b[1];
        b[1] = b[0];
        b[0] = tmp;
      }
    }
  }
  return result
}

var compare = compareCells$1;

var min$1 = Math.min;

function compareInt$1(a, b) {
  return a - b
}

function compareCells$1(a, b) {
  var n = a.length
    , t = a.length - b.length;
  if(t) {
    return t
  }
  switch(n) {
    case 0:
      return 0
    case 1:
      return a[0] - b[0]
    case 2:
      return (a[0]+a[1]-b[0]-b[1]) ||
             min$1(a[0],a[1]) - min$1(b[0],b[1])
    case 3:
      var l1 = a[0]+a[1]
        , m1 = b[0]+b[1];
      t = l1+a[2] - (m1+b[2]);
      if(t) {
        return t
      }
      var l0 = min$1(a[0], a[1])
        , m0 = min$1(b[0], b[1]);
      return min$1(l0, a[2]) - min$1(m0, b[2]) ||
             min$1(l0+a[2], l1) - min$1(m0+b[2], m1)
    case 4:
      var aw=a[0], ax=a[1], ay=a[2], az=a[3]
        , bw=b[0], bx=b[1], by=b[2], bz=b[3];
      return (aw+ax+ay+az)-(bw+bx+by+bz) ||
             min$1(aw,ax,ay,az)-min$1(bw,bx,by,bz,bw) ||
             min$1(aw+ax,aw+ay,aw+az,ax+ay,ax+az,ay+az) -
               min$1(bw+bx,bw+by,bw+bz,bx+by,bx+bz,by+bz) ||
             min$1(aw+ax+ay,aw+ax+az,aw+ay+az,ax+ay+az) -
               min$1(bw+bx+by,bw+bx+bz,bw+by+bz,bx+by+bz)
    default:
      var as = a.slice().sort(compareInt$1);
      var bs = b.slice().sort(compareInt$1);
      for(var i=0; i<n; ++i) {
        t = as[i] - bs[i];
        if(t) {
          return t
        }
      }
      return 0
  }
}

var orientation_1$1 = orientation;

function orientation(s) {
  var p = 1;
  for(var i=1; i<s.length; ++i) {
    for(var j=0; j<i; ++j) {
      if(s[i] < s[j]) {
        p = -p;
      } else if(s[j] === s[i]) {
        return 0
      }
    }
  }
  return p
}

var compare$1 = compareOrientedCells;

function compareOrientedCells(a, b) {
  return compare(a, b) || orientation_1$1(a) - orientation_1$1(b)
}

var reduce = reduceCellComplex;

function reduceCellComplex(cells) {
  cells.sort(compare$1);
  var n = cells.length;
  var ptr = 0;
  for(var i=0; i<n; ++i) {
    var c = cells[i];
    var o = orientation_1$1(c);
    if(o === 0) {
      continue
    }
    if(ptr > 0) {
      var f = cells[ptr-1];
      if(compare(c, f) === 0 &&
         orientation_1$1(f)    !== o) {
        ptr -= 1;
        continue
      }
    }
    cells[ptr++] = c;
  }
  cells.length = ptr;
  return cells
}

var boundary_1$2 = boundary$2;




function boundary$2(cells) {
  return reduce(boundary_1$1(cells))
}

var alpha$1 = alphaShape;




function alphaShape(alpha$$1, points) {
  return boundary_1$2(alpha(alpha$$1, points))
}

onmessage = onMessage;

function onMessage ( event ) {

	const points = event.data.points;
	const alpha = event.data.alpha;
	const segment = event.data.segment;

	console.log( 'alphaWorker: points: ' + points.length + ' alpha: ' + alpha );

	const cells = alpha$1( alpha, points );

	postMessage( { status: 'ok', segment: segment, cells: cells } );

}

})));
