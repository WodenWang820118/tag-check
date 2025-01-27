import { Auditable } from '@utils';

export class AuditableEntity implements Auditable {
  createdAt!: Date;
  updatedAt?: Date;
}
