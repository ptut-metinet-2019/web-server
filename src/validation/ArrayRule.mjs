import ValidationError from './ValidationError';

export default class ArrayRule
{
	constructor(innerRule)
	{
		this.innerRule = innerRule;
	}

	validate(data, depth = "")
	{
		if(typeof data !== 'array')
			throw new ValidationError("Data element " + (depth ? depth + " " : "") + "must be an array");

		for(var i of data)
			this.innerRule.validate(data[i], (depth ? depth + "." : "") + i);
	}
}