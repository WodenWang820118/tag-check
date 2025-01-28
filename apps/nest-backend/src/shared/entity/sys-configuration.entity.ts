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

  @Column()
  name!: string;

  @Column()
  value!: string;

  @Column()
  description?: string;
}
