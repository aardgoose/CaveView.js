import {
	SpriteMaterial,
	Texture,
	Sprite
} from '../../../../three.js/src/Three';

function Label ( text ) {

	var canvas = document.createElement( "canvas" );

	if ( !canvas ) alert( "OOPS" );

	var ctx = canvas.getContext( "2d" );

	if ( !ctx ) alert( "OOPS" );

	var fontSize = 44;
	var textHeight = 64;

	ctx.font = "normal " + fontSize + "px helvetica,sans-serif"

	var textWidth = ctx.measureText( text ).width;
	var actualFontSize = 0.4;

	// make sure width is power of 2
	var realTextWidth = textWidth;

	textWidth = Math.pow( 2, Math.ceil( Math.log( textWidth ) / Math.LN2 ) );

	canvas.width  = textWidth;
	canvas.height = textHeight;

	ctx.fillStyle = "rgba( 0, 0, 0, 0 )";
	ctx.fillRect( 0, 0, canvas.width, canvas.height );

	ctx.fillStyle = "rgba( 0, 0, 0, 0.6 )";
	ctx.fillRect( ( canvas.width - realTextWidth ) / 2 - 10, 0, realTextWidth + 20, canvas.height );

	ctx.textAlign = "center";
	ctx.font = "normal " + fontSize + "px helvetica,sans-serif"; // repeated because canvas sizing resets canvas properties
	ctx.fillStyle = "#ffffff";
	ctx.fillText( text, textWidth/2, textHeight - 18 );

	var texture = new Texture( canvas );
	texture.needsUpdate = true;

	Sprite.call( this, new SpriteMaterial( { map: texture, fog: true } ) );

	this.type = "CV.Label";
	this.scale.set( ( textWidth * actualFontSize) / 0.8, actualFontSize * textHeight, 10 );

};

Label.prototype = Object.create( Sprite.prototype );

Label.prototype.constructor = Label;

export { Label };

// EOF