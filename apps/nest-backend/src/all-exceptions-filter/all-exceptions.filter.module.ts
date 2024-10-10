import { Module } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions-filter.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  imports: [FirebaseModule],
  providers: [AllExceptionsFilter, FirebaseService],
  exports: [AllExceptionsFilter, FirebaseService],
})
export class AllExceptionsFilterModule {}
