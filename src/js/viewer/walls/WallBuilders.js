import { buildScraps } from './buildScraps';
import { buildCrossSections } from './buildCrossSections';

function buildWallsSync ( cave, survey ) {

	buildScraps( cave, survey );
	buildCrossSections( cave, survey );

}


export { buildWallsSync };

// EOF