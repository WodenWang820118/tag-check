import {
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
  Res
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { SysConfigurationRepositoryService } from '../../core/repository/sys-configuration/sys-configuration-repository.service';
import { ProjectIoFacadeService } from '../../features/project-agent/project-io-facade/project-io-facade.service';
import { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';

/**
 * Exports a project as a zip, imports one, and deletes a project with its
 * folder.
 */
@Controller('projects')
export class ProjectIoController {
  private readonly logger = new Logger(ProjectIoController.name);
  constructor(
    private readonly projectIoFacadeService: ProjectIoFacadeService,
    private readonly configurationSerivce: SysConfigurationRepositoryService,
    private readonly projectRepositoryService: ProjectRepositoryService
  ) {}

  @Get('export/:projectSlug')
  async exportProject(@Param('projectSlug') projectSlug: string) {
    return await this.projectIoFacadeService.exportProject(projectSlug);
  }

  @Post('import')
  async importProject(
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply
  ) {
    const data = await request.file();
    if (!data) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    // Sanitize filename to prevent path traversal (e.g. '../etc/shadow.zip')
    const safeFilename = basename(data.filename);
    if (!safeFilename.endsWith('.zip')) {
      throw new HttpException(
        'Only zip files are allowed!',
        HttpStatus.BAD_REQUEST
      );
    }

    let uploadDirectory: string | undefined;
    try {
      const rootProjectPath =
        await this.configurationSerivce.getRootProjectPath();
      await mkdir(rootProjectPath, { recursive: true });
      uploadDirectory = await mkdtemp(join(rootProjectPath, '_upload_tmp_'));
      const filePath = join(uploadDirectory, safeFilename);
      await pipeline(data.file, createWriteStream(filePath));
      const importedSlug = await this.projectIoFacadeService.importProject(
        safeFilename.slice(0, -4),
        filePath,
        rootProjectPath
      );
      return reply.code(200).send({ projectSlug: importedSlug });
    } catch (error) {
      this.logger.error(error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error instanceof Error ? error.message : String(error),
        HttpStatus.BAD_REQUEST
      );
    } finally {
      if (uploadDirectory) {
        await rm(uploadDirectory, { recursive: true, force: true }).catch(
          () => {
            // Non-fatal: temp file cleanup is best-effort.
          }
        );
      }
    }
  }

  /** Remove files first; a folder error fails the request and keeps its rows. */
  @Delete('delete/:projectSlug')
  async deleteProject(@Param('projectSlug') projectSlug: string) {
    await this.projectIoFacadeService.deleteProject(projectSlug);
    return await this.projectRepositoryService.deleteBySlug(projectSlug);
  }
}
