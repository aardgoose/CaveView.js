import { buildScraps } from './buildScraps';
import { buildCrossSections } from './buildCrossSections';
import { buildAlpha } from './buildAlpha';

function buildWalls ( cave, survey ) {

	buildScraps( cave, survey );
	buildCrossSections( cave, survey );
	buildAlpha( survey );

}

export { buildWalls };

// EOF