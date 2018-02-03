
function HudObject () {}

HudObject.stdWidth  = 40;
HudObject.stdMargin = 5;

HudObject.atlasSpec = {
	color: '#ffffff',
	font: 'normal helvetica,sans-serif'
};

HudObject.prototype.removeDomObjects = function () {

	var obj;

	for ( var i = 0, l = this.domObjects.length; i < l; i++ ) {

		obj = this.domObjects[ i ];

		obj.parentElement.removeChild( obj );

	}

	this.domObjects = [];

};

HudObject.prototype.setVisibility = function ( visible ) {

	this.visible = visible;

	const style = ( visible ? 'block' : 'none' );

	for ( var i = 0, l = this.domObjects.length; i < l; i++ ) {

		this.domObjects[ i ].style.display = style;

	}

};

export { HudObject };

// EOF