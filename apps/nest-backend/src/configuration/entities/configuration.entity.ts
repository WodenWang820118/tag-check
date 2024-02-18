import { Column, Table, Model } from 'sequelize-typescript';

@Table({ tableName: 'configuration' })
export class Configuration extends Model {
  @Column
  title: string;
  @Column
  description: string;
  @Column
  value: string;
}
