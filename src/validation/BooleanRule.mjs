import ValidationError from './ValidationError';

export default class BooleanRule
{
	constructor(options = {})
	{
		this.options = Object.assign({
			nullable: false
		}, options);
	}

	validate(data, depth = "")
	{
		if(typeof data !== 'boolean' && !(this.options.nullable && data === null))
			throw new ValidationError("Data element " + (depth ? depth + " " : "") + "must be a boolean" + (this.options.nullable ? " or null" : ""));
	}
}