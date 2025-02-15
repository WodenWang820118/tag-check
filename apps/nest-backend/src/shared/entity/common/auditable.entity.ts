import { Auditable } from '@utils';
import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

export class AuditableEntity implements Auditable {
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
