import {ValidationError} from '../../Error/ValidationError';
import {IRule} from '../Rule';

export class ObjectRule implements IRule
{
	readonly structure: object;

	public constructor(structure: object)
	{
		this.structure = structure;
	}

	public validate(data: any, depth: string = ""): void
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