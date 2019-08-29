
import { HudObject } from './HudObject';
import { Cfg } from '../core/lib';
import { MutableGlyphString } from '../core/GlyphString';
import { Materials } from '../materials/Materials';

import {
	Float32BufferAttribute,
	BufferGeometry,
	LineBasicMaterial, MeshBasicMaterial,
	FaceColors,
	LineSegments, Group, Mesh
} from '../Three';

function BarGeometry ( length, height, divisions ) {

	BufferGeometry.call( this );

	const c1 = Cfg.themeColor( 'hud.scale.bar1' );
	const c2 = Cfg.themeColor( 'hud.scale.bar2' );

	const dWidth = length / divisions;
	const vertices = [];
	const colors = [];

	var i;

	for ( i = 0; i < divisions; i++ ) {

		vertices.push(
			i * dWidth, 0, 0,
			( i + 1 ) * dWidth, height, 0,
			i * dWidth, height, 0,
			( i + 1 ) * dWidth, height, 0,
			i * dWidth, 0, 0,
			( i + 1 ) * dWidth, 0, 0
		);

		const c = ( i % 2 ) ? c1 : c2;
		colors.push( c, c, c, c, c, c );

	}

	const colorBuffer = new Float32BufferAttribute( colors.length * 3, 3 );

	this.addAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
	this.addAttribute( 'color', colorBuffer.copyColorsArray( colors ) );

}

BarGeometry.prototype = Object.create( BufferGeometry.prototype );

function ScaleBar ( container, hScale, rightMargin ) {

	const leftMargin = 10;

	Group.call( this );

	this.name = 'CV.ScaleBar';

	this.hScale        = hScale;
	this.scaleBars     = [];
	this.currentLength = 0;
	this.wScale = container.clientHeight / container.clientWidth;

	this.position.set( -container.clientWidth / 2 + 45, -container.clientHeight / 2 + leftMargin, 0 );
	this.scaleMax = container.clientWidth - ( 40 + leftMargin + rightMargin );

	const material = Materials.getGlyphMaterial( HudObject.atlasSpec, 0 );
	const label = new MutableGlyphString( '--------', material );

	label.translateX( 0 );
	label.translateY( 10 );

	this.add( label );

	this.label = label;

	return this;

}

ScaleBar.prototype = Object.create( Group.prototype );

ScaleBar.prototype.setScale = function ( scale ) {

	const scaleBars = this.scaleBars;
	const self = this;

	const maxVisible = this.scaleMax / ( scale * this.hScale );

	var exponent = Math.ceil( Math.log( maxVisible ) / Math.LN10 ) - 1;

	const rMax   = Math.pow( 10, exponent );
	const maxInc = maxVisible / rMax;

	var legendText;
	var length = 0;

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

		const height = 4;
		const rLength = length * self.hScale;

		const line = new BufferGeometry();
		const vertices = [];

		vertices.push( 0, height, 1 );
		vertices.push( rLength, height, 1 );

		const positions = new Float32BufferAttribute( vertices.length, 3 );

		line.addAttribute( 'position', positions.copyArray( vertices ) );

		const sb = Cfg.themeValue( 'hud.scale.bar1' );

		const mLine = new LineSegments( line, new LineBasicMaterial( { color: sb } ) );

		const bar = new BarGeometry( rLength, height, length );
		const bar2 = new BarGeometry( rLength, height, length * 10 );

		bar.translate( 0, height + 1, 0 );

		const mBar = new Mesh( bar, new MeshBasicMaterial( { color: 0xffffff, vertexColors: FaceColors } ) );
		const mBar2 = new Mesh( bar2, new MeshBasicMaterial( { color: 0xffffff, vertexColors: FaceColors } ) );

		bar.computeBoundingBox();

		const group = new Group();

		group.addStatic( mBar );
		group.addStatic( mBar2 );
		group.addStatic( mLine );

		return { mesh: group, topRight: bar.boundingBox.max.x };

	}

};

export { ScaleBar };

// EOF