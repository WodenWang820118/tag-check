import { Column, Table, Model, PrimaryKey } from 'sequelize-typescript';

@Table({ tableName: 'configurations' })
export class Configuration extends Model {
  @PrimaryKey
  @Column
  id: string;
  @Column
  title: string;
  @Column
  description: string;
  @Column
  value: string;
  @Column
  createdAt?: Date;
  @Column
  updatedAt?: Date;
}
