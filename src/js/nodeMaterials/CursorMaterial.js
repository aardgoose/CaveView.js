import { MeshPhongNodeMaterial, expression, abs, cond, mix, smoothstep, uniform, varying, vec4, positionGeometry } from '../../../node_modules/three/examples/jsm/nodes/Nodes';

class CursorMaterial extends MeshPhongNodeMaterial {

	constructor ( ctx, options ) {

		super( { vertexColors: true } );

		const survey = ctx.survey;
		const limits = survey.modelLimits;
		const cfg = ctx.cfg;

		const cursor      = uniform( 0, 'float' );
		const cursorWidth = uniform( 5.0, 'float' );
		const baseColor   = uniform( cfg.themeColor( 'shading.cursorBase' ) );
		const cursorColor = uniform( cfg.themeColor( 'shading.cursor' ) );

		const delta = abs( varying( positionGeometry.z.sub( cursor ) ) );
		const ss = smoothstep( 0.0, cursorWidth, cursorWidth.sub( delta ) );

		this.cursor = cursor;

		this.colorNode = cond( delta.lessThan( cursorWidth.mul( 0.05 ) ),
			vec4( expression( 'vColor', 'vec3' ), 1.0 ),
			vec4( mix( baseColor, cursorColor, ss ), 1.0 ).mul( expression( 'vColor', 'vec3' ), 1.0 )
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