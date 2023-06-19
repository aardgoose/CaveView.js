import { CommonTerrainMaterial } from './CommonTerrainMaterial';
import { fract, fwidth, step, cond, mix, smoothstep, uniform, vec4, positionLocal, materialOpacity } from '../Nodes';

class ContourMaterial extends CommonTerrainMaterial {

	constructor ( params = {}, ctx ) {

		const survey = ctx.survey;
		const cfg = ctx.cfg;

		super( { opacity: 0.5 }, ctx );

		const commonUniforms = ctx.materials.commonUniforms;

		// FIXME survey specific
		const zOffset         = uniform( survey.offsets.z, 'float' );
		const contourInterval = uniform( cfg.themeValue( 'shading.contours.interval' ), 'float' );
		const contourColor    = uniform( cfg.themeColor( 'shading.contours.line' ), 'vec3' );
		const contourColor10  = uniform( cfg.themeColor( 'shading.contours.line10' ), 'vec3' );
		const baseColor       = uniform( cfg.themeColor( 'shading.contours.base' ), 'vec3' );

		const datumShift      = commonUniforms.datumShift;

		const zLine = positionLocal.z.add( zOffset).add( datumShift ).div( contourInterval );

		let f = fract( zLine );
		let f10 = fract( zLine.div( 10 ) );

		const df = fwidth( zLine );

		cond( f.greaterThan( 0.5 ), f = f.oneMinus() );
		cond( f.greaterThan( 0.5 ), f10 = f10.oneMinus() );

		const contourColorSelection = step( 0.81, f10 );

		const c = smoothstep( df.mul( 0.5 ), df, f );
		const finalColor = vec4( mix( contourColor, contourColor10, contourColorSelection ), 1.0 );

		this.opacityNode = mix( 1.0, materialOpacity, c );
		this.colorNode = mix( finalColor, baseColor, c );
		this.name = 'CV:ContourMaterial'

	}

}

export { ContourMaterial };