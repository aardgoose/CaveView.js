import { LEG_CAVE } from '../core/constants';
import { CommonAttributes } from '../core/CommonAttributes';
import { BufferGeometry, Mesh } from '../Three';

class PopupGeometry extends BufferGeometry {

	type = 'PopupGeometery';

	constructor () {

		super();

		this.setIndex( CommonAttributes.index );
		this.setAttribute( 'position', CommonAttributes.position );

	}

}

class Popup extends Mesh {

	static commonGeometry = null;

	type = 'Popup';

	constructor ( ctx ) {

		if ( Popup.commonGeometry === null ) Popup.commonGeometry = new PopupGeometry();

		super( Popup.commonGeometry );

		this.layers.set( LEG_CAVE );
		this.renderOrder = Infinity;
		this.ctx = ctx;

	}

	close () {

		this.removeFromParent();

		const material = this.materal;

		if ( ! material ) return;

		material.dispose();

		if ( material.texture ) material.texture.dispose();


	}

}

export { Popup };