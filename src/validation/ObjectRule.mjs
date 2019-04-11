import ValidationError from './ValidationError';

export default class ObjectRule
{
	constructor(structure)
	{
		this.structure = structure;
	}

	validate(data, depth = null)
	{
		if(typeof data !== 'object')
			throw new ValidationError("Data element " + (depth ? depth + " " : "") + "must be an object");

		for(var k of Object.keys(this.structure))
		{
			if(typeof data[k] === 'undefined')
				throw new ValidationError("Missing data " + (depth ? depth + "." : "") + k + " property");

			this.structure[k].validate(data[k], (depth ? depth + "." : "") + k);
		}
	}
}