import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SpelunkerModule } from 'nestjs-spelunker';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './all-exceptions-filter';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  // Handle uncaught exceptions
  app.useGlobalFilters(new AllExceptionsFilter());
  // 1. Generate the tree as text
  // const tree = SpelunkerModule.explore(app);
  // const root = SpelunkerModule.graph(tree);
  // const edges = SpelunkerModule.findGraphEdges(root);
  // const mermaidEdges = edges
  //   .filter(
  //     // I'm just filtering some extra Modules out
  //     ({ from, to }) =>
  //       !(
  //         from.module.name === 'ConfigHostModule' ||
  //         from.module.name === 'LoggerModule' ||
  //         to.module.name === 'ConfigHostModule' ||
  //         to.module.name === 'LoggerModule' ||
  //         to.module.name === 'SequelizeModule' ||
  //         to.module.name === 'SequelizeCoreModule' ||
  //         to.module.name === 'ConfigModule'
  //       )
  //   )
  //   .map(({ from, to }) => `${from.module.name}-->${to.module.name}`);
  // console.log(`graph TD\n\t${mermaidEdges.join('\n\t')}`);

  // 2. Copy and paste the log content in "https://mermaid.live/"

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Nest TagCheck')
    .setDescription('The Nest TagCheck API description')
    .setVersion('1.0')
    .addTag('datalayer')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  if (process.env.NODE_ENV === 'dev') {
    Logger.log('Listening on port 8080');
    await app.listen(8080);
  } else if (process.env.NODE_ENV === 'staging') {
    Logger.log('Listening on port 3000');
    await app.listen(5000);
  } else {
    // not specified will be production
    Logger.log('Listening on port 80');
    await app.listen(80);
  }
}
bootstrap();
