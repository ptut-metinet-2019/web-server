export interface IRule
{
	validate(data: any, depth?: string): void
}