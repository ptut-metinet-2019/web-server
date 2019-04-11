import ValidationError from './ValidationError';

export default class Validator
{
	constructor(rule)
	{
		this.rule = rule;
	}

	validate(data)
	{
		if(typeof data === 'undefined')
			throw new ValidationError('Data element is undefined');

		this.rule.validate(data);
	}
}