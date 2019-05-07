export class Request
{
	readonly id: string;
	readonly target: string;
	readonly action: string;
	readonly data: object;

	public constructor(id: string, target: string, action: string, data: object)
	{
		this.id = id;
		this.target = target;
		this.action = action;
		this.data = data;
	}
}