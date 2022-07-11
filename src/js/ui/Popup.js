import { BufferGeometry, Mesh } from '../Three';
import { LEG_CAVE } from '../core/constants';
import { CommonAttributes } from '../core/CommonAttributes';

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

	constructor ( ctx, renderOrder = Infinity ) {

		if ( Popup.commonGeometry === null ) Popup.commonGeometry = new PopupGeometry();

		super( Popup.commonGeometry );

		this.layers.set( LEG_CAVE );
		this.renderOrder = renderOrder;
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