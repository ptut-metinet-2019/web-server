export class Response
{
	readonly status: number;
	readonly data: object;

	public constructor(status: number, data: object = null)
	{
		this.status = status;
		this.data = data;
	}
}