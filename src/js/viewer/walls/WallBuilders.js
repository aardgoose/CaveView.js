import { buildScraps } from './buildScraps';
import { buildCrossSections } from './buildCrossSections';
import { buildAlpha } from './buildAlpha';

function buildWallsSync ( cave, survey ) {

	buildScraps( cave, survey );
	buildCrossSections( cave, survey );

}

function buildWallsAsync ( survey ) {

	buildAlpha( survey );

}

export { buildWallsSync, buildWallsAsync };

// EOF