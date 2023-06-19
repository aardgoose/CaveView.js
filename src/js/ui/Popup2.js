import { BufferGeometry, Sprite } from '../Three';
import { LEG_CAVE } from '../core/constants';

class Popup2 extends Sprite {

	close () {

		this.removeFromParent();

		const material = this.materal;

		if ( ! material ) return;

		material.dispose();

		if ( material.texture ) material.texture.dispose();


	}

}

export { Popup2 };