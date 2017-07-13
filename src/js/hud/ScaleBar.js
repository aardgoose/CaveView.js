
import { HudObject } from './HudObject';
import { ColourCache } from '../core/ColourCache';

import {
	Vector3,
	Geometry, PlaneGeometry,
	LineBasicMaterial, MeshBasicMaterial,
	FaceColors, FrontSide,
	LineSegments, Group, Mesh
} from '../../../../three.js/src/Three';

function ScaleBar ( container, hScale, rightMargin ) {

	var leftMargin = 10;

	Group.call( this );

	this.name = 'CV.ScaleBar';
	this.domObjects = [];

	this.hScale        = hScale;
	this.scaleBars     = [];
	this.currentLength = 0;

	this.position.set( -container.clientWidth / 2 + 5, -container.clientHeight / 2 + leftMargin, 0 );
	this.scaleMax = container.clientWidth - ( leftMargin + rightMargin );

	var legend = document.createElement( 'div' );

	legend.classList.add( 'scale-legend' );
	legend.textContent = '';

	container.appendChild( legend );

	this.legend = legend;
	this.domObjects.push( legend );

	this.addEventListener( 'removed', this.removeDomObjects );

	return this;

}

ScaleBar.prototype = Object.create( Group.prototype );

Object.assign( ScaleBar.prototype, HudObject.prototype );

ScaleBar.prototype.constructor = ScaleBar;

ScaleBar.prototype.setVisibility = function ( visible ) {

	console.warn( 'sv', visible );
	HudObject.prototype.setVisibility.call( this, visible );

	if ( this.currentLength !== 0 ) this.scaleBars[ this.currentLength ].mesh.visible = visible;

}

ScaleBar.prototype.setScale = function ( scale ) {

	var scaleBars = this.scaleBars;
	var length = 0;
	var self = this;

	var maxVisible = this.scaleMax / ( scale * this.hScale );
	var exponent = Math.ceil( Math.log( maxVisible ) / Math.LN10 ) - 1;
	var rMax     = Math.pow( 10, exponent );
	var maxInc   = maxVisible / rMax;
	var legendText;

	if ( maxInc < 2 ) {

		length = 10;
		exponent = exponent - 1;

	} else if ( maxInc < 5 ) {

		length = 2;

	} else {

		length = 5;

	}

	if ( exponent >= 3 ) {

		legendText = length * Math.pow( 10, exponent - 3) + 'km';

	} else {

		legendText = length * Math.pow( 10, exponent ) + 'm';

	}

	scale = scale * Math.pow( 10, exponent );

	if ( this.currentLength !== length ) {

		if ( ! scaleBars[ length ] ) {

			var bar = _makeScaleBar( length );

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

	var legend = this.legend;

	legend.style.display = this.visible ? 'block' : 'none';
	legend.style.left = ( scale * scaleBars[ length ].topRight - legend.clientWidth ) + 'px';

	legend.textContent = legendText;

	return this;

	function _makeScaleBar ( length ) {

		var height = 4;
		var rLength = length * self.hScale;
		var i, l;

		var bar  = new PlaneGeometry( rLength, height, length );
		var bar2 = new PlaneGeometry( rLength, height, length * 10 );
		var line = new Geometry();

		line.vertices.push( new Vector3( -rLength / 2, 0, 1 ) );
		line.vertices.push( new Vector3(  rLength / 2, 0, 1 ) );

		var mBar  = new Mesh( bar,  new MeshBasicMaterial( { color: 0xffffff, vertexColors: FaceColors, side: FrontSide } ) );
		var mBar2 = new Mesh( bar2, new MeshBasicMaterial( { color: 0xffffff, vertexColors: FaceColors, side: FrontSide } ) );
		var mLine = new LineSegments( line, new LineBasicMaterial( { color: 0xff0000 } ) );

		for ( i = 0, l = bar.faces.length; i < l; i = i + 4 ) {

			bar.faces[ i ].color = ColourCache.red;
			bar.faces[ i + 1 ].color = ColourCache.red;

		}

		for ( i = 0, l = bar2.faces.length; i < l; i = i + 4 ) {

			bar2.faces[ i ].color = ColourCache.red;
			bar2.faces[ i + 1 ].color = ColourCache.red;

		}

		bar.translate( rLength / 2, height + height / 2 + 1, 0 );
		bar2.translate( rLength / 2, height / 2, 0 );
		line.translate( rLength / 2, height, 0 );

		bar.computeBoundingBox();

		var group = new Group();

		group.add( mBar );
		group.add( mBar2 );
		group.add( mLine );

		return { mesh: group, topRight: bar.boundingBox.max.x };

	}

};

export { ScaleBar };

// EOF