
import { HudObject } from './HudObject';
import { GlyphString } from '../core/GlyphString';
import { Materials } from '../materials/Materials';
import { Mesh, Group } from '../Three';


function Scale( container, geometry, material ) {

	const width  = container.clientWidth;
	const height = container.clientHeight;

	const stdWidth  = HudObject.stdWidth;
	const stdMargin = HudObject.stdMargin;

	const barOffset = 3 * ( stdWidth + stdMargin );

	const barHeight = ( height - barOffset ) / 2;
	const barWidth  = stdWidth / 2;

	this.barHeight = barHeight;
	this.barWidth = barWidth;

	this.offsetX = -barWidth / 2 - 5;
	this.offsetY = barHeight / 2;

	Group.call( this );

	// position on left side of container
	this.translateX(  width / 2  - barWidth / 2  - stdMargin );
	this.translateY( -height / 2 + barHeight / 2 + barOffset );

	this.scaleBar = new Mesh( geometry, material );

	this.textMaterial = Materials.getGlyphMaterial( HudObject.atlasSpec, 0 );

	this.add( this.scaleBar );

	this.min = null;
	this.max = null;
	this.caption = null;

}

Scale.prototype = Object.create( Group.prototype );

Scale.prototype.setRange = function ( min, max, caption ) {

	const offsetX = this.offsetX;
	const offsetY = this.offsetY;

	const material = this.textMaterial;

	if ( min !== this.min || max !== this.max ) {

		var i;

		for ( i = this.children.length; i--; ) {

			let obj = this.children[ i ];

			if ( obj.isRange ) this.remove( obj );

		}

		const topLabel = new GlyphString( Math.round( max ) + '\u202fm', material );
		const bottomLabel = new GlyphString( Math.round( min ) + '\u202fm', material );

		topLabel.translateX( offsetX - topLabel.getWidth() );
		bottomLabel.translateX( offsetX - bottomLabel.getWidth() );

		topLabel.translateY( offsetY - topLabel.getHeight() );
		bottomLabel.translateY( -offsetY );

		topLabel.isRange = true;
		bottomLabel.isRange = true;

		this.add( topLabel );
		this.add( bottomLabel );

		this.min = min;
		this.max = max;

	}

	this.setCaption( caption );

	return this;

};

Scale.prototype.setCaption = function ( text ) {

	var caption = this.caption;

	if ( caption !== null ) {

		// already have correct caption
		if ( caption.name === text ) return this;

		this.remove( caption );

	}

	caption = new GlyphString( text, this.textMaterial );
	caption.translateX( this.barWidth / 2 - caption.getWidth() );
	caption.translateY( this.offsetY + this.barWidth / 2 );

	this.add( caption );
	this.caption = caption;

	return this;

};

export { Scale };

// EOF