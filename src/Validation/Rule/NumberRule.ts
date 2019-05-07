import {ValidationError} from '../../Error/ValidationError';
import {IRule} from '../Rule';

export interface NumberOptions
{
	nullable?: boolean;
	floating?: boolean;
	min?: number;
	max?: number;
}

export class NumberRule implements IRule
{
	readonly options: NumberOptions;

	public constructor(options: NumberOptions)
	{
		this.options = Object.assign({
			nullable: false,
			floating: false,
			min: null,
			max: null
		}, options);
	}

	public validate(data: any, depth: string = ""): void
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