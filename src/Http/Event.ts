export class Event
{
	readonly target: string;
	readonly action: string;
	readonly data: object;

	public constructor(target: string, action: string, data: object)
	{
		this.target = target;
		this.action = action;
		this.data = data;
	}
}