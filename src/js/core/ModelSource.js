class ModelSource {

	static lastId = 0;

	files = [];
	local = true;

	constructor ( files, local ) {

		this.files = files;
		this.local = local;
		this.id = ModelSource.lastId++;

	}

	static makeModelSourceFiles( files ) {

		const fileList = [];

		files.forEach( file => fileList.push( { name: file } ) );

		return new ModelSource( fileList, false );

	}

}

export { ModelSource };