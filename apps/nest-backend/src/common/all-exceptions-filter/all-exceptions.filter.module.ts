import { Module } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions-filter.service';
import { FirebaseModule } from '../../infrastructure/firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  providers: [AllExceptionsFilter],
  exports: [AllExceptionsFilter, FirebaseModule]
})
export class AllExceptionsFilterModule {}
