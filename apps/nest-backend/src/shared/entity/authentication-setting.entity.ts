import { AuthenticationSchema } from '@utils';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { AuditableEntity } from './common';

@Entity('authentication_setting')
export class AuthenticationSettingEntity
  extends AuditableEntity
  implements AuthenticationSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'username',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Authentication username'
  })
  username!: string;

  @Column({
    name: 'password',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Authentication password - should be encrypted before storage',
    select: false // Security: Don't select password by default
  })
  password!: string;

  @OneToOne(() => ProjectEntity, (project) => project.authenticationSettings, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({
    name: 'project_id',
    referencedColumnName: 'id'
  })
  project!: ProjectEntity;
}
