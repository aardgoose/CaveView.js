import { BufferGeometry, Float32BufferAttribute, Group, Mesh } from '../Three';
import { MutableGlyphString } from '../core/GlyphString';
import { MeshBasicNodeMaterial } from '../../../node_modules/three/examples/jsm/nodes/Nodes.js';

class BarGeometry extends BufferGeometry {

	constructor ( ctx, length, height, divisions ) {

		super();

		const cfg = ctx.cfg;

		const c1 = cfg.themeColor( 'hud.scale.bar1' );
		const c2 = cfg.themeColor( 'hud.scale.bar2' );

		const size = divisions * 11 * 6 * 3;

		const colorBuffer = new Float32BufferAttribute( size, 3 );
		const positions = new Float32BufferAttribute( size, 3 );

		let vertex = 0;

		_makeBar( divisions * 10, 0 );
		_makeBar( divisions, height + 1 );

		this.setAttribute( 'position', positions );
		this.setAttribute( 'color', colorBuffer );

		function _makeBar( divisions, offset ) {

			const dWidth = length / divisions;

			for ( let i = 0; i < divisions; i++ ) {

				const x1 = i * dWidth;
				const x2 = x1 + dWidth;
				const y1 = offset;
				const y2 = y1 + height;

				const c = ( i % 2 ) ? c1 : c2;

				positions.setXYZ( vertex, x1, y1, 0 );
				colorBuffer.setXYZ( vertex++, c.r, c.g, c.b );

				positions.setXYZ( vertex, x2, y2, 0 );
				colorBuffer.setXYZ( vertex++, c.r, c.g, c.b );

				positions.setXYZ( vertex, x1, y2, 0 );
				colorBuffer.setXYZ( vertex++, c.r, c.g, c.b );

				positions.setXYZ( vertex, x2, y2, 0 );
				colorBuffer.setXYZ( vertex++, c.r, c.g, c.b );

				positions.setXYZ( vertex, x1, y1, 0 );
				colorBuffer.setXYZ( vertex++, c.r, c.g, c.b );

				positions.setXYZ( vertex, x2, y1, 0 );
				colorBuffer.setXYZ( vertex++, c.r, c.g, c.b );

			}

		}
	}

}

class ScaleBar extends Group {

	constructor ( hudObject, container, hScale, rightMargin ) {

		const leftMargin = 10;
		const materials = hudObject.ctx.materials;

		super();

		this.name = 'CV.ScaleBar';

		this.hScale        = hScale;
		this.scaleBars     = [];
		this.currentLength = 0;
		this.wScale = container.clientHeight / container.clientWidth;
		this.hudObject = hudObject;

		this.position.set( -container.clientWidth / 2 + 45, -container.clientHeight / 2 + leftMargin, 0 );
		this.scaleMax = container.clientWidth - ( 40 + leftMargin + rightMargin );

		const material = materials.getGlyphMaterial( 'hud.text' );
		const label = new MutableGlyphString( '--------', material );

		label.translateX( 0 );
		label.translateY( 10 );

		this.add( label );

		this.label = label;

	}

	setScale ( scale ) {

		const scaleBars = this.scaleBars;
		const self = this;
		const ctx = this.hudObject.ctx;

		const maxVisible = this.scaleMax / ( scale * this.hScale );

		let exponent = Math.ceil( Math.log( maxVisible ) / Math.LN10 ) - 1;

		const rMax   = Math.pow( 10, exponent );
		const maxInc = maxVisible / rMax;

		let legendText;
		let length = 0;

		if ( maxInc < 2 ) {

			length = 10;
			exponent = exponent - 1;

		} else if ( maxInc < 5 ) {

			length = 2;

		} else {

			length = 5;

		}

		if ( exponent >= 3 ) {

			legendText = length * Math.pow( 10, exponent - 3) + '\u202fkm';

		} else {

			legendText = length * Math.pow( 10, exponent ) + '\u202fm';

		}

		scale = scale * Math.pow( 10, exponent );

		if ( this.currentLength !== length ) {

			if ( ! scaleBars[ length ] ) {

				const bar = _makeScaleBar( length );

				scaleBars[ length ] = bar;
				this.add( bar.mesh );

			}

			if ( this.currentLength > 0 ) {

				scaleBars[ this.currentLength ].mesh.visible = false;

			}

			scaleBars[ length ].mesh.visible = this.visible;
			this.currentLength = length;

		}

		scaleBars[ length ].mesh.scale.x = scale;

		const label = this.label;

		label.replaceString( legendText.padStart( 8, ' ' ) );

		const w = label.getWidth();

		label.translateX( scale * scaleBars[ length ].topRight - label.position.x - w );

		return this;

		function _makeScaleBar ( length ) {

			const bar = new BarGeometry( ctx, length * self.hScale, 4, length );

			bar.computeBoundingBox();

			return {
				mesh: new Mesh( bar, ctx.materials.getMaterial( MeshBasicNodeMaterial, { vertexColors: true } ) ),
				topRight: bar.boundingBox.max.x
			};

		}

	}

}

export { ScaleBar };