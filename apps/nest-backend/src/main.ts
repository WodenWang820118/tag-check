import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { SpelunkerModule } from 'nestjs-spelunker';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigsService } from './core/configs/configs.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'prod'
        ? ['error', 'warn']
        : ['error', 'warn', 'log', 'debug']
  });

  const configsService = app.get(ConfigsService);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false
  });
  // Handle uncaught exceptions
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
  if (process.env.NODE_ENV !== 'prod') {
    const config = new DocumentBuilder()
      .setTitle('Nest TagCheck')
      .setDescription('The Nest TagCheck API description')
      .setVersion('1.0')
      .addTag('datalayer')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await configsService.activatePort(app);

  process.on('SIGTERM', () => {
    void app.close().then(() => {
      process.exit(0);
    });
  });
}

void bootstrap();
