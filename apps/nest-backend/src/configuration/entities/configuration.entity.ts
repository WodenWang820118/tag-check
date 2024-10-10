import { Column, Table, Model, PrimaryKey } from 'sequelize-typescript';

@Table({ tableName: 'configurations' })
export class Configuration extends Model {
  @PrimaryKey
  @Column({
    allowNull: false,
  })
  declare id: string;
  @Column({
    allowNull: false,
  })
  declare title: string;
  @Column({
    allowNull: false,
    defaultValue: '',
  })
  declare description: string;
  @Column({
    allowNull: false,
  })
  declare value: string;
  @Column({
    allowNull: false,
    defaultValue: new Date(),
  })
  declare createdAt?: Date;
  @Column({
    allowNull: false,
    defaultValue: new Date(),
  })
  declare updatedAt?: Date;
}
