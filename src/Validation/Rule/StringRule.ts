import {ValidationError} from '../../Error/ValidationError';
import {IRule} from '../Rule';

export interface StringOptions
{
	nullable?: boolean;
	minLength?: number;
	maxLength?: number;
	regex?: RegExp;
}

export class StringRule implements IRule
{
	readonly options: StringOptions;

	public constructor(options: StringOptions)
	{
		this.options = Object.assign({
			nullable: false,
			minLength: null,
			maxLength: null,
			regex: null
		}, options);
	}

	public validate(data: any, depth: string = ""): void
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