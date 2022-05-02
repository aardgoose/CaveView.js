import { Vector3, Group } from '../Three';
import { LineSegments2 } from '../core/LineSegments2';
import { LineSegmentsGeometry } from '../core/LineSegmentsGeometry';
import { Line2Material } from '../materials/Line2Material';

class CGeometry extends LineSegmentsGeometry {

	constructor( radius = 1, segments = 8, thetaStart = 0, thetaLength = Math.PI * 2 ) {

		super();

		this.type = 'CircleGeometry';

		segments = Math.max( 3, segments );

		const vertices = [];

		const vertex = new Vector3();

		for ( let s = 0, i = 3; s <= segments; s ++, i += 3 ) {

			const segment = thetaStart + s / segments * thetaLength;

			vertices.push( vertex.x, vertex.y, vertex.z );

			vertex.x = radius * Math.cos( segment );
			vertex.y = radius * Math.sin( segment );

			vertices.push( vertex.x, vertex.y, vertex.z );

		}

		this.setPositions( vertices );

	}

}


class Orb extends Group {

	constructor( hudObject ) {

		const stdWidth  = hudObject.stdWidth;
		// const stdMargin = hudObject.stdMargin;
		const ctx = hudObject.ctx;
		const cfg = hudObject.ctx.cfg;
		//const materials = hudObject.ctx.materials;

		super();


		this.name = 'CV.Orb';

		const g = new CGeometry( stdWidth, 32 );

		const m1 = new LineSegments2( g, new Line2Material( ctx, { color: 0xff0000 } ) );
		const m2 = new LineSegments2( g, new Line2Material( ctx, { color: 0x00ff00 } ) );
		const m3 = new LineSegments2( g, new Line2Material( ctx, { color: 0x0000ff, linewidth: 6 } ) );

		m1.material.linewidth = 5;

		m2.rotateX( Math.PI / 2 );
		m3.rotateY( Math.PI / 2 );

		this.addStatic( m1 );
		this.addStatic( m2 );
		this.addStatic( m3 );

		return;

	}

	set( camera ) {

		this.setRotationFromQuaternion( camera.quaternion );
		this.quaternion.invert();
		this.updateMatrix();

	}
}

export { Orb };