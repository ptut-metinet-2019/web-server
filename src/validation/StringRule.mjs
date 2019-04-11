import ValidationError from './ValidationError';

export default class StringRule
{
	constructor(options = {})
	{
		this.options = Object.assign({
			nullable: false,
			minLength: null,
			maxLength: null,
			regex: null
		}, options);
	}

	validate(data, depth = "")
	{
		if(typeof data !== 'string' && !(this.options.nullable && data === null))
			throw new ValidationError("Data element " + (depth ? depth + " " : "") + "must be a string" + (this.options.nullable ? " or null" : ""));

		if(data === null)
			return;

		if(this.options.minLength !== null && data.length < this.options.minLength)
			throw new ValidationError("Data element " + (depth ? depth + " " : "") + "must be at least " + this.options.minLength + " characters long");

		if(this.options.maxLength !== null && data.length > this.options.maxLength)
			throw new ValidationError("Data element " + (depth ? depth + " " : "") + "must be at most " + this.options.maxLength + " characters long");

		if(this.options.regex !== null && !this.options.regex.test(data))
			throw new ValidationError("Data element " + (depth ? depth + " " : "") + "is invalid");
	}
}