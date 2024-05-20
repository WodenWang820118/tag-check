export class CreateConfigurationDto {
  id: string;
  title: string;
  description: string;
  value: string;
  createdAt?: Date;
  updatedAt?: Date;
}
