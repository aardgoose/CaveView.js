

function HudObject () {};

HudObject.stdWidth  = 40;
HudObject.stdMargin = 5;

HudObject.prototype.removeDomObjects = function () {

	var obj;

	for ( var i = 0, l = this.domObjects.length; i < l; i++ ) {

		obj = this.domObjects[ i ];

		obj.parentElement.removeChild( obj );

	}

	this.domObjects = [];

}

HudObject.prototype.setVisibility = function ( visible ) {

	var style;

	this.visible = visible;

	style = ( visible ? style = "block" : style = "none" );

	for ( var i = 0, l = this.domObjects.length; i < l; i++ ) {

		this.domObjects[ i ].style.display = style;

	}

}

export { HudObject };

// EOF