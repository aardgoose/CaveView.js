import { MeshPhongNodeMaterial, expression, abs, cond, mix, smoothstep, varying, vec4, positionGeometry } from '../../../node_modules/three/examples/jsm/nodes/Nodes.js';
import { CommonUniforms } from './CommonUniforms';

class CursorMaterial extends MeshPhongNodeMaterial {

	constructor ( ctx, options ) { // FIXME options handling

		super( { vertexColors: true } );

		const survey = ctx.survey;
		const limits = survey.modelLimits;

		const cu = CommonUniforms.cursor( ctx );

		const delta = abs( varying( positionGeometry.z.sub( cu.cursor ) ) );
		const ss = smoothstep( 0.0, cu.cursorWidth, cu.cursorWidth.sub( delta ) );

		this.cursor = cu.cursor;

		this.colorNode = cond( delta.lessThan( cu.cursorWidth.mul( 0.05 ) ),
			vec4( expression( 'vColor', 'vec3' ), 1.0 ),
			vec4( mix( cu.baseColor, cu.cursorColor, ss ), 1.0 ).mul( expression( 'vColor', 'vec3' ), 1.0 )
		);

		this.transparent = options.location;
		this.halfRange = ( limits.max.z - limits.min.z ) / 2;

	}

	setCursor ( value ) {

		const newValue = Math.max( Math.min( value, this.halfRange ), -this.halfRange );

		this.cursor.value = newValue;

		return newValue; // return value clamped to material range

	}

	getCursor () {

		return this.cursor.value;

	}

}

export { CursorMaterial };