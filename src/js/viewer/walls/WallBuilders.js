import { buildScraps } from './buildScraps';
import { buildCrossSections } from './buildCrossSections';
import { buildModels } from './buildModels';

function buildWallsSync ( surveyData, survey ) {

	buildScraps( surveyData, survey );
	buildCrossSections( surveyData, survey );
	buildModels( surveyData, survey );

}

export { buildWallsSync };