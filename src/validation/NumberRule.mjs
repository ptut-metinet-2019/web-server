import ValidationError from './ValidationError';

export default class NumberRule
{
	constructor(options = {})
	{
		this.options = Object.assign({
			nullable: false,
			floating: false,
			min: null,
			max: null
		}, options);
	}

	validate(data, depth = "")
	{
		if(typeof data !== 'number' && !(this.options.nullable && data === null))
			throw new ValidationError("Data element " + (depth ? depth + " " : "") + "must be a number" + (this.options.nullable ? " or null" : ""));

		if(data === null)
			return;

		if(!this.options.floating && (data % 1 !== 0))
			throw new ValidationError("Data element " + (depth ? depth + " " : "") + "must not be a floating number");

		if(this.options.min !== null && data < this.options.min)
			throw new ValidationError("Data element " + (depth ? depth + " " : "") + "must not be less than " + this.options.min);

		if(this.options.max !== null && data > this.options.max)
			throw new ValidationError("Data element " + (depth ? depth + " " : "") + "must not be greater than " + this.options.max);
	}
}