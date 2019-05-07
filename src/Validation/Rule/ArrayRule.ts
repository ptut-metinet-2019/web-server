import {ValidationError} from '../../Error/ValidationError';
import {IRule} from '../Rule';

export class ArrayRule implements IRule
{
	readonly sub: IRule;

	public constructor(sub: IRule)
	{
		this.sub = sub;
	}

	public validate(data: any, depth: string = ""): void
	{
		if(!(data instanceof Array))
			throw new ValidationError("Data element " + (depth ? depth + " " : "") + "must be an array");

		for(var i of data)
			this.sub.validate(data[i], (depth ? depth + "." : "") + i);
	}
}