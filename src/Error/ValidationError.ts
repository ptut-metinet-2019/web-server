export class ValidationError extends Error
{
	public constructor(message: string)
	{
		super(message);

		Object.setPrototypeOf(this, ValidationError.prototype);
		this.name = this.constructor.name;
	}
}