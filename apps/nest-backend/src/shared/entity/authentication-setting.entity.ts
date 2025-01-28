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

@Entity('authentication_settings')
export class AuthenticationSettingEntity
  extends AuditableEntity
  implements AuthenticationSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  username!: string;

  @Column()
  password!: string;

  @OneToOne(() => ProjectEntity, (project) => project.id)
  @JoinColumn({ name: 'projectId' })
  project!: ProjectEntity;
}
