class ModelSource {

	static lastId = 0;

	name = null;
	files = [];
	local = true;

	constructor ( files, local ) {

		this.files = files;
		this.local = local;
		this.id = ModelSource.lastId++;

	}

	addFile ( file ) {

		this.files.push( file );

	}

	getNames () {

		return this.files.map( v => v.name );

	}

	static makeModelSourceFiles( files ) {

		const source = new ModelSource( [], false );

		files.forEach( file => source.addFile( { name: file } ) );

		return source;

	}

}

export { ModelSource };