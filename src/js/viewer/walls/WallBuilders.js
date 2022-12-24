import { buildScraps } from './buildScraps';
import { buildCrossSections } from './buildCrossSections';
import { buildModels } from './buildModels';

function buildWallsSync ( cave, survey ) {

	buildScraps( cave, survey );
	buildCrossSections( cave, survey );
	buildModels( cave, survey );

}

export { buildWallsSync };