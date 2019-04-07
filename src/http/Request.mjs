export default class Request
{
	constructor(id, device, target, action, data = {})
	{
		this.id = id;
		this.device = device;
		this.target = target;
		this.action = action;
		this.data = data;
	}
}