import {ValidationError} from '../../Error/ValidationError';
import {IRule} from '../Rule';

export interface BooleanOptions
{
	nullable?: boolean;
}

export class BooleanRule implements IRule
{
	readonly options: BooleanOptions;

	public constructor(options: BooleanOptions)
	{
		this.options = Object.assign({
			nullable: false
		}, options);
	}

	public validate(data: any, depth: string = ""): void
	{
		if(typeof data !== 'boolean' && !(this.options.nullable && data === null))
			throw new ValidationError("Data element " + (depth ? depth + " " : "") + "must be a boolean" + (this.options.nullable ? " or null" : ""));
	}
}