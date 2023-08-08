import { Float32BufferAttribute, Vector3, } from '../Three';
import { LineSegments2 } from './LineSegments2';
import { LineSegmentsGeometry } from './LineSegmentsGeometry';
import { Line2NodeMaterial } from '../Nodes';

class SurveyBox extends LineSegments2 {

	constructor ( ctx, box3, color = 0xffff00 ) {

		const v0 = new Vector3(  0.5,  0.5,  0.5 );
		const v1 = new Vector3( -0.5,  0.5,  0.5 );
		const v2 = new Vector3( -0.5, -0.5,  0.5 );
		const v3 = new Vector3(  0.5, -0.5,  0.5 );
		const v4 = new Vector3(  0.5,  0.5, -0.5 );
		const v5 = new Vector3( -0.5,  0.5, -0.5 );
		const v6 = new Vector3( -0.5, -0.5, -0.5 );
		const v7 = new Vector3(  0.5, -0.5, -0.5 );

		const vertices = [
			v0, v1,
			v1, v2,
			v2, v3,
			v3, v0,
			v4, v5,
			v5, v6,
			v6, v7,
			v7, v4,
			v0, v4,
			v1, v5,
			v2, v6,
			v3, v7
		];

		const positions = new Float32BufferAttribute( vertices.length * 3, 3 );
		const geometry = new LineSegmentsGeometry();

		vertices.forEach( ( v, i ) => { positions.setXYZ( i, v.x, v.y, v.z ); } );

		geometry.setPositions( positions.array );

		super( geometry, ctx.materials.getMaterial( Line2NodeMaterial, { color: color } ) );

		if ( box3 ) this.update( box3 );
		this.type = 'CV.SurveyBox';

	}

	update ( box3 ) {

		box3.getSize( this.scale );
		box3.getCenter( this.position );
		this.updateMatrix();
		this.updateWorldMatrix( true, true );

		this.geometry.computeBoundingSphere();

	}

	removed () {

		if ( this.geometry ) this.geometry.dispose();

	}

}

export { SurveyBox };