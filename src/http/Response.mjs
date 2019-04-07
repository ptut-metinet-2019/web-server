export default class Response
{
	constructor(request, status, data)
	{
		this.request = request;
		this.status = status;
		this.data = data;
	}
}