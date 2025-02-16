import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { AuditableEntity } from './common';
import { SysConfigurationSchema } from '@utils';

@Entity('sys_configuration')
export class SysConfigurationEntity
  extends AuditableEntity
  implements SysConfigurationSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
    unique: true
  })
  name!: string;

  @Column({
    name: 'value',
    type: 'varchar',
    length: 1000
  })
  value!: string;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true
  })
  description?: string;
}
