import { CommonTerrainMaterial } from './CommonTerrainMaterial';
import { fract, fwidth, step, mix, smoothstep, uniform, vec4, positionLocal, materialOpacity } from '../Nodes';

class ContourMaterial extends CommonTerrainMaterial {

	name = 'CV:ContourMaterial'

	constructor ( params = {}, ctx ) {

		const cfg = ctx.cfg;

		super( params, ctx );

		// FIXME survey specific
		const tu = ctx.materials.commonUniforms.terrain();

		const contourInterval = uniform( cfg.themeValue( 'shading.contours.interval' ) );
		const contourColor    = uniform( cfg.themeColor( 'shading.contours.line' ) );
		const contourColor10  = uniform( cfg.themeColor( 'shading.contours.line10' ) );
		const baseColor       = uniform( cfg.themeColor( 'shading.contours.base' ) );

		const zLine = positionLocal.z.add( tu.zOffset).add( tu.datumShift ).div( contourInterval );

		let f = fract( zLine );
		let f10 = fract( zLine.div( 10 ) );

		const df = fwidth( zLine );

		f = f.greaterThan( 0.5 ).cond( f.oneMinus(), f );
		f10 = f.greaterThan( 0.5 ).cond( f10.oneMinus(), f10 );

		const contourColorSelection = step( 0.81, f10 );

		const c = smoothstep( df.mul( 0.5 ), df, f );
		const finalColor = vec4( mix( contourColor, contourColor10, contourColorSelection ), 1.0 );

		this.colorNode = mix( finalColor, baseColor, c );
		this.opacityNode = mix( 1.0, materialOpacity, c );

	}

}

export { ContourMaterial };