class ModelSource {

	static lastId = 0;

	files = [];
	local = true;

	constructor ( files, local ) {

		this.files = files;
		this.local = local;
		this.id = ModelSource.lastId++;

	}
}

export { ModelSource };