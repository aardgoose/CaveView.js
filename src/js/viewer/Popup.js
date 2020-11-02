import { LEG_CAVE } from '../core/constants';
import { CommonAttributes } from '../core/CommonAttributes';
import { BufferGeometry, Mesh } from '../Three';

function PopupGeometry () {

	BufferGeometry.call( this );

	this.type = 'PopupGeometry';

	this.setIndex( CommonAttributes.index );
	this.setAttribute( 'position', CommonAttributes.position );

}

PopupGeometry.prototype = Object.create( BufferGeometry.prototype );

var commonGeometry = null;

function Popup( ctx ) {

	if ( commonGeometry === null ) commonGeometry = new PopupGeometry();

	Mesh.call( this, commonGeometry );

	this.layers.set( LEG_CAVE );
	this.type = 'Popup';
	this.renderOrder = Infinity;
	this.ctx = ctx;

	return this;

}

Popup.prototype = Object.create( Mesh.prototype );

Popup.prototype.close = function () {

	if ( this.parent ) this.parent.remove( this );
	if ( ! this.material ) return;

	this.material.dispose();
	this.material.texture.dispose();

};

export { Popup };