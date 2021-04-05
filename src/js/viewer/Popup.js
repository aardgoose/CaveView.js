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

class Popup extends Mesh {

	constructor ( ctx ) {

		if ( commonGeometry === null ) commonGeometry = new PopupGeometry();

		super( commonGeometry );

		this.layers.set( LEG_CAVE );
		this.type = 'Popup';
		this.renderOrder = Infinity;
		this.ctx = ctx;

	}

}

Popup.prototype.close = function () {

	if ( this.parent ) this.parent.remove( this );

	const material = this.materal;

	if ( ! material ) return;

	material.dispose();

	if ( material.texture) material.texture.dispose();


};

export { Popup };