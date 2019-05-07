import {ValidationError} from '../Error/ValidationError';
import {IRule} from './Rule';

export class Validator
{
	readonly rule: IRule;

	public constructor(rule: IRule)
	{
		this.rule = rule;
	}

	public validate(data: any): void
	{
		if(typeof data === 'undefined')
			throw new ValidationError('Data element is undefined');
		
		this.rule.validate(data);
	}
}