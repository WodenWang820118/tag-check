import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SpelunkerModule } from 'nestjs-spelunker';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './all-exceptions-filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Handle uncaught exceptions
  app.useGlobalFilters(new AllExceptionsFilter());
  // 1. Generate the tree as text
  const tree = SpelunkerModule.explore(app);
  const root = SpelunkerModule.graph(tree);
  const edges = SpelunkerModule.findGraphEdges(root);
  const mermaidEdges = edges
    .filter(
      // I'm just filtering some extra Modules out
      ({ from, to }) =>
        !(
          from.module.name === 'ConfigHostModule' ||
          from.module.name === 'LoggerModule' ||
          to.module.name === 'ConfigHostModule' ||
          to.module.name === 'LoggerModule'
        )
    )
    .map(({ from, to }) => `${from.module.name}-->${to.module.name}`);
  // console.log(`graph TD\n\t${mermaidEdges.join('\n\t')}`);

  // 2. Copy and paste the log content in "https://mermaid.live/"

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Nest DataLayer Checker')
    .setDescription('The Nest DataLayer Checker API description')
    .setVersion('1.0')
    .addTag('datalayer')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(8080);
}
bootstrap();
