export class Response
{
	readonly status: number;
	readonly data: any;

	public constructor(status: number, data: any = null)
	{
		this.status = status;
		this.data = data;
	}
}